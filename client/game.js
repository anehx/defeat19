import * as PIXI from "pixi.js";
import io from "socket.io-client";

import Player from "./player";

const { Application, Graphics } = PIXI;

const WORLD_SIZE = 2000;

export default class Game extends Application {
  constructor() {
    super({
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true,
      transparent: true,
      resolution: 1,
    });

    const border = new Graphics();
    border.lineStyle(5, 0x000000);
    border.drawRect(0, 0, WORLD_SIZE, WORLD_SIZE);
    this.stage.addChild(border);

    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        const grid = new Graphics();
        grid.lineStyle(1, 0x000000);
        grid.drawRect(
          (WORLD_SIZE / 10) * x,
          (WORLD_SIZE / 10) * y,
          WORLD_SIZE / 10,
          WORLD_SIZE / 10
        );
        this.stage.addChild(grid);
      }
    }

    this.stage.position.x = this.renderer.width / 2;
    this.stage.position.y = this.renderer.height / 2;

    this.boundaries = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    this._players = {};

    this.socket = io("http://localhost:3000");

    this.addResizeListeners();
    this.addKeyboardListeners();
    this.addSocketListeners();

    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
    };

    this.sendKeyEvents();
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
    this.stage.pivot.x = x;
    this.stage.pivot.y = y;
  }

  addResizeListeners() {
    window.addEventListener("resize", () => {
      this.boundaries = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      this.renderer.resize(window.innerWidth, window.innerHeight);
    });
  }

  addKeyboardListeners() {
    const handleKeyEvent = (code, pressed) => {
      if (/Arrow(Up|Down|Left|Right)/.test(code)) {
        const key = code.replace("Arrow", "").toLowerCase();
        this.keys[key] = pressed;
      }
    };

    document.addEventListener("keydown", ({ code }) =>
      handleKeyEvent(code, true)
    );

    document.addEventListener("keyup", ({ code }) =>
      handleKeyEvent(code, false)
    );
  }

  addSocketListeners() {
    this.socket.on("hello", (id) => (this.playerId = id));

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

  sendKeyEvents() {
    Object.entries(this.keys).forEach(([key, value]) => {
      if (value) this.socket.emit("move", key);
    });

    setTimeout(() => this.sendKeyEvents(), 1000 / 10);
  }
}
