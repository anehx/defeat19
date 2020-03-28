import * as PIXI from "pixi.js";

import config from "../config";

const { Graphics } = PIXI;

export default class Item extends Graphics {
  constructor() {
    super();

    this.beginFill(0x0000ff);
    this.drawRect(0, 0, config.item.size, config.item.size);
    this.endFill();
  }

  setPosition([x, y]) {
    this.x = x;
    this.y = y;
  }
}
