var express = require("express");
var http = require("http");
var path = require("path");
var socketIO = require("socket.io");

var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.set("port", 3000);
app.use("/static", express.static(__dirname + "/static"));
app.set("view engine", "ejs");

app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "/static/index.html"));
});

server.listen(3000, function() {
    console.log("Starting server on port 3000");
});

// server game logic
var stocksvalue = [100,100,100,100,100,100];

var rollStock;
var rollDir;
var rollNum;
var delta;
var result = {};

io.on("connection", function(socket) {
    socket.on("roll", function(data) {
        console.log(data);
        rollStock = Math.floor((Math.random()*6) + 1);
        console.log(rollStock);
        rollDir = (Math.random() >= 0.5);
        rollNum = Math.floor((Math.random()*3) + 1);
        if (rollNum == 1) {
            delta = 5;
        } else if (rollNum == 2) {
            delta = 10;
        } else {
            delta = 20;
        }
        if (rollDir) {
            stocksvalue[rollStock] += delta;
        } else {
            stocksvalue[rollStock] -= delta;
        }
        result = {
            "rollStock": rollStock,
            "rollDir": rollDir,
            "delta": delta,
            "stocksvalue": stocksvalue
        }
        socket.emit("update", result);
    })
});

// testing connection
setInterval(function() {
    io.sockets.emit("message", "hi!");
}, 1000);