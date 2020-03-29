import Game from "./game";
import config from "../config";

let username = localStorage.getItem("username");

const startMenu = document.getElementById("start-menu");
const usernameInput = document.getElementById("username");
const startButton = document.getElementById("start-game");

function hideStartMenu() {
  startMenu.style.display = "none";
}

function showStartMenu() {
  startMenu.style.display = "flex";
}

function startGame(game, username) {
  game.socket.emit("join", username);
  hideStartMenu();
}

function changeName(game) {
  showStartMenu();
  addListeners((username) => {
    game.socket.emit("change-name", username);
    hideStartMenu();
  });
  usernameInput.value = username;
  startButton.classList.remove("hidden");
}

function addListeners(submitFn = () => {}) {
  usernameInput.addEventListener("input", ({ target: { value } }) => {
    if (!value && !value.trim()) {
      startButton.classList.add("hidden");
    } else {
      startButton.classList.remove("hidden");
    }
    username = value;
  });

  startButton.addEventListener("click", (event) => {
    localStorage.setItem("username", username);
    submitFn(username);
  });
}

function start() {
  const game = new Game();
  document.body.appendChild(game.view);
  const center = config.world.size / 2;
  game.setCenter([center, center]);

  const changeNameButton = document.getElementById("change-name");
  changeNameButton.addEventListener("click", () => changeName(game));
  !username
    ? addListeners((username) => startGame(game, username))
    : startGame(game, username);
}

start();
