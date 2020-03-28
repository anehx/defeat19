const app = require("express")();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

const WORLD_SIZE = 10000;

const state = {
  players: [],
};

addPlayer = () => {
  const loc = [Math.random(WORLD_SIZE), Math.random(WORLD_SIZE)];
  console.log("new player joined at: ", loc);
  state.players.push({ loc });
};

io.on("connection", function (socket) {
  addPlayer();

  socket.emit("state", state);

  socket.on("move", (cmd) => {
    console.log("received move event", cmd);
  });

  socket.on("disconnect", function () {
    console.log("user disconnected");
  });
});

http.listen(3000, function () {
  console.log("listening on *:3000");
});
