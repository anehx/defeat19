const app = require("express")();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

const WORLD_SIZE = 10;
const MAX_SPEED = 1;

const state = {
  players: {},
};

function gameLoop() {
  Object.entries(state.players).map(([id, player]) => {
    console.log("update Player", player);
    state.players[id] = updatePlayer(player);
  });

  io.emit("update", state);
}

setInterval(gameLoop, 1000);

function addPlayer(id) {
  const loc = [Math.random() * WORLD_SIZE, Math.random() * WORLD_SIZE];
  console.log(`new player ${id} joined at ${loc}`);
  state.players[id] = { loc, v: [0, 0], infection: 0 };
}

function movePlayer(id, cmd) {
  state.players[id].v = getNextVelocity(state.players[id].v, cmd);
}

function boundary(loc) {
  return [between(loc[0], 0, WORLD_SIZE), between(loc[1], 0, WORLD_SIZE)];
}

function between(value, min, max) {
  return Math.max(Math.min(max, value), 0);
}

function updatePlayer(player) {
  const loc = boundary(add(player.loc, player.v));
  return { ...player, loc };
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
        return add(v, [0, 0.1]);
      case "down":
        return add(v, [0, -0.1]);
      case "left":
        return add(v, [-0.1, 0]);
      case "right":
        return add(v, [0.1, 0]);
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
