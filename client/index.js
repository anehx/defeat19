import io from "socket.io-client";
import Game from "./game";

const socket = io("http://localhost:3000");

const game = new Game();

socket.on("hello", id => console.log(`Connected with ID ${id}`));

socket.on("update", ({ players }) => {
  Object.entries(players).forEach(([id, { loc }]) => {
    const player = game.getPlayer(id);
    player.setPosition(loc);
  });
});

document.body.appendChild(game.view);

window.addEventListener("resize", () => game._resize());

document.addEventListener("keydown", ({ code }) => {
  if (/Arrow(Up|Down|Left|Right)/.test(code)) {
    socket.emit("move", code.replace("Arrow", "").toLowerCase());
  }
});
