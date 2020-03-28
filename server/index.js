const app = require("express")();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

const WORLD_SIZE = 10000;

const state = {
  players: {},
};

function gameLoop() {
  Object.entries(state.players).map(([id, player]) => {
    console.log("update Player", player);
    state.players[id] = updatePlayer(player);
  });
}

setInterval(gameLoop, 1000);

function addPlayer(id) {
  const loc = [Math.random(WORLD_SIZE), Math.random(WORLD_SIZE)];
  console.log(`new player ${id} joined at ${loc}`);
  state.players[id] = { loc, v: [0, 0] };
}

function movePlayer(id, cmd) {
  state.players[id].v = getNextVelocity(state.players[id].v, cmd);
}

function updatePlayer(player) {
  return { ...player, loc: add(player.loc, player.v) };
}

function add(v1, v2) {
  return [v1[0] + v2[0], v1[1] + v2[1]];
}

function getNextVelocity(v, cmd) {
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
  });
});

http.listen(3000, function () {
  console.log("listening on *:3000");
});
