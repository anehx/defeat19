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

      this.stage.position.x = this.renderer.width / 2;
      this.stage.position.y = this.renderer.height / 2;
    });
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

      const createIcon = (iconClass) => {
        const icon = document.createElement("i");
        icon.classList.add("fas", iconClass);
        return icon;
      };

      const updateTimeSpan = (span, player) => {
        span.innerText = `${Math.trunc(
          (new Date().getTime() - player.state.timeSpawned) / 1000
        )}s`;
      };

      const stateIcons = {
        healthy: "fa-heart",
        infected: "fa-virus",
        immune: "fa-shield-alt",
        dead: "fa-skull-crossbones",
      };

      Object.entries(this.players)
        .sort(
          ([_, player1], [__, player2]) =>
            player1.state.timeSpawned - player2.state.timeSpawned
        )
        .forEach(([id, player]) => {
          let span = document.querySelector(`[player-id="${id}"]`);
          if (!span) {
            span = document.createElement("span");
            span.setAttribute("player-id", id);
            span.classList.add("status-text");

            const usernameAbbr = document.createElement("abbr");
            usernameAbbr.classList.add("username");
            usernameAbbr.setAttribute("title", player.state.name);
            usernameAbbr.innerText = player.state.name;
            span.appendChild(usernameAbbr);

            const iconSpan = document.createElement("span");
            span.appendChild(iconSpan);

            const stopwatchIcon = createIcon("fa-stopwatch");
            iconSpan.appendChild(stopwatchIcon);

            const timeSpan = document.createElement("span");
            timeSpan.classList.add("time");
            updateTimeSpan(timeSpan, player);
            iconSpan.appendChild(timeSpan);

            const stateIcon = createIcon(stateIcons[player.state.state]);
            stateIcon.classList.add("state-icon");
            iconSpan.appendChild(stateIcon);

            const stats = document.querySelector("#stats div");
            stats.appendChild(span);
          } else {
            const username = span.querySelector(".username");
            username.innerText = player.state.name;

            const timeSpan = span.querySelector(".time");
            updateTimeSpan(timeSpan, player);

            const stateIcon = span.querySelector(".state-icon");
            stateIcon.classList.remove(...Object.values(stateIcons));
            stateIcon.classList.add(stateIcons[player.state.state]);
          }
        });
    }

    setTimeout(() => this.updateStats(), 1000);
  }
}
