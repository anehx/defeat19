import * as PIXI from "pixi.js";
import config from "../config";
import Bar from "./bar";

const { Graphics } = PIXI;

export class PlayerCircle extends Graphics {
  constructor() {
    super();

    this.infected = false;
    this.dead = false;

    this.draw();
  }

  get color() {
    return this.dead ? 0xe5e5e5 : this.infected ? 0xff0000 : 0x00ff00;
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
  }

  setPosition([x, y]) {
    this.circle.x = x;
    this.circle.y = y;

    this.health.x = x - this.health.width / 2;
    this.health.y = y - config.player.size * 3;

    this.infection.x = x - this.infection.width / 2;
    this.infection.y = y - config.player.size * 4;
  }

  setInfectedState(state) {
    if (this.circle.infected !== state) {
      this.circle.infected = state;
      this.circle.draw();
    }
  }

  setDeadState(state) {
    if (this.circle.dead !== state) {
      this.circle.dead = state;
      this.circle.draw();
    }
  }

  setHealthLevel(percentage) {
    this.health.draw(percentage, 0x00ff00);
  }

  setInfectionLevel(percentage) {
    this.infection.draw(percentage, 0xff0000);
  }
}
