const express = require("express");
const app = express();
const uuid = require("uuid");
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const config = require("../config");

app.get("/debug", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.use(express.static(__dirname + "/../client/dist/"));

const state = {
  players: {},
  items: {},
};

function gameLoop() {
  Object.entries(state.players).map(([id, player]) => {
    state.players[id] = updatePlayer(player);
  });

  io.emit("update", state);
}

function spawnItem() {
  state.items[uuid.v4()] = { loc: getRandomLoc() };
  const spawnMs = config.item.spawnFrequency * 1000;
  setTimeout(
    spawnItem,
    spawnMs + linear(Math.random(), 0, 1, -0.3 * spawnMs, 0.3 * spawnMs)
  );
}

setInterval(gameLoop, 1000 / config.simulationSpeed);
setTimeout(spawnItem);

function getRandomLoc() {
  return [Math.random() * config.world.size, Math.random() * config.world.size];
}

function addPlayer(id) {
  const loc = getRandomLoc();
  console.log(`new player ${id} joined at ${loc}`);
  const infected = Object.keys(state.players).length % 2 > 0;
  state.players[id] = {
    id,
    loc,
    v: [0, 0],
    infected,
    infection: infected ? 100 : 0,
    health: 100,
  };
}

function movePlayer(id, cmd) {
  state.players[id].v = getNextVelocity(state.players[id].v, cmd);
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
  boundaryControl(player);
  collectItems(player);
  decreaseHealth(player);
  if (!player.infected) {
    player.infection = Math.min(getNextInfectionScore(player), 100);
    player.infected = player.infection === 100;
  }
  return player;
}

// linear scaling
function linear(x, x1 = 0, x2 = 1, y1 = 0, y2 = 1) {
  if (x <= x1) return y1;
  if (x >= x2) return y2;
  const m = (y2 - y1) / (x2 - x1);
  return m * x + y1 - m * x1;
}

function decreaseHealth(player) {
  player.health -= config.health.reduce / config.simulationSpeed;
}

function collectItems(player) {
  const itemsInRange = Object.entries(state.items)
    // map to distances
    .map(([id, item]) => {
      return [id, abs(add(item.loc, multiply(player.loc, -1)))];
    })
    .filter(([id, distance]) => {
      return distance <= config.player.size * 2;
    });

  if (itemsInRange.length) {
    console.log("eating", itemsInRange);
    player.health += config.health.itemIncrease * itemsInRange.length;
  }

  itemsInRange.forEach(([id, _]) => {
    delete state.items[id];
  });
}

function getNextInfectionScore(player) {
  const infectionRaise = Object.entries(state.players)
    // can't self-infect
    .filter(([otherId, _]) => otherId !== player.id)
    // only infected players can pass it on
    .filter(([_, otherPlayer]) => otherPlayer.infected)
    // map to distances
    .map(([_, otherPlayer]) => {
      return abs(add(otherPlayer.loc, multiply(player.loc, -1)));
    })
    .filter((distance) => distance < config.infection.thresholdDistance)
    // linear infection rate increase below threshold
    .reduce((tot, distance) => {
      return (
        tot +
        linear(
          distance,
          config.infection.thresholdDistance / 2,
          config.infection.thresholdDistance,
          config.infection.speed,
          0
        )
      );
    }, 0);

  const newInfectionScore = Math.max(
    0,
    player.infection + infectionRaise - config.infection.reduce
  );
  return newInfectionScore;
}

function add(v1, v2) {
  return [v1[0] + v2[0], v1[1] + v2[1]];
}

function abs(v) {
  return Math.sqrt(v[0] ** 2 + v[1] ** 2);
}

function multiply(v, skalar) {
  return v.map((i) => i * skalar);
}

function getNextVelocity(v, cmd) {
  const _getV = (v, cmd) => {
    switch (cmd) {
      case "up":
        return add(v, [0, -1 * config.world.acceleration]);
      case "down":
        return add(v, [0, config.world.acceleration]);
      case "left":
        return add(v, [-1 * config.world.acceleration, 0]);
      case "right":
        return add(v, [config.world.acceleration, 0]);
    }
  };
  const newV = _getV(v, cmd);
  const speed = abs(newV);
  return speed < config.world.maxSpeed
    ? newV
    : multiply(newV, config.world.maxSpeed / speed);
}

io.on("connection", function (socket) {
  addPlayer(socket.id);

  socket.emit("hello", socket.id);

  socket.on("move", (cmd) => {
    console.log("received move event", cmd);
    movePlayer(socket.id, cmd);
    io.emit("update", state);
  });

  socket.on("disconnect", function () {
    console.log("user disconnected");
    delete state.players[socket.id];
  });
});

http.listen(3000, function () {
  console.log("listening on *:3000");
});
