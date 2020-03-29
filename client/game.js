import * as PIXI from "pixi.js";
import io from "socket.io-client";

import config from "../config";
import Player from "./player";
import Item from "./item";
import Bar from "./bar";

const { Application, Graphics, Container, Text } = PIXI;

export default class Game extends Application {
  constructor() {
    super({
      antialias: true,
      transparent: true,
      resolution: 1,
    });

    this.world = new Container();
    this.stage.addChild(this.world);

    this.setScene();

    this.players = {};
    this.items = {};

    this.connect();

    this.drawBoundaries();
    this.drawGrid();
    this.drawBars();

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

  updateBars({ infection, health }) {
    const p = (x) => `${Math.ceil(x)}%`;

    this.infection.draw(infection);
    this.infectionText.text = p(infection);
    this.health.draw(health);
    this.healthText.text = p(health);
  }

  drawBars() {
    this.infection = new Bar(
      0xff0000,
      config.player.bar.own.width,
      config.player.bar.own.height
    );
    this.infectionText = new Text("", {
      fontFamily: "mono",
      fontSize: config.player.bar.own.fontSize,
      fill: 0xffffff,
    });
    this.health = new Bar(
      0x00ff00,
      config.player.bar.own.width,
      config.player.bar.own.height
    );
    this.healthText = new Text("", {
      fontFamily: "mono",
      fontSize: config.player.bar.own.fontSize,
      fill: 0xffffff,
    });

    this.stage.addChild(this.infection);
    this.stage.addChild(this.infectionText);
    this.stage.addChild(this.health);
    this.stage.addChild(this.healthText);

    this.infection.x = config.player.bar.own.gutter;
    this.infection.y = config.player.bar.own.gutter;

    this.infectionText.x =
      this.infection.x +
      config.player.bar.own.width +
      config.player.bar.own.gutter / 2;
    this.infectionText.y =
      this.infection.y + config.player.bar.own.fontSize / 4;

    this.health.x = config.player.bar.own.gutter;
    this.health.y =
      config.player.bar.own.gutter * 1.5 + config.player.bar.own.height;
    this.healthText.x =
      this.health.x +
      config.player.bar.own.width +
      config.player.bar.own.gutter / 2;
    this.healthText.y = this.health.y + config.player.bar.own.fontSize / 4;
  }

  drawBoundaries() {
    const border = new Graphics();
    border.lineStyle(5, 0xffffff, 0.5);
    border.drawRect(0, 0, config.world.size, config.world.size);
    this.world.addChild(border);
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
        this.world.addChild(grid);
      }
    }
  }

  getPlayer(id) {
    let player = this.players[id];

    if (!player) {
      // player does not exist yet, create a new one
      player = new Player(id, this.playerId === id);

      this.players[id] = player;

      this.world.addChild(player);
    }

    return player;
  }

  getItem(id) {
    let item = this.items[id];

    if (!item) {
      // item does not exist yet, create a new one
      item = new Item();

      this.items[id] = item;

      this.world.addChild(item);
    }

    return item;
  }

  setScene() {
    // fullscreen
    this.renderer.resize(window.innerWidth, window.innerHeight);

    // set stage anchor to center
    this.world.position.x = this.renderer.width / 2;
    this.world.position.y = this.renderer.height / 2;

    // make sure every player sees at least 80% of the stage
    const max = Math.min(window.innerHeight, window.innerWidth);
    const scale = Math.min(1, (max / config.world.size) * (1 - 0.8 + 1));

    this.world.scale.x = scale;
    this.world.scale.y = scale;
  }

  setCenter([x, y]) {
    this.world.pivot.x = x;
    this.world.pivot.y = y;
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
        this.world.removeChild(this.items[key]);
        delete this.items[key];
      });
  }

  handlePlayersUpdate(players) {
    Object.entries(players).forEach(([id, data]) => {
      if (id == this.playerId) {
        this.updateBars(data);
        this.setCenter(data.loc);
      }

      this.getPlayer(id).update(data);
    });

    Object.keys(this.players)
      .filter((key) => !Object.keys(players).includes(key))
      .forEach((key) => {
        this.world.removeChild(this.players[key]);
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

  updateSummaryStats(players) {
    const healthySpan = document.querySelector(".summary-healthy");
    const infectedSpan = document.querySelector(".summary-infected");
    const immuneSpan = document.querySelector(".summary-immune");
    const deadSpan = document.querySelector(".summary-dead");

    const summary = Object.values(players).reduce(
      (acc, cur) => ({ ...acc, [cur.state.state]: acc[cur.state.state] + 1 }),
      { healthy: 0, infected: 0, immune: 0, dead: 0 }
    );

    healthySpan.innerText = summary.healthy;
    infectedSpan.innerText = summary.infected;
    immuneSpan.innerText = summary.immune;
    deadSpan.innerText = summary.dead;
  }

  updateStats() {
    if (this.players) {
      this.updateSummaryStats(this.players);

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

            const stats = document.querySelector("#stats-container");
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
