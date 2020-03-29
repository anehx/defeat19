import * as PIXI from "pixi.js";

import config from "../config";
import Bar from "./bar";
import Avatar from "./avatar";

const { Container } = PIXI;

export default class Player extends Container {
  constructor(id, isMe) {
    super();

    this.id = id;
    this.isMe = isMe;

    this.avatar = new Avatar();
    this.addChild(this.avatar);

    this.state = { health: 100, infection: 0 };

    if (!isMe) {
      this.health = new Bar(
        0x00ff00,
        config.player.bar.width,
        config.player.bar.height
      );
      this.infection = new Bar(
        0xff0000,
        config.player.bar.width,
        config.player.bar.height
      );

      this.addChild(this.health);
      this.addChild(this.infection);

      this.health.x = (config.player.bar.width / 2) * -1;
      this.health.y = config.player.size * -3;

      this.infection.x = (config.player.bar.width / 2) * -1;
      this.infection.y =
        config.player.size * -3 +
        config.player.bar.height +
        config.player.bar.gutter;
    }
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

    if (!this.isMe) {
      this.health.draw(data.health);
      this.infection.draw(data.infection);
    }

    this.state = data;
  }
}
