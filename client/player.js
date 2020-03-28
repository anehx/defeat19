import * as PIXI from "pixi.js";
import config from "../config";

const { Graphics, Text } = PIXI;

export class PlayerCircle extends Graphics {
  constructor() {
    super();

    this.infected = false;

    this.draw();
  }

  get color() {
    return this.infected ? 0xff0000 : 0x00ff00;
  }

  draw() {
    this.beginFill(this.color);
    this.drawCircle(0, 0, config.player.size);
    this.endFill();

    this.lineStyle(1, 0xff0000, 0.5);
    this.drawCircle(0, 0, config.infection.thresholdDistance);
  }
}

export class PlayerText extends Text {
  constructor() {
    super("", { fontFamily: "Monospace", fontSize: 15 });
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

    this.text.x = x + config.player.size;
    this.text.y = y - config.player.size * 2;
  }

  setInfectedState(state) {
    if (this.circle.infected !== state) {
      this.circle.infected = state;
      this.circle.draw();
    }
  }

  setInfectionLevel(percentage) {
    this.text.text = `${Math.ceil(percentage)}%`;
  }
}
