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

    this.stage.scale.x = 0.75;
    this.stage.scale.y = 0.75;

    this.players = {};
    this.items = {};

    this.boundaries = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    this.connect();

    this.drawBoundaries();
    this.drawGrid();

    this.addResizeListeners();
    this.addMouseListeners();
    this.addSocketListeners();

    this.sendKeyEvents();
  }

  get me() {
    return this.players[this.playerId];
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
      this.stage.addChild(player.infection);
      this.stage.addChild(player.health);
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

  addMouseListeners() {
    document.addEventListener("mousemove", ({ clientX, clientY }) => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const max = Math.min(width, height) * 0.2;

      const pxFromCenter = {
        x: Math.max(Math.min(clientX - width / 2, max), -1 * max),
        y: Math.max(Math.min(clientY - height / 2, max), -1 * max),
      };

      const velocity = {
        x: (pxFromCenter.x / max) * config.world.maxSpeed,
        y: (pxFromCenter.y / max) * config.world.maxSpeed,
      };

      this.velocity = velocity;
    });
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

    Object.keys(this.items)
      .filter((key) => !Object.keys(items).includes(key))
      .forEach((key) => {
        this.stage.removeChild(this.items[key]);
        delete this.items[key];
      });
  }

  handlePlayersUpdate(players) {
    Object.entries(players).forEach(
      ([id, { loc, infected, dead, infection, health }]) => {
        if (id == this.playerId) {
          this.setCenter(loc);
        }

        const player = this.getPlayer(id);

        player.setPosition(loc);
        player.setInfectedState(infected);
        player.setDeadState(dead);
        player.setInfectionLevel(infection);
        player.setHealthLevel(health);
      }
    );

    Object.keys(this.players)
      .filter((key) => !Object.keys(players).includes(key))
      .forEach((key) => {
        this.stage.removeChild(this.players[key].circle);
        this.stage.removeChild(this.players[key].text);
        delete this.players[key];
      });
  }

  sendKeyEvents() {
    if (this.velocity) {
      this.socket.emit("move", [this.velocity.x, this.velocity.y]);
    }

    setTimeout(() => this.sendKeyEvents(), 1000 / 10);
  }
}
