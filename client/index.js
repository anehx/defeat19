import Game from "./game";

const game = new Game();

document.body.appendChild(game.view);

const startMenu = document.getElementById("start-menu");
const usernameInput = document.getElementById("username");
const startButton = document.getElementById("start-game");

function hideStartMenu() {
  startMenu.style.display = "none";
}

let username = localStorage.getItem("username");

if (!username) {
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
    game.socket.emit("join");
    hideStartMenu();
  });
} else {
  game.socket.emit("join");
  hideStartMenu();
}
