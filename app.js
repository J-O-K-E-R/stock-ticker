const express = require("express");
const http = require("http");
const path = require("path");
const socketIO = require("socket.io");
const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const bodyParser = require("body-parser");

const User = require("./models/user");
const Stocks = require("./models/stock");

const routes = require("./routes/index");
const apiRoutes = require("./routes/api");

const player = require("./player.js");

const app = express();
const server = http.Server(app);
const io = socketIO(server);

const dbUrl = process.env.DBURL || "mongodb://localhost/stock-ticker"
console.log(dbUrl);
mongoose.connect(dbUrl);
// mongoose.connect("mongodb://localhost/stock-ticker");
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

const stockNames = [
    "Grain",
    "Industrial",
    "Bonds",
    "Oil",
    "Silver",
    "Gold"
];

let stockValues = [];
// let stockValues = [5,5,5,195,195,195];
Stocks.findOne({name: "main"}, function(err, foundStocks) {
    stockValues = foundStocks.values;
    console.log("loaded stock values: " + stockValues);
});

let rollStock;
let rollDir;
let rollNum;
let delta;
let result = {};
let resultHist = [];

let players = []

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

    socket.emit("roll", {result: result, resultHist: resultHist});

    socket.on("disconnect", function() {
        playerDisconnect(socket.id);
        console.log("player disconnected");
    });

    socket.on("buy stock", function(data) {
        let player = players.find(function(player) {return player.id == data.userid});
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
        let player = players.find(function(player) {return player.id == data.userid});
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
        let player = players.find(function(player) {return player.id == userid});
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

setInterval(function() {
    Stocks.findOne({name: "main"}, function(err, stocks) {
        stockValues = stocks.values;
    });
    // if(Object.keys(result).length !== 0) {
        if(resultHist.length >= 5) {
            resultHist.pop();
        }
        resultHist.unshift(cloneResult(result));
    // }
    rollDice();
    io.sockets.emit("roll", {result: result, resultHist: resultHist});
    Stocks.findOne({name: "main"}, function(err, stocks) {
        stocks.values = stockValues;
        stocks.save();
    });
    console.log(resultHist);
}, 300000);

app.post("/admin/reset", isLoggedIn, isAdmin, function(req, res) {
    User.find(function(err, users) {
        users.forEach(function(user) {
            user.money = 5000;
            user.stocks = [0, 0, 0, 0, 0, 0]
            user.save();
        });
    });
    Stocks.findOne({name: "main"}, function(err, foundStocks) {
        foundStocks.values = [100, 100, 100, 100, 100, 100];
        stockValues = [100, 100, 100, 100, 100, 100];
        foundStocks.save();
        // io.sockets.emit("load", stockValues);    
    });
    players.forEach(function(player) {
        User.findById(player.id, function(err, user) {
            if(player) {
                player.money = user.money;
                player.stocks = user.stocks;
            }
        });
    });
    io.sockets.emit("dividends");
    io.sockets.emit("load", stockValues);
    res.send("game reset");
});

function rollDice() {
    
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
    const index = players.findIndex(function(i) {
        return i.id === id;
    });
    players.splice(index,1);
}

function stockSplit(index) {
    User.find(function(err, users) {
        users.forEach(function(user) {
            let temp = user.stocks;
            temp[index] *= 2;
            User.findByIdAndUpdate(user._id, {stocks: temp}, function(err, user) {

            });
        });
        io.sockets.emit("split");
    });
}

function stockCrash(index) {
    User.find(function(err, users) {
        users.forEach(function(user) {
            let temp = user.stocks;
            temp[index] = 0;
            User.findByIdAndUpdate(user._id, {stocks: temp}, function(err, user) {

            });
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

function isAdmin(req, res, next) {
    if (req.user.isAdmin === true) {
        return next();
    }
    res.redirect("login");
}

function cloneResult(result) {
    let clone = {};
    for(let key in result) {
        clone[key] = result[key];
    }
    return clone;
}