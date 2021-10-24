const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const cors = require("cors");

const { addUser, removeUser, getUser, getUserInRoom } = require("./users.js");

const PORT = process.env.PORT || 5000;

const router = require("./router");
const { Socket } = require("dgram");

const app = express();
const server = http.createServer(app);
//const io = socketio(server);
const io = socketio(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});
app.use(cors());
app.use(router);

io.on("connection", (socket) => {
  console.log("We have a new connection!!!");

  socket.on("join", ({ name, room }, callback) => {
    console.log(name, room);
    const { error, user } = addUser({ id: socket.id, name, room });
    if (error) return callback(error);

    socket.join(user.room);    
    socket.emit("message", {
      user: "admin",
      text: `${user.name}, welcome to the ${user.room}.`,
    });
    socket.broadcast
      .to(user.room)
      .emit("message", { user: "admin", text: `${user.name} has joined.` });

    io.to(user.room).emit('roomData', { room : user.room, users : getUserInRoom(user.room)});

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    console.log("@@@@",user);
    io.to(user.room).emit("message", { user: user.name, text: message });
    io.to(user.room).emit("roomData", { room: user.room, users: getUserInRoom(user.room) });

    callback();
  });

  socket.on("disconnect", () => {
    console.log("User has left!!!!");
  });
});

server.listen(PORT, () => {
  console.log(`Server has started ${PORT}`);
});
