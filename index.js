const express = require("express");
const app = express();
const uuid = require("uuid");
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const config = require("./config");
const { abs, add, multiply, linear, distance } = require("./math");

app.get("/debug", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.use(express.static(__dirname + "/dist/"));

const INFECTED = "infected";
const HEALTHY = "healthy";
const IMMUNE = "immune";
const DEAD = "dead";

const lastGameLoopRuns = Array(config.simulationSpeed).fill(0);

const game = {
  perf: {
    playerCount: 0,
  },
  players: {},
  items: {},
};

function gameLoop() {
  setTimeout(gameLoop, 1000 / config.simulationSpeed);
  const start = process.hrtime();

  Object.entries(game.players).map(([id, player]) => {
    game.players[id] = updatePlayer(player);

    if (!game.players[id]) {
      delete game.players[id];
    }
  });

  io.emit("update", game);
  lastGameLoopRuns.push(process.hrtime(start));
  lastGameLoopRuns.shift();
}

function perfStats() {
  game.perf.averageLoopMs =
    lastGameLoopRuns.reduce((total, curr) => {
      return total + curr[0] * 1000 + curr[1] / 1e6;
    }, 0) / config.simulationSpeed;

  game.perf.playerCount = getActivePlayerCount();
}

function spawnItem() {
  if (Object.keys(game.items).length <= getActivePlayerCount()) {
    const id = uuid.v4();
    const type = getRandomItemType();
    game.items[id] = { id, type, loc: getRandomLoc() };
  }
  const spawnTimeout =
    (config.item.spawnDelay * 1000) / Math.max(1, getActivePlayerCount());
  const offset = linear(
    Math.random(),
    0,
    1,
    -0.2 * spawnTimeout,
    0.2 * spawnTimeout
  );

  setTimeout(spawnItem, spawnTimeout + offset);
}

function getRandomItemType() {
  const types = Object.keys(config.item.types);
  return types[Math.floor(Math.random() * types.length)];
}

gameLoop();
spawnItem();
setInterval(perfStats, 1000);

function getRandomLoc() {
  return [Math.random() * config.world.size, Math.random() * config.world.size];
}

function getActivePlayerCount() {
  return Object.values(game.players).filter((player) => player.state !== DEAD)
    .length;
}

function getInfectedPlayerCount() {
  return Object.values(game.players).filter(
    (player) => player.state === INFECTED
  ).length;
}

function getHealthPlayerCount() {
  return Object.values(game.players).filter(
    (player) => player.state === HEALTHY
  ).length;
}

function spawnPlayer(id, name) {
  const loc = getRandomLoc();

  const infected = getInfectedPlayerCount();
  const healthy = getHealthPlayerCount();
  console.log(infected / Math.max(1, healthy));
  const state =
    infected === 0 ||
    infected / Math.max(1, healthy) <= config.infection.spawnRatio
      ? INFECTED
      : HEALTHY;

  game.players[id] = {
    id,
    name,
    loc,
    v: [0, 0],
    state,
    infection: state === INFECTED ? 100 : 0,
    infectionRadius: config.infection.defaultRadius,
    health: 100,
    timeSpawned: new Date().getTime(),
  };
}

function movePlayer(id, mouseDir) {
  if (game.players[id] && game.players[id].state !== DEAD) {
    game.players[id].v = getNextVelocity(game.players[id], mouseDir);
  }
}

function isWithinBoundary(coord) {
  return 0 <= coord && coord <= config.world.size;
}

function boundaryControl(player) {
  const newPosition = add(player.loc, player.v);
  if (!isWithinBoundary(newPosition[0])) {
    player.v[0] = 0;
  }
  if (!isWithinBoundary(newPosition[1])) {
    player.v[1] = 0;
  }
  player.loc = [
    between(newPosition[0], 0, config.world.size),
    between(newPosition[1], 0, config.world.size),
  ];
}

function between(value, min, max) {
  return Math.max(Math.min(max, value), 0);
}

function updatePlayer(player) {
  if (player.state === DEAD) {
    if (
      (new Date().getTime() - player.diedAt.getTime()) / 1000 >=
      config.death.removeAfter
    ) {
      return null;
    }
    return player;
  }

  boundaryControl(player);
  collectItems(player);
  decreaseHealth(player);
  handleInfection(player);

  return player;
}

function decreaseHealth(player) {
  const healthReduce =
    player.state === INFECTED
      ? config.health.reduceWhenInfected
      : config.health.reduceWhenHealthy;

  player.health -= healthReduce / config.simulationSpeed;

  if (player.health <= 0) {
    player.state = DEAD;
    player.health = 0;
    player.diedAt = new Date();
  }
}

function collectItems(player) {
  const itemsInRange = Object.values(game.items)
    .map((item) => ({ ...item, distance: distance(item.loc, player.loc) }))
    .filter(({ distance }) => distance <= config.player.size * 2);

  itemsInRange.forEach((item) => {
    const itemConfig = config.item.types[item.type];
    if (itemConfig.healthBoost) {
      player.health = Math.min(100, player.health + itemConfig.healthBoost);
    }
    if (itemConfig.infectionRadius && player.state === INFECTED) {
      player.infectionRadius = Math.max(
        config.infection.minimumRadius,
        player.infectionRadius + itemConfig.infectionRadius
      );
    }
  });

  itemsInRange.forEach(({ id }) => {
    delete game.items[id];
  });
}

function handleInfection(player) {
  const infectionRaise =
    player.state !== HEALTHY
      ? 0
      : Object.values(game.players)
          .filter((other) => other.id !== player.id)
          .filter((other) => other.state === INFECTED)
          .filter(
            (other) => distance(other.loc, player.loc) < other.infectionRadius
          )
          // linear infection rate increase below threshold
          .reduce((total, other) => {
            return (
              total +
              linear(
                distance(other.loc, player.loc),
                other.infectionRadius / 2,
                other.infectionRadius,
                config.infection.speed,
                0
              )
            );
          }, 0);

  const infectionReduce =
    player.state === INFECTED
      ? config.infection.reduceWhenInfected
      : config.infection.reduceWhenHealthy;

  const newInfectionScore =
    player.infection +
    infectionRaise -
    infectionReduce / config.simulationSpeed;

  player.infection = Math.max(0, Math.min(newInfectionScore, 100));

  if (player.state === INFECTED && player.infection === 0) {
    player.state = IMMUNE;
  } else if (player.state === HEALTHY && player.infection >= 100) {
    player.state = INFECTED;
  }
}

function getNextVelocity(player, newV) {
  if (!newV.filter(Boolean).length) {
    return [0, 0];
  }
  const speed = abs(newV);
  const maxSpeed =
    player.state === INFECTED
      ? config.world.maxSpeedWhenInfected
      : config.world.maxSpeedWhenHealthy;
  return speed < maxSpeed ? newV : multiply(newV, maxSpeed / speed);
}

io.on("connection", function (socket) {
  socket.emit("hello", socket.id);

  socket.on("join", (playerName) => spawnPlayer(socket.id, playerName));
  socket.on("change-name", (playerName) => {
    game.players[socket.id] = {
      ...game.players[socket.id],
      name: playerName,
    };
  });

  socket.on("move", (cmd) => {
    movePlayer(socket.id, cmd);
  });

  socket.on("disconnect", function () {
    delete game.players[socket.id];
  });
});

http.listen(config.port, function () {
  console.log(`listening on *:${config.port}`);
});
