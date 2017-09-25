var express = require("express");
var http = require("http");
var path = require("path");
var socketIO = require("socket.io");

var app = express();
var server = http.Server(app);
var io = socketIO(server);

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



io.on("connection", function(socket) {
    // sends the value of the stocks to the client when it connects/refreshes
    socket.emit("load", stocksvalue);

    // rolls the dice, updates values, sends result back to client
    socket.on("roll", function(data) {
        rollDice(socket);
    });

    // rolls the dice every 3 seconds
    setInterval(function() {
        rollDice(socket);
    }, 3000);
});

// rolls dice, updates values and sends the result to the client
function rollDice(socket) {
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
    socket.emit("update", result);
};

function rollDie() {
    return Math.floor(Math.random()*6) + 1;
}