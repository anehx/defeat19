import * as PIXI from "pixi.js";

import config from "../config";

const { Graphics } = PIXI;

export default class Item extends Graphics {
  get color() {
    switch (this.type) {
      case "toilet":
        return 0xffff00; // yellow
      case "desinfection":
        return 0x0000ff; // blue
      case "food":
      default:
        return 0xff0000; // red?
    }
  }

  draw() {
    this.beginFill(this.color);
    this.drawRect(0, 0, config.item.size, config.item.size);
    this.endFill();
  }

  update(data) {
    this.x = data.loc[0];
    this.y = data.loc[1];
    this.type = data.type;

    this.draw();
  }
}
