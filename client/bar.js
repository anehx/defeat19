import * as PIXI from "pixi.js";
import config from "../config";

const { Graphics } = PIXI;

export default class Bar extends Graphics {
  draw(percentage, color) {
    this.clear();

    this.beginFill(color);
    this.drawRect(
      0,
      0,
      (config.player.bar.width / 100) * percentage,
      config.player.bar.height
    );
    this.endFill();

    this.lineStyle(1, 0x000000);
    this.drawRect(0, 0, config.player.bar.width, config.player.bar.height);
    this.lineStyle(0);
  }
}
