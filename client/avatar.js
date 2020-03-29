import * as PIXI from "pixi.js";

import config from "../config";

const { Graphics, Container } = PIXI;

export class Zone extends Graphics {
  draw(radius) {
    this.clear();

    this.beginFill(0xff0000, 0.1);
    this.lineStyle(1, 0xff0000, 0.5);
    this.drawCircle(0, 0, radius || config.infection.defaultRadius);
    this.endFill();
  }
}

export class Dot extends Graphics {
  draw(color) {
    this.clear();

    this.beginFill(color);
    this.drawCircle(0, 0, config.player.size);
    this.endFill();
  }
}

export default class Avatar extends Container {
  constructor() {
    super();

    this.dot = new Dot();
    this.addChild(this.dot);
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
    this.dot.draw(this.color);

    if (this.state === "infected") {
      if (!this.zone) {
        this.zone = new Zone();
        this.addChild(this.zone);
      }

      this.zone.draw(this.infectionRadius);
    } else if (this.state !== "infected" && this.zone) {
      this.removeChild(this.zone);
      delete this.zone;
    }
  }
}
