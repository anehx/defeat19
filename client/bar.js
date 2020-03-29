import * as PIXI from "pixi.js";

const { Graphics } = PIXI;

export default class Bar extends Graphics {
  constructor(color, width, height) {
    super();

    this.size = { width, height };
    this.color = color;
  }

  draw(percentage) {
    this.clear();

    this.beginFill(this.color, 0.5);
    this.drawRect(0, 0, (this.size.width / 100) * percentage, this.size.height);
    this.endFill();

    this.lineStyle(1, this.color);
    this.drawRect(0, 0, this.size.width, this.size.height);
  }
}
