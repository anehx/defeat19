import * as PIXI from "pixi.js";

import config from "../config";
import Bar from "./bar";
import Avatar from "./avatar";

const { Container } = PIXI;

export default class Player extends Container {
  constructor(id) {
    super();

    this.id = id;

    this.avatar = new Avatar();
    this.health = new Bar(0x00ff00);
    this.infection = new Bar(0xff0000);

    this.addChild(this.avatar);
    this.addChild(this.health);
    this.addChild(this.infection);

    this.health.x = (config.player.bar.width / 2) * -1;
    this.health.y = config.player.size * -3;

    this.infection.x = (config.player.bar.width / 2) * -1;
    this.infection.y = config.player.size * -4;

    this.state = { health: 100, infection: 0 };
  }

  get isInfected() {
    return this.state.state === "infected";
  }

  update(data) {
    this.x = data.loc[0];
    this.y = data.loc[1];

    if (
      this.state.state !== data.state ||
      this.state.infectionRadius !== data.infectionRadius
    ) {
      this.avatar.state = data.state;
      this.avatar.infectionRadius = data.infectionRadius;
      this.avatar.draw();
    }

    this.health.draw(data.health);
    this.infection.draw(data.infection);

    this.state = data;
  }
}
