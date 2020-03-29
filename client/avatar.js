import * as PIXI from "pixi.js";

import config from "../config";

const { Graphics } = PIXI;

export default class Avatar extends Graphics {
  constructor() {
    super();

    this._draw();
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

  _draw() {
    this.clear();

    this.beginFill(this.color);
    this.drawCircle(0, 0, config.player.size);
    this.endFill();

    if (this.state === "infected") {
      this.lineStyle(1, 0xff0000, 0.5);
      this.drawCircle(
        0,
        0,
        this.infectionRadius || config.infection.defaultRadius
      );
    }
  }
}
