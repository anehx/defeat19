import * as PIXI from "pixi.js";
import config from "../config";
import Bar from "./bar";

const { Graphics } = PIXI;

export class PlayerCircle extends Graphics {
  constructor() {
    super();

    this.infected = false;
    this.infection = 0;
    this.health = 0;
    this.dead = false;

    this.draw();
  }

  get color() {
    switch (this.state) {
      case "dead":
        return 0xe5e5e5;
      case "infected":
        return 0xff0000;
      case "immune":
        return 0x00ffff;
      case "healthy":
      default:
        return 0x00ff00;
    }
  }

  draw() {
    this.clear();

    this.beginFill(this.color);
    this.drawCircle(0, 0, config.player.size);
    this.endFill();

    this.lineStyle(1, 0xff0000, 0.5);
    this.drawCircle(0, 0, config.infection.thresholdDistance);
  }
}

export default class Player {
  constructor(id) {
    this.id = id;

    this.circle = new PlayerCircle();
    this.health = new Bar();
    this.infection = new Bar();
    this.state = { health: 100, infection: 0 };
  }

  setPosition([x, y]) {
    this.circle.x = x;
    this.circle.y = y;

    this.health.x = x - this.health.width / 2;
    this.health.y = y - config.player.size * 3;

    this.infection.x = x - this.infection.width / 2;
    this.infection.y = y - config.player.size * 4;
  }

  setState(state) {
    if (this.circle.state !== state) {
      this.circle.state = state;
      this.circle.draw();
    }
  }

  setHealthLevel(percentage) {
    this.state.health = percentage;
    this.health.draw(percentage, 0x00ff00);
  }

  setInfectionLevel(percentage) {
    this.state.infection = percentage;
    this.infection.draw(percentage, 0xff0000);
  }
}
