import * as PIXI from "pixi.js";
import Player from "./player";

const { Application } = PIXI;

export default class Game extends Application {
  constructor() {
    super({
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true,
      transparent: false,
      resolution: 1
    });

    this._players = {};
  }

  addPlayer(id) {
    const player = new Player(id);

    this._players[id] = player;
    this.stage.addChild(player);

    return player;
  }

  getPlayer(id) {
    return this._players[id] || this.addPlayer(id);
  }

  _resize() {
    this.renderer.resize(window.innerWidth, window.innerHeight);
  }

  // render() {
  //   Object.values(this._players).forEach(player => player._render());
  // }
}
