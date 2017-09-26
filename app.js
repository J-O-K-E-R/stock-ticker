var express = require("express");
var http = require("http");
var path = require("path");
var socketIO = require("socket.io");

var app = express();
var server = http.Server(app);
var io = socketIO(server);

var player = require("./player.js");

app.set("port", 3000);
app.use("/static", express.static(__dirname + "/static"));

app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "/static/index.html"));
});

server.listen(3000, function() {
    console.log("Starting server on port 3000");
});

// server game logic
var stocksname = [
    "Grain",
    "Industrial",
    "Bonds",
    "Oil",
    "Silver",
    "Gold"
];

var stocksvalue = [100,100,100,100,100,100];

var rollStock;
var rollDir;
var rollNum;
var delta;
var result = {};

var players = [];
console.log(players.length);

io.on("connection", function(socket) {
    players.push(new player.Player(socket.id,"Player ",2000,[0,1000,0,500,0,3500]));
    console.log("a player connected");

    // sends the value of the stocks to the client when it connects/refreshes
    socket.emit("load", stocksvalue);
    // notifies all clients when a player joins
    io.sockets.emit("update player list", players);

    socket.on("disconnect", function() {
        playerDisconnect(socket.id);
        io.sockets.emit("update player list", players);
        console.log("a player disconnected");
    });

    // rolls the dice, updates values, sends result back to client
    socket.on("roll", function(data) {
        rollDice();
        io.sockets.emit("update", result);
    });
});

// rolls the dice every 3 seconds
setInterval(function() {
    rollDice();
    io.sockets.emit("update", result);
}, 3000);

// rolls dice, updates values and sends the result to the client
function rollDice() {
    result = {
        "stock": "",
        "direction": "",
        "delta": 0,
        "stockvalue": 0
    }
    rollStock = rollDie();
    rollDir = Math.ceil(rollDie() / 2);
    rollNum = Math.ceil(rollDie() / 2);
    if (rollNum == 1) {
        delta = 5;
    } else if (rollNum == 2) {
        delta = 10;
    } else {
        delta = 20;
    }
    if (rollDir == 1) {
        stocksvalue[rollStock] += delta;
        if ( stocksvalue[rollStock] >= 200 ) {
            stocksvalue[rollStock] = 100;
        }
        result.direction = "UP";
    } else if (rollDir == 2) {
        stocksvalue[rollStock] -= delta;
        if ( stocksvalue[rollStock] <= 0 ) {
            stocksvalue[rollStock] = 100;
        }
        result.direction = "DOWN";
    } else {
        // TODO: handle dividends
        result.direction = "DIV";
    }
    result.stock = stocksname[rollStock];
    result.delta = delta;
    result.stockvalue = stocksvalue[rollStock];
};

function rollDie() {
    return Math.floor(Math.random()*6) + 1;
}

// handles player disconnects
function playerDisconnect(id) {
    var index = players.findIndex(function(i) {
        return i.id === id;
    });
    players.splice(index,1);
}