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

function rollDie() {
    return Math.floor(Math.random()*6) + 1;
}

io.on("connection", function(socket) {
    socket.on("roll", function(data) {
        result = {
            "stock": "",
            "direction": "",
            "delta": 0,
            "stocksvalue": []
        }
        console.log(data);
        rollStock = rollDie();
        console.log(rollStock);
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
            // DIVIDENDS!!$$!s
            result.direction = "DIV";
            console.log("$$$$$$$$$$$$$$$$$$$$$$$$");
        }
        result.stock = stocksname[rollStock];
        result.delta = delta;
        result.stocksvalue = stocksvalue;
        socket.emit("update", result);
    });
});

// testing connection
setInterval(function() {
    io.sockets.emit("message", "hi!");
}, 1000);