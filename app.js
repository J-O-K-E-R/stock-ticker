var express = require("express");
var http = require("http");
var path = require("path");
var socketIO = require("socket.io");
var mongoose = require("mongoose");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var bodyParser = require("body-parser");

var User = require("./models/user");
var Stocks = require("./models/stock");

var routes = require("./routes/index");
var apiRoutes = require("./routes/api");

var player = require("./player.js");

var app = express();
var server = http.Server(app);
var io = socketIO(server);

var dbUrl = process.env.DATABASEURL;
console.log(dbUrl);
// mongoose.connect(dbUrl);
mongoose.connect("mongodb://localhost/stock-ticker");
// mongoose.connect("mongodb://develop:brockolovestacos@test-shard-00-00-4gsmp.mongodb.net:27017,test-shard-00-01-4gsmp.mongodb.net:27017,test-shard-00-02-4gsmp.mongodb.net:27017/stock-ticker?ssl=true&replicaSet=test-shard-0&authSource=admin");
app.use(bodyParser.urlencoded({extended: true}));
app.set("port", (process.env.PORT || 5000));
app.use("/static", express.static(__dirname + "/static"));
app.set("view engine", "ejs");

app.use(require("express-session")({
    secret: "deschutes descores",
    resave: false,
    saveUninitialize: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    next();
});

app.get("/play", isLoggedIn, function(req, res) {
    res.render("index", {
        currentUser: req.user
    });
});

app.use(routes);
app.use("/api", apiRoutes);

server.listen(app.get("port"), function() {
    console.log("Starting server on port ", app.get("port"));
});

var stockNames = [
    "Grain",
    "Industrial",
    "Bonds",
    "Oil",
    "Silver",
    "Gold"
];

var stockValues = [195,195,195,195,195,195];
// Stocks.findOne({name: "main"}, function(err, foundStocks) {
//     stockValues = foundStocks.values;
//     console.log("loaded stock values: " + stockValues);
// });

var rollStock;
var rollDir;
var rollNum;
var delta;
var result = {};

var players = []

io.on("connection", function(socket) {
    socket.on("push user", function(userid) {
        User.findById(userid, function(err, user) {
            if (err) {
                console.log(err);
            } else {
                players.push(new player.Player(user._id, user.username, user.money, user.stocks));
                console.log("player connected");
                socket.emit("render player", players.find(function(player) {return player.id === user._id}));
            }
        });
    });

    socket.emit("load", stockValues);

    socket.on("disconnect", function() {
        playerDisconnect(socket.id);
        console.log("player disconnected");
    });

    socket.on("buy stock", function(data) {
        var player = players.find(function(player) {return player.id == data.userid});
        if(player) {
            player.buyStock(data.i, stockValues[data.i]);
            socket.emit("render player", player);
            User.findByIdAndUpdate(data.userid, {money: player.money, stocks: player.stocks}, function(err, user) {
                if (err) {
                    console.log(err);
                }
            });
        }
    });

    socket.on("sell stock", function(data) {
        var player = players.find(function(player) {return player.id == data.userid});
        if(player) {
            player.sellStock(data.i, stockValues[data.i]);
            socket.emit("render player", player);
            User.findByIdAndUpdate(data.userid, {money: player.money, stocks: player.stocks}, function(err, user) {
                if (err) {
                    console.log(err);
                }
            });
        }
    });

    socket.on("update player", function(userid) {
        var player = players.find(function(player) {return player.id == userid});
        User.findById(userid, function(err, user) {
            if (player) {
                player.money = user.money;
                player.stocks = user.stocks;
                console.log(player.stocks);
                socket.emit("render player", player);
            }
        });
    });
});

// rolls the dice every 3 seconds
setInterval(function() {
    rollDice();
    io.sockets.emit("roll", result);
    Stocks.findOne({name: "main"}, function(err, stocks) {
        stocks.values = stockValues;
        stocks.save();
    });
}, 2500);

// rolls dice, updates values and sends the result to the client
function rollDice() {
    result = {
        "stock": "",
        "direction": "",
        "delta": 0,
        "stockvalue": 0
    }
    rollStock = rollDie() - 1;
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
        stockValues[rollStock] += delta;
        if ( stockValues[rollStock] >= 200 ) {
            stockValues[rollStock] = 100;
            stockSplit(rollStock);
        }
        result.direction = "UP";
    } else if (rollDir == 2) {
        stockValues[rollStock] -= delta;
        if ( stockValues[rollStock] <= 0 ) {
            stockValues[rollStock] = 100;
            stockCrash(rollStock);
        }
        result.direction = "DOWN";
    } else {
        if (stockValues[rollStock] >= 100) {
            dividends(rollStock, delta);            
        }
        result.direction = "DIV";
    }
    result.stock = stockNames[rollStock];
    result.delta = delta;
    result.stockvalue = stockValues[rollStock];
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

function stockSplit(index) {
    User.find(function(err, users) {
        users.forEach(function(user) {
            user.stocks[index] *= 2;
            user.save(function(err, user, numAffected) {
                if(err) {
                    console.log(err);
                }
            });
            console.log("updated: " + user.username + " " + user.stocks[index]);
        });
        io.sockets.emit("split");
        users.forEach(function(user) {
            console.log(user.stocks[index]);
        });
        console.log("split complete");
    });
}

function stockCrash(index) {
    User.find(function(err, users) {
        users.forEach(function(user) {
            user.stocks[index] = 0;
            user.save();
        });
        io.sockets.emit("crash");
    });
}

function dividends(index, amount) {
    User.find(function(err, users) {
        users.forEach(function(user) {
            user.money += user.stocks[index] * amount / 100;
            user.save();
        });
        io.sockets.emit("dividends");
    });
}

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("login");
}