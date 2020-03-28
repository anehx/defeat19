const app = require("express")();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

const WORLD_SIZE = 1000;
const MAX_SPEED = 5;
const ACCELERATION = 0.5;
const INFECTION_THRESHOLD_DISTANCE = 150;
const INFECTION_SPEED = 1;
const INFECTION_REDUCE = 0.02;

const state = {
  players: {},
};

function gameLoop() {
  Object.entries(state.players).map(([id, player]) => {
    state.players[id] = updatePlayer(player);
  });

  io.emit("update", state);
}

setInterval(gameLoop, 1000 / 60);

function addPlayer(id) {
  const loc = [Math.random() * WORLD_SIZE, Math.random() * WORLD_SIZE];
  console.log(`new player ${id} joined at ${loc}`);
  const infected = Object.keys(state.players).length % 2 > 0;
  state.players[id] = {
    id,
    loc,
    v: [0, 0],
    infected,
    infection: infected ? 100 : 0,
  };
}

function movePlayer(id, cmd) {
  state.players[id].v = getNextVelocity(state.players[id].v, cmd);
}

function isWithinBoundary(coord) {
  return 0 <= coord && coord <= WORLD_SIZE;
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
    between(newPosition[0], 0, WORLD_SIZE),
    between(newPosition[1], 0, WORLD_SIZE),
  ];
}

function between(value, min, max) {
  return Math.max(Math.min(max, value), 0);
}

function updatePlayer(player) {
  boundaryControl(player);
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
    .filter((distance) => distance < INFECTION_THRESHOLD_DISTANCE)
    // linear infection rate increase below threshold
    .reduce((tot, distance) => {
      return (
        tot +
        linear(
          distance,
          INFECTION_THRESHOLD_DISTANCE / 2,
          INFECTION_THRESHOLD_DISTANCE,
          INFECTION_SPEED,
          0
        )
      );
    }, 0);

  const newInfectionScore = Math.max(
    0,
    player.infection + infectionRaise - INFECTION_REDUCE
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
        return add(v, [0, -1 * ACCELERATION]);
      case "down":
        return add(v, [0, ACCELERATION]);
      case "left":
        return add(v, [-1 * ACCELERATION, 0]);
      case "right":
        return add(v, [ACCELERATION, 0]);
    }
  };
  const newV = _getV(v, cmd);
  const speed = abs(newV);
  return speed < MAX_SPEED ? newV : multiply(newV, MAX_SPEED / speed);
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
