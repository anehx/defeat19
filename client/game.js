import * as PIXI from "pixi.js";
import io from "socket.io-client";

import Player from "./player";

const { Application } = PIXI;

export default class Game extends Application {
  constructor() {
    super({
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true,
      transparent: true,
      resolution: 1
    });

    this.boundaries = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    this._players = {};

    this.socket = io("http://localhost:3000");

    this.addResizeListeners();
    this.addKeyboardListeners();
    this.addSocketListeners();
  }

  getPlayer(id) {
    let player = this._players[id];

    if (!player) {
      // player does not exist yet, create a new one
      player = new Player(id);

      this._players[id] = player;

      this.stage.addChild(player.circle);
      this.stage.addChild(player.text);
    }

    return player;
  }

  setCenter([x, y]) {
    this.center = { x, y };
  }

  addResizeListeners() {
    window.addEventListener("resize", () => {
      this.boundaries = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      this.renderer.resize(window.innerWidth, window.innerHeight);
    });
  }

  addKeyboardListeners() {
    document.addEventListener("keydown", ({ code }) => {
      if (/Arrow(Up|Down|Left|Right)/.test(code)) {
        this.socket.emit("move", code.replace("Arrow", "").toLowerCase());
      }
    });
  }

  addSocketListeners() {
    this.socket.on("hello", id => (this.playerId = id));

    this.socket.on("update", ({ players }) => {
      Object.entries(players).forEach(([id, { loc, infected, infection }]) => {
        if (id == this.playerId) {
          this.setCenter(loc);
        }

        const player = this.getPlayer(id);

        player.setPosition(loc);
        player.setInfectedState(infected);
        player.setInfectionLevel(infection);
      });
    });
  }
}
