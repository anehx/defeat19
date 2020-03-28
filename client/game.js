import * as PIXI from "pixi.js";
import io from "socket.io-client";

import config from "../config";
import Player from "./player";
import Item from "./item";

const { Application, Graphics } = PIXI;

export default class Game extends Application {
  constructor() {
    super({
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true,
      transparent: true,
      resolution: 1,
    });

    // center stage
    this.stage.position.x = this.renderer.width / 2;
    this.stage.position.y = this.renderer.height / 2;

    this.players = {};
    this.items = {};

    this.boundaries = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
    };

    this.connect();

    this.drawBoundaries();
    this.drawGrid();

    this.addResizeListeners();
    this.addKeyboardListeners();
    this.addSocketListeners();

    this.sendKeyEvents();
  }

  connect() {
    this.socket = io(config.serverURL);
  }

  drawBoundaries() {
    const border = new Graphics();
    border.lineStyle(5, 0x000000);
    border.drawRect(0, 0, config.world.size, config.world.size);
    this.stage.addChild(border);
  }

  drawGrid() {
    for (let x = 0; x < config.world.grid; x++) {
      for (let y = 0; y < config.world.grid; y++) {
        const grid = new Graphics();
        grid.lineStyle(1, 0x000000);
        grid.drawRect(
          (config.world.size / config.world.grid) * x,
          (config.world.size / config.world.grid) * y,
          config.world.size / config.world.grid,
          config.world.size / config.world.grid
        );
        this.stage.addChild(grid);
      }
    }
  }

  getPlayer(id) {
    let player = this.players[id];

    if (!player) {
      // player does not exist yet, create a new one
      player = new Player(id);

      this.players[id] = player;

      this.stage.addChild(player.circle);
      this.stage.addChild(player.text);
    }

    return player;
  }

  getItem(id) {
    let item = this.items[id];

    if (!item) {
      // item does not exist yet, create a new one
      item = new Item(id);

      this.items[id] = item;

      this.stage.addChild(item);
    }

    return item;
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

    this.socket.on("update", (data) => {
      const { players, items } = data;

      this.handlePlayersUpdate(players);
      this.handleItemsUpdate(items);
    });
  }

  handleItemsUpdate(items) {
    Object.entries(items).forEach(([id, { loc }]) => {
      this.getItem(id).setPosition(loc);
    });
  }

  handlePlayersUpdate(players) {
    Object.entries(players).forEach(([id, { loc, infected, infection }]) => {
      if (id == this.playerId) {
        this.setCenter(loc);
      }

      const player = this.getPlayer(id);

      player.setPosition(loc);
      player.setInfectedState(infected);
      player.setInfectionLevel(infection);
    });
  }

  sendKeyEvents() {
    Object.entries(this.keys).forEach(([key, value]) => {
      if (value) this.socket.emit("move", key);
    });

    setTimeout(() => this.sendKeyEvents(), 1000 / 10);
  }
}
