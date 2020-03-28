import * as PIXI from "pixi.js";

const { Graphics } = PIXI;

export default class Player extends Graphics {
  constructor(id) {
    super();

    this.id = id;

    this.position = { x: 100, y: 100 };

    this.beginFill(this.color);
    this.drawCircle(this.position.x, this.position.y, this.size);
    this.endFill();
  }

  get color() {
    return 0xe74c3c;
  }

  get size() {
    return 50;
  }

  setPosition([x, y]) {
    this.x = x;
    this.y = y;
  }
}
