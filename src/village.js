import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { CONFIG } from "./config.js";

const MODEL_NAMES = [
  "chicken",
  "ground_red_earth",
  "hut_village",
  "palm_tree",
  "hibiscus",
  "banana_plant",
  "paddy_field",
  "rock_a",
  "rock_b",
  "puddle",
  "temple",
  "cloud",
];

async function loadModel(name, loader) {
  const url = `/assets/models/${name}.glb`;
  try {
    const gltf = await loader.loadAsync(url);
    return [name, gltf.scene];
  } catch (error) {
    throw new Error(`Unable to load required model ${url}`, { cause: error });
  }
}

function requireNode(model, nodeName) {
  const node = model.getObjectByName(nodeName);
  if (!node) {
    throw new Error(`The chicken model is missing its ${nodeName} node.`);
  }
  return node;
}

function addShadows(model) {
  model.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
}

function createSparkles(scene) {
  const positions = new Float32Array(CONFIG.quality.sparkleCount * 3);
  let seed = 1847;

  for (let index = 0; index < positions.length; index += 3) {
    seed = (seed * 16807) % 2147483647;
    const randomX = seed / 2147483647;
    seed = (seed * 16807) % 2147483647;
    const randomY = seed / 2147483647;
    seed = (seed * 16807) % 2147483647;
    const randomZ = seed / 2147483647;
    positions[index] = (randomX - 0.5) * 18;
    positions[index + 1] = 0.8 + randomY * 4.2;
    positions[index + 2] = randomZ * 28;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: CONFIG.colors.sparkle,
    size: 0.11,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
  });
  const sparkles = new THREE.Points(geometry, material);
  scene.add(sparkles);
  return sparkles;
}

function requireChickenNodes(chicken) {
  return {
    leftWing: requireNode(chicken, "wing_L"),
    rightWing: requireNode(chicken, "wing_R"),
    leftLeg: requireNode(chicken, "leg_L"),
    rightLeg: requireNode(chicken, "leg_R"),
    head: requireNode(chicken, "head"),
    tail: requireNode(chicken, "tail"),
  };
}

export async function createVillage(scene) {
  scene.fog = new THREE.Fog(
    CONFIG.colors.mist,
    CONFIG.lighting.fogNear,
    CONFIG.lighting.fogFar,
  );
  const hemisphere = new THREE.HemisphereLight(
    CONFIG.colors.hemisphereSky,
    CONFIG.colors.hemisphereGround,
    CONFIG.lighting.hemisphereIntensity,
  );
  scene.add(hemisphere);

  const dawnLight = new THREE.DirectionalLight(
    CONFIG.colors.warmLight,
    CONFIG.lighting.directionalIntensity,
  );
  dawnLight.position.set(-12, 18, -8);
  dawnLight.castShadow = CONFIG.quality.shadows;
  dawnLight.shadow.mapSize.set(
    CONFIG.quality.shadowMapSize,
    CONFIG.quality.shadowMapSize,
  );
  dawnLight.shadow.camera.left = -24;
  dawnLight.shadow.camera.right = 24;
  dawnLight.shadow.camera.top = 24;
  dawnLight.shadow.camera.bottom = -24;
  dawnLight.shadow.camera.far = 100;
  scene.add(dawnLight);
  scene.add(dawnLight.target);

  const loader = new GLTFLoader();
  const models = new Map(
    await Promise.all(MODEL_NAMES.map((name) => loadModel(name, loader))),
  );
  const addModel = (name, x, y, z, scale = 1, rotationY = 0) => {
    const source = models.get(name);
    if (!source) {
      throw new Error(`Required model ${name}.glb was not loaded.`);
    }
    const model = source.clone(true);
    model.position.set(x, y, z);
    model.scale.setScalar(scale);
    model.rotation.y = rotationY;
    addShadows(model);
    scene.add(model);
    return model;
  };

  for (const x of [-4, 4]) {
    for (const z of [4, 12, 20]) {
      addModel("ground_red_earth", x, 0, z);
    }
  }

  const chicken = addModel("chicken", 0, 0, 1.5);
  const chickenNodes = requireChickenNodes(chicken);
  addModel("hut_village", -10, 0, 5.5);
  addModel("hut_village", -10, 0, 18);

  const palmLocations = [
    [-12, 3],
    [12, 3],
    [-12, 11],
    [12, 12],
    [-12, 20],
    [12, 22],
  ];
  palmLocations.slice(0, CONFIG.quality.palmCount).forEach(([x, z]) => {
    addModel("palm_tree", x, 0, z);
  });

  [
    [-8.4, 2],
    [-8.6, 9],
    [-8.5, 16],
    [-8.5, 22],
    [8.5, 5],
    [8.5, 13],
    [8.5, 21],
  ].forEach(([x, z]) => addModel("hibiscus", x, 0, z, 1.5));

  addModel("banana_plant", 11, 0, 7);
  addModel("banana_plant", 11, 0, 20);
  addModel("paddy_field", 19, 0, 7);
  addModel("paddy_field", 19, 0, 16);
  addModel("rock_a", -6.7, 0, 14);
  addModel("rock_b", 7, 0, 7, 0.65);
  addModel("puddle", -5.3, 0, 8);
  addModel("puddle", 5.2, 0, 18);
  addModel("temple", 0, 0, 57);

  const cloudLocations = [
    [-13, 9, 31],
    [14, 10, 39],
  ];
  cloudLocations.slice(0, CONFIG.quality.cloudCount).forEach(([x, y, z]) => {
    addModel("cloud", x, y, z, 1.25);
  });

  const texture = await new THREE.TextureLoader().loadAsync(
    "/backdrops/01_village.png",
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: texture,
      fog: false,
      depthWrite: false,
    }),
  );
  backdrop.renderOrder = -1000;
  scene.add(backdrop);

  const sparkles = createSparkles(scene);
  const baseRotations = {
    leftWing: chickenNodes.leftWing.rotation.z,
    rightWing: chickenNodes.rightWing.rotation.z,
    leftLeg: chickenNodes.leftLeg.rotation.x,
    rightLeg: chickenNodes.rightLeg.rotation.x,
    head: chickenNodes.head.rotation.x,
    tail: chickenNodes.tail.rotation.x,
  };

  function animate(elapsed, walkingAmount, clucking) {
    const walkWave = Math.sin(elapsed * CONFIG.animation.walkCycleSpeed);
    chickenNodes.leftLeg.rotation.x =
      baseRotations.leftLeg +
      walkWave * CONFIG.animation.legSwing * walkingAmount;
    chickenNodes.rightLeg.rotation.x =
      baseRotations.rightLeg -
      walkWave * CONFIG.animation.legSwing * walkingAmount;
    chicken.rotation.z = walkWave * CONFIG.animation.bodyWaddle * walkingAmount;
    chickenNodes.head.rotation.x =
      baseRotations.head +
      Math.abs(walkWave) * CONFIG.animation.headBob * walkingAmount -
      (clucking
        ? Math.abs(Math.sin(elapsed * CONFIG.animation.flapSpeed)) * 0.12
        : 0);
    chickenNodes.tail.rotation.x =
      baseRotations.tail +
      walkWave * CONFIG.animation.tailSwing * walkingAmount;

    const flap = clucking
      ? Math.abs(Math.sin(elapsed * CONFIG.animation.flapSpeed)) *
        CONFIG.animation.flapAmplitude
      : 0;
    chickenNodes.leftWing.rotation.z = baseRotations.leftWing - flap;
    chickenNodes.rightWing.rotation.z = baseRotations.rightWing + flap;
    sparkles.position.y =
      Math.sin(elapsed * CONFIG.animation.sparkleDriftSpeed) * 0.08;
  }

  return { chicken, chickenNodes, backdrop, animate };
}
