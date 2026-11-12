import "./style.css";
import { CONFIG } from "./config.js";
import { startVillageGame } from "./game.js";

function getElement(selector) {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`The game page is missing ${selector}.`);
  }
  return element;
}

function applyThemeColors() {
  const rootStyles = document.documentElement.style;
  Object.entries(CONFIG.colors).forEach(([name, color]) => {
    const variableName = name.replace(
      /[A-Z]/g,
      (letter) => `-${letter.toLowerCase()}`,
    );
    rootStyles.setProperty(`--${variableName}`, color);
  });
}

async function startGame() {
  const statusMessage = getElement("#status-message");
  document.title = CONFIG.title;
  getElement("#game-title").textContent = CONFIG.title;
  getElement("#intro-copy").textContent = CONFIG.intro;
  getElement("#quality-note").hidden = !CONFIG.quality.low;
  applyThemeColors();

  try {
    await startVillageGame({
      canvas: getElement("#game-canvas"),
      controlsElements: {
        joystick: getElement("#joystick"),
        joystickThumb: getElement("#joystick-thumb"),
        jumpButton: getElement("#jump-button"),
        cluckButton: getElement("#cluck-button"),
      },
      statusMessage,
    });
  } catch (error) {
    console.error("Little Chicken Quest could not start:", error);
    statusMessage.textContent = `The village could not load. ${error.message}`;
    statusMessage.hidden = false;
    statusMessage.dataset.state = "error";
  }
}

startGame();
