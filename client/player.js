import * as PIXI from "pixi.js";

const { Graphics } = PIXI;

export default class Player extends Graphics {
  constructor(id) {
    super();

    this.id = id;

    this.beginFill(this.color);
    this.drawCircle(0, 0, this.size);
    this.endFill();
  }

  get color() {
    return 0x000000;
  }

  get size() {
    return 20;
  }

  setPosition([x, y]) {
    this.x = x;
    this.y = y;
  }
}
