import Game from "./game";

const game = new Game();

document.body.appendChild(game.view);

const startMenu = document.getElementById("start-menu");
const usernameInput = document.getElementById("username");
const startButton = document.getElementById("start-game");

function hideStartMenu() {
  startMenu.style.display = "none";
}

function startGame(username) {
  game.socket.emit("join", username);
  hideStartMenu();
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
    startGame(username);
  });
} else {
  startGame(username);
}
