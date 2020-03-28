import * as PIXI from "pixi.js";

const { Graphics } = PIXI;

export default class Player extends Graphics {
  constructor() {
    super();

    this.beginFill(this.color);
    this.drawCircle(this.position.x, this.position.y, this.size);
    this.endFill();
  }

  get color() {
    return 0xe74c3c;
  }

  get position() {
    return { x: 20, y: 20 };
  }

  get size() {
    return 50;
  }
}
