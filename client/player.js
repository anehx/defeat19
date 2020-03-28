import * as PIXI from "pixi.js";
import config from "../config";

const { Graphics, Text } = PIXI;

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

export class PlayerText extends Text {
  constructor() {
    super("", { fontFamily: "Monospace", fontSize: 15, align: "center" });
  }
}

export default class Player {
  constructor(id) {
    this.id = id;

    this.circle = new PlayerCircle();
    this.text = new PlayerText();
  }

  setPosition([x, y]) {
    this.circle.x = x;
    this.circle.y = y;

    this.text.x = x - this.text.width / 2;
    this.text.y = y - config.player.size * 3;
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

  setText(infection, health) {
    const c = Math.ceil;

    this.text.text = `Infection: ${c(infection)}%\nHealth: ${c(health)}%`;
  }
}
