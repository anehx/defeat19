import Game from "./game";

function startGame() {
  const startMenu = document.getElementById("start-menu");
  startMenu.style.display = "none";
  document.body.appendChild(new Game().view);
}

let username = localStorage.getItem("username");

if (!username) {
  const usernameInput = document.getElementById("username");
  const startButton = document.getElementById("start-game");

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
    startGame();
  });
} else {
  startGame();
}
