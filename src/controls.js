const MOVEMENT_KEYS = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
]);

export function createControls({
  canvas,
  joystick,
  joystickThumb,
  jumpButton,
  cluckButton,
  config,
}) {
  const pressedKeys = new Set();
  const joystickState = { pointerId: null, x: 0, y: 0 };
  let pendingJump = false;
  let pendingCluck = false;
  let lookPointerId = null;
  let previousPointerX = 0;
  let yaw = 0;

  function resetJoystick() {
    joystickState.pointerId = null;
    joystickState.x = 0;
    joystickState.y = 0;
    joystickThumb.style.transform = "translate3d(0, 0, 0)";
  }

  function updateJoystick(event) {
    const bounds = joystick.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const offsetX = event.clientX - centerX;
    const offsetY = event.clientY - centerY;
    const distance = Math.hypot(offsetX, offsetY);
    const maximum = config.movement.joystickRadius;
    const scale = distance > maximum ? maximum / distance : 1;
    const clampedX = offsetX * scale;
    const clampedY = offsetY * scale;

    joystickState.x = clampedX / maximum;
    joystickState.y = clampedY / maximum;
    joystickThumb.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0)`;
  }

  function handleJoystickDown(event) {
    event.preventDefault();
    joystickState.pointerId = event.pointerId;
    joystick.setPointerCapture(event.pointerId);
    updateJoystick(event);
  }

  function handleJoystickMove(event) {
    if (event.pointerId === joystickState.pointerId) {
      updateJoystick(event);
    }
  }

  function handleJoystickUp(event) {
    if (event.pointerId === joystickState.pointerId) {
      resetJoystick();
    }
  }

  function handleLookDown(event) {
    if (event.pointerType !== "mouse" || event.button !== 0) {
      return;
    }
    lookPointerId = event.pointerId;
    previousPointerX = event.clientX;
    canvas.setPointerCapture(event.pointerId);
  }

  function handleLookMove(event) {
    if (event.pointerId !== lookPointerId) {
      return;
    }
    const deltaX = event.clientX - previousPointerX;
    previousPointerX = event.clientX;
    yaw = Math.max(
      -config.camera.yawLimit,
      Math.min(
        config.camera.yawLimit,
        yaw + deltaX * config.camera.dragSensitivity,
      ),
    );
  }

  function handleLookUp(event) {
    if (event.pointerId === lookPointerId) {
      lookPointerId = null;
    }
  }

  function handleKeyDown(event) {
    if (event.code === "Space") {
      event.preventDefault();
      if (!event.repeat) {
        pendingJump = true;
      }
    }
    if (MOVEMENT_KEYS.has(event.code)) {
      event.preventDefault();
      pressedKeys.add(event.code);
    }
  }

  function handleKeyUp(event) {
    pressedKeys.delete(event.code);
  }

  function clearInput() {
    pressedKeys.clear();
    resetJoystick();
    lookPointerId = null;
  }

  canvas.addEventListener("pointerdown", handleLookDown);
  canvas.addEventListener("pointermove", handleLookMove);
  canvas.addEventListener("pointerup", handleLookUp);
  canvas.addEventListener("pointercancel", handleLookUp);
  joystick.addEventListener("pointerdown", handleJoystickDown);
  joystick.addEventListener("pointermove", handleJoystickMove);
  joystick.addEventListener("pointerup", handleJoystickUp);
  joystick.addEventListener("pointercancel", handleJoystickUp);
  jumpButton.addEventListener("click", () => {
    pendingJump = true;
  });
  cluckButton.addEventListener("click", () => {
    pendingCluck = true;
  });
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("blur", clearInput);

  function readMovement() {
    const right = pressedKeys.has("KeyD") || pressedKeys.has("ArrowRight");
    const left = pressedKeys.has("KeyA") || pressedKeys.has("ArrowLeft");
    const forward = pressedKeys.has("KeyW") || pressedKeys.has("ArrowUp");
    const backward = pressedKeys.has("KeyS") || pressedKeys.has("ArrowDown");
    let x = Number(right) - Number(left) + joystickState.x;
    let z = Number(forward) - Number(backward) - joystickState.y;
    const length = Math.hypot(x, z);

    if (length > 1) {
      x /= length;
      z /= length;
    }
    return { x, z, yaw };
  }

  return {
    readMovement,
    consumeJump() {
      const wasRequested = pendingJump;
      pendingJump = false;
      return wasRequested;
    },
    consumeCluck() {
      const wasRequested = pendingCluck;
      pendingCluck = false;
      return wasRequested;
    },
  };
}
