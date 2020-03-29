import * as PIXI from "pixi.js";
import io from "socket.io-client";

import config from "../config";
import Player from "./player";
import Item from "./item";

const { Application, Graphics } = PIXI;

export default class Game extends Application {
  constructor() {
    super({
      antialias: true,
      transparent: true,
      resolution: 1,
    });

    this.setScene();

    this.players = {};
    this.items = {};

    this.connect();

    this.drawBoundaries();
    this.drawGrid();

    this.addResizeListeners();
    this.addMouseListeners();
    this.addSocketListeners();

    this.sendVelocity();
    this.updateStats();
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

      this.stage.addChild(player);
    }

    return player;
  }

  getItem(id) {
    let item = this.items[id];

    if (!item) {
      // item does not exist yet, create a new one
      item = new Item();

      this.items[id] = item;

      this.stage.addChild(item);
    }

    return item;
  }

  setScene() {
    // fullscreen
    this.renderer.resize(window.innerWidth, window.innerHeight);

    // set stage anchor to center
    this.stage.position.x = this.renderer.width / 2;
    this.stage.position.y = this.renderer.height / 2;

    // make sure every player sees at least 80% of the stage
    const max = Math.min(window.innerHeight, window.innerWidth);
    const scale = Math.min(1, (max / config.world.size) * (1 - 0.8 + 1));

    this.stage.scale.x = scale;
    this.stage.scale.y = scale;
  }

  setCenter([x, y]) {
    this.stage.pivot.x = x;
    this.stage.pivot.y = y;
  }

  addResizeListeners() {
    window.addEventListener("resize", () => this.setScene());
  }

  addMouseListeners() {
    document.addEventListener("mousemove", ({ clientX, clientY }) => {
      const player = this.players[this.playerId];

      if (!player) return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const max = Math.max(Math.min(width, height), 1000) * 0.3;

      const pxFromCenter = {
        x: Math.max(Math.min(clientX - width / 2, max), -1 * max),
        y: Math.max(Math.min(clientY - height / 2, max), -1 * max),
      };

      const maxSpeed = player.isInfected
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
    Object.entries(items).forEach(([id, data]) => {
      this.getItem(id).update(data);
    });

    Object.keys(this.items)
      .filter((key) => !Object.keys(items).includes(key))
      .forEach((key) => {
        this.stage.removeChild(this.items[key]);
        delete this.items[key];
      });
  }

  handlePlayersUpdate(players) {
    Object.entries(players).forEach(([id, data]) => {
      if (id == this.playerId) {
        this.setCenter(data.loc);
      }

      this.getPlayer(id).update(data);
    });

    Object.keys(this.players)
      .filter((key) => !Object.keys(players).includes(key))
      .forEach((key) => {
        this.stage.removeChild(this.players[key]);
        delete this.players[key];
      });
  }

  sendVelocity() {
    if (this.velocityChanged) {
      this.socket.emit("move", [this.velocity.x, this.velocity.y]);
      this.velocityChanged = false;
    }

    setTimeout(() => this.sendVelocity(), 1000 / 10);
  }

  updateStats() {
    if (this.players) {
      const stats = document.getElementById("stats");

      //Clear out non-existent players
      const playerStatElements = Array.from(
        document.querySelectorAll("[player-id]")
      );
      playerStatElements.forEach((playerStatElement) => {
        if (!this.players[playerStatElement.getAttribute("player-id")]) {
          playerStatElement.remove();
        }
      });

      Object.entries(this.players)
        .sort(
          ([_, player1], [__, player2]) =>
            player2.state.health - player1.state.health
        )
        .forEach(([id, player]) => {
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
          username.innerText = player.state.name;
          const statsText = span.querySelector(".stats-text");

          statsText.innerText = `Alive: ${Math.trunc(
            (new Date().getTime() - player.state.timeSpawned) / 1000
          )}s Status: ${player.state.state}`;

          const stats = document.querySelector("#stats div");
          stats.appendChild(span);
        });
    }

    setTimeout(() => this.updateStats(), 2000);
  }
}
