import * as PIXI from "pixi.js";
import io from "socket.io-client";
import Player from "./player";

const app = new PIXI.Application({
  width: 700,
  height: 700,
  antialias: true,
  transparent: false,
  resolution: 1
});

document.body.appendChild(app.view);

const player = new Player();

app.stage.addChild(player);

document.addEventListener("keydown", ({ code }) => {
  if (/Arrow(Up|Down|Left|Right)/.test(code)) {
    console.log("move", code.replace("Arrow", "").toLowerCase());
  }
});
