import * as THREE from "three";
import { CONFIG } from "./config.js";
import { createControls } from "./controls.js";
import { createVillage } from "./village.js";

function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !CONFIG.quality.low,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, CONFIG.quality.pixelRatio),
  );
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = CONFIG.quality.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  return renderer;
}

function createCamera() {
  return new THREE.PerspectiveCamera(
    CONFIG.camera.fieldOfView,
    window.innerWidth / window.innerHeight,
    CONFIG.camera.near,
    CONFIG.camera.far,
  );
}

function createBackdropUpdater(camera, backdrop) {
  const viewDirection = new THREE.Vector3();
  return () => {
    const distance = camera.far * CONFIG.camera.backdropDistance;
    camera.getWorldDirection(viewDirection);
    backdrop.position
      .copy(camera.position)
      .addScaledVector(viewDirection, distance);
    backdrop.quaternion.copy(camera.quaternion);
    const height =
      2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance * 1.1;
    backdrop.scale.set(height * camera.aspect, height, 1);
  };
}

function beginJump(jumpState) {
  if (!jumpState.airborne) {
    jumpState.verticalVelocity = CONFIG.movement.jumpVelocity;
    jumpState.airborne = true;
  }
}

function movePlayer(player, input, delta, jumpState, controls) {
  const now = performance.now();
  if (controls.consumeCluck()) {
    jumpState.cluckEndsAt = now + CONFIG.animation.cluckDuration;
    beginJump(jumpState);
  }
  if (controls.consumeJump()) {
    beginJump(jumpState);
  }

  const inputLength = Math.hypot(input.x, input.z);
  const moveX = Math.sin(input.yaw) * input.z + Math.cos(input.yaw) * input.x;
  const moveZ = Math.cos(input.yaw) * input.z - Math.sin(input.yaw) * input.x;
  player.position.x = THREE.MathUtils.clamp(
    player.position.x + moveX * CONFIG.movement.walkSpeed * delta,
    CONFIG.movement.minimumX,
    CONFIG.movement.maximumX,
  );
  player.position.z = THREE.MathUtils.clamp(
    player.position.z + moveZ * CONFIG.movement.walkSpeed * delta,
    CONFIG.movement.minimumZ,
    CONFIG.movement.maximumZ,
  );
  if (inputLength > 0.05) {
    player.rotation.y = Math.atan2(moveX, moveZ);
  }

  if (jumpState.airborne) {
    player.position.y += jumpState.verticalVelocity * delta;
    jumpState.verticalVelocity -= CONFIG.movement.gravity * delta;
    if (player.position.y <= 0) {
      player.position.y = 0;
      jumpState.verticalVelocity = 0;
      jumpState.airborne = false;
    }
  }

  return {
    walkingAmount: inputLength,
    clucking: now < jumpState.cluckEndsAt,
  };
}

function updateFollowCamera(
  camera,
  player,
  input,
  delta,
  cameraGoal,
  lookTarget,
) {
  cameraGoal.set(
    player.position.x - Math.sin(input.yaw) * CONFIG.camera.distance,
    player.position.y + CONFIG.camera.height,
    player.position.z - Math.cos(input.yaw) * CONFIG.camera.distance,
  );
  const followAmount = 1 - Math.exp(-CONFIG.camera.followSpeed * delta);
  camera.position.lerp(cameraGoal, followAmount);
  lookTarget.set(
    player.position.x + Math.sin(input.yaw) * CONFIG.camera.lookAhead,
    player.position.y + CONFIG.camera.lookTargetHeight,
    player.position.z + Math.cos(input.yaw) * CONFIG.camera.lookAhead,
  );
  camera.lookAt(lookTarget);
  camera.updateMatrixWorld();
}

function createRenderLoop({
  renderer,
  scene,
  camera,
  village,
  controls,
  player,
}) {
  const clock = new THREE.Clock();
  const cameraGoal = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();
  const jumpState = { verticalVelocity: 0, airborne: false, cluckEndsAt: 0 };
  const updateBackdrop = createBackdropUpdater(camera, village.backdrop);

  return function renderFrame() {
    const delta = Math.min(clock.getDelta(), 0.05);
    const input = controls.readMovement();
    const motion = movePlayer(player, input, delta, jumpState, controls);
    village.animate(clock.elapsedTime, motion.walkingAmount, motion.clucking);
    updateFollowCamera(camera, player, input, delta, cameraGoal, lookTarget);
    updateBackdrop();
    renderer.render(scene, camera);
    requestAnimationFrame(renderFrame);
  };
}

export async function startVillageGame({
  canvas,
  controlsElements,
  statusMessage,
}) {
  const renderer = createRenderer(canvas);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(CONFIG.colors.mist);
  const camera = createCamera();
  const village = await createVillage(scene);
  const controls = createControls({
    ...controlsElements,
    canvas,
    config: CONFIG,
  });
  const player = village.chicken;

  camera.position.set(
    player.position.x,
    player.position.y + CONFIG.camera.height,
    player.position.z - CONFIG.camera.distance,
  );
  camera.lookAt(
    player.position.x,
    player.position.y + CONFIG.camera.lookTargetHeight,
    player.position.z + CONFIG.camera.lookAhead,
  );
  statusMessage.hidden = true;

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  });
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    statusMessage.textContent =
      "The 3D scene paused. Refresh to restore the journey.";
    statusMessage.hidden = false;
    statusMessage.dataset.state = "error";
  });

  const renderFrame = createRenderLoop({
    renderer,
    scene,
    camera,
    village,
    controls,
    player,
  });
  requestAnimationFrame(renderFrame);
}
