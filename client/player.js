import * as PIXI from "pixi.js";

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
    this.drawCircle(0, 0, 20);
    this.endFill();
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

    this.text.x = x + 20;
    this.text.y = y - 40;
  }

  setInfectedState(state) {
    if (this.circle.infected !== state) {
      this.circle.infected = state;
      this.circle.draw();
    }
  }

  setInfectionLevel(percentage) {
    this.text.text = `${percentage}%`;
  }
}
