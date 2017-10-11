const express = require("express");
const http = require("http");
const path = require("path");
const socketIO = require("socket.io");
const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const bodyParser = require("body-parser");

const User = require("./models/user");

const routes = require("./routes/index");

const gameClass = require("./game.js");

const app = express();
const server = http.Server(app);
const io = socketIO(server);

const dbUrl = process.env.DBURL || "mongodb://localhost/stock-ticker"
mongoose.connect(dbUrl);

let rollInterval = 3000;
// uncomment this to set the roll interval to 10 minutes on the live server 
// if (process.env.NODE_ENV === 'production') {
//     const rollInterval = 600000;
// }

app.use(bodyParser.urlencoded({extended: true}));
app.set("port", (process.env.PORT || 5000));
app.use("/static", express.static(__dirname + "/static"));
app.set("view engine", "ejs");

app.use(require("express-session")({
    secret: "deschutes descores",
    resave: false,
    saveUninitialized: false
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

server.listen(app.get("port"), function() {
    console.log("Starting server on port ", app.get("port"));
});

const game = new gameClass.Game(io);

io.on("connection", function(socket) {
    socket.emit("load", game.stockValues);
    socket.emit("roll", {result: game.rollResult, resultHist: game.rollHistory});

    socket.on("push user", function(userId) {
        game.pushPlayer(userId);
    });
    
    socket.on("disconnect", function(userId) {
        game.dropPlayer(userId);
    });

    socket.on("buy stock", function(data) {
        let player = game.buyStock(data.i, data.userid);
        socket.emit("render player", player);
    });

    socket.on("sell stock", function(data) {
        let player = game.sellStock(data.i, data.userid);
        socket.emit("render player", player);
    });

    socket.on("update player", function(userId) {
        let player = game.players.find(function(player) {return player.id == userId});
        User.findById(userId, function(err, user) {
            if (player) {
                player.money = user.money;
                player.stocks = user.stocks;
                socket.emit("render player", player);
            }
        })
    });
});

setInterval( function() {
    game.roll();
    io.emit("load", game.stockValues);
}, rollInterval);

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

// app.post("/admin/reset", isLoggedIn, isAdmin, function(req, res) {
//     User.find(function(err, users) {
//         users.forEach(function(user) {
//             user.money = 5000;
//             user.stocks = [0, 0, 0, 0, 0, 0]
//             user.save();
//         });
//     });
//     Stocks.findOne({name: "main"}, function(err, foundStocks) {
//         foundStocks.values = [100, 100, 100, 100, 100, 100];
//         stockValues = [100, 100, 100, 100, 100, 100];
//         foundStocks.save();
//         // io.sockets.emit("load", stockValues);    
//     });
//     players.forEach(function(player) {
//         User.findById(player.id, function(err, user) {
//             if(player) {
//                 player.money = user.money;
//                 player.stocks = user.stocks;
//             }
//         });
//     });
//     io.sockets.emit("dividends");
//     io.sockets.emit("load", stockValues);
//     res.send("game reset");
// });