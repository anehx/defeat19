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

const game = {
  players: {},
  items: {},
};

function gameLoop() {
  setTimeout(gameLoop, 1000 / config.simulationSpeed);
  // console.time("game");

  Object.entries(game.players).map(([id, player]) => {
    game.players[id] = updatePlayer(player);
  });
  // console.timeEnd("game");

  io.emit("update", game);
}

function spawnItem() {
  if (Object.keys(game.items).length <= getLivingPlayerCount()) {
    const id = uuid.v4();
    game.items[id] = { id, loc: getRandomLoc() };
  }
  const spawnTimeout =
    (config.item.spawnDelay * 1000) / Math.max(1, getLivingPlayerCount());
  const offset = linear(
    Math.random(),
    0,
    1,
    -0.2 * spawnTimeout,
    0.2 * spawnTimeout
  );

  setTimeout(spawnItem, spawnTimeout + offset);
}

gameLoop();
spawnItem();

function getRandomLoc() {
  return [Math.random() * config.world.size, Math.random() * config.world.size];
}

function getLivingPlayerCount() {
  return Object.values(game.players).filter((player) => !player.dead).length;
}

function spawnPlayer(id) {
  const loc = getRandomLoc();

  console.log(getLivingPlayerCount() % 3);
  const state = getLivingPlayerCount() % 3 === 0 ? INFECTED : HEALTHY;

  game.players[id] = {
    id,
    loc,
    v: [0, 0],
    state,
    infection: state === INFECTED ? 100 : 0,
    health: 100,
  };
}

function movePlayer(id, mouseDir) {
  game.players[id].v = getNextVelocity(mouseDir);
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
  }
}

function collectItems(player) {
  const itemsInRange = Object.values(game.items)
    .map(({ id, loc }) => ({ id, distance: distance(loc, player.loc) }))
    .filter(({ distance }) => distance <= config.player.size * 2);

  const itemCount = itemsInRange.length;
  if (itemCount > 0) {
    player.health = Math.min(
      100,
      player.health + config.health.itemIncrease * itemCount
    );
  }

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
          .map((otherPlayer) => distance(otherPlayer.loc, player.loc))
          .filter((distance) => distance < config.infection.thresholdDistance)
          // linear infection rate increase below threshold
          .reduce((total, distance) => {
            return (
              total +
              linear(
                distance,
                config.infection.thresholdDistance / 2,
                config.infection.thresholdDistance,
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

function getNextVelocity(mouseDir) {
  const newV = mouseDir;
  const speed = abs(newV);
  return speed < config.world.maxSpeed
    ? newV
    : multiply(newV, config.world.maxSpeed / speed);
}

io.on("connection", function (socket) {
  spawnPlayer(socket.id);

  socket.emit("hello", socket.id);

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
