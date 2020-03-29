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

    this.ticker.add(() => this.sendVelocity());
    setInterval(this.updateStats.bind(this), 2000);
  }

  get me() {
    return this.players[this.playerId];
  }

  connect() {
    this.socket = io(config.url);
  }

  drawBoundaries() {
    const border = new Graphics();
    border.lineStyle(5, 0xffffff, 0.5);
    border.drawRect(0, 0, config.world.size, config.world.size);
    this.stage.addChild(border);
  }

  drawGrid() {
    for (let x = 0; x < config.world.grid; x++) {
      for (let y = 0; y < config.world.grid; y++) {
        const grid = new Graphics();
        grid.lineStyle(1, 0xffffff, 0.2);
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
      const max = Math.max(Math.min(width, height), 1000) * 0.3;

      const pxFromCenter = {
        x: Math.max(Math.min(clientX - width / 2, max), -1 * max),
        y: Math.max(Math.min(clientY - height / 2, max), -1 * max),
      };

      const maxSpeed = this.players[this.playerId].isInfected
        ? config.world.maxSpeedWhenInfected
        : config.world.maxSpeedWhenHealthy;

      const velocity = {
        x: (pxFromCenter.x / max) * maxSpeed,
        y: (pxFromCenter.y / max) * maxSpeed,
      };

      this.velocityChanged = this.velocity !== velocity;
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
      ([id, { loc, state, infection, health }]) => {
        if (id == this.playerId) {
          this.setCenter(loc);
        }

        const player = this.getPlayer(id);

        player.setPosition(loc);
        player.setState(state);
        player.setInfectionLevel(infection);
        player.setHealthLevel(health);
      }
    );

    Object.keys(this.players)
      .filter((key) => !Object.keys(players).includes(key))
      .forEach((key) => {
        this.stage.removeChild(this.players[key].circle);
        this.stage.removeChild(this.players[key].infection);
        this.stage.removeChild(this.players[key].health);
        delete this.players[key];
      });
  }

  sendVelocity() {
    if (this.velocityChanged) {
      this.socket.emit("move", [this.velocity.x, this.velocity.y]);
      this.velocityChanged = false;
    }

    setTimeout(() => this.sendKeyEvents(), 1000 / 10);
  }

  updateStats() {
    if (this.players) {
      const stats = document.getElementById("stats");

      Object.entries(this.players).forEach(([id, player]) => {
        let span = document.querySelector(`[player-id="${id}"]`);
        if (!span) {
          span = document.createElement("span");
          span.setAttribute("player-id", id);

          const usernameP = document.createElement("p");
          const username = document.createElement("b");
          const statsText = document.createElement("p");
          usernameP.appendChild(username);
          span.appendChild(usernameP);
          span.appendChild(statsText);

          username.classList.add("username");
          statsText.classList.add("stats-text");
        }

        const username = span.querySelector(".username");
        username.innerText = id;
        const statsText = span.querySelector(".stats-text");
        statsText.innerText = `Vitality: ${Math.trunc(
          player.state.health
        )}% Infection: ${Math.trunc(player.state.infection)}%`;

        const stats = document.getElementById("stats");
        stats.appendChild(span);
      });
    }
  }
}
