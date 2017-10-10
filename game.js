const socketIO = require("socket.io");

const User = require("./models/user");
const Stocks = require("./models/stock");

const player = require("./player.js");

const stockNames = [
    "Grain",
    "Industrial",
    "Bonds",
    "Oil",
    "Silver",
    "Gold"
];

exports.Game = class Game {
    constructor() {
        this.players = [];
        Stocks.findOne({name: "main"}, function(err, stocks) {
            this.stockValues = stocks.values;
        });
        this.rollResult = {};
        this.rollHistory = [];
        this.io = io;
    }

    pushPlayer(userId) {
        User.findById(userId, function(err, user) {
            if (err) {
                console.log(err);
            } else {
                this.players.push(new player.Player(user._id, user.username, user.money, user.stocks));
            }
        });
    }
    
    dropPlayer(userId) {
        const index = players.findIndex(function(i) {
            return i.id === id;
        });
        players.splice(index, 1);
    }

    roll() {
        if(Object.keys(this.rollResult).length !== 0) {
            if(this.rollHistory.length >= 5) {
                this.rollHistory.pop();
            }
            this.rollHistory.unshift(cloneResult(this.rollResult));
        }

        const stock = rollDie() - 1;
        const dir = Math.ceil(rollDie() / 2);
        const num = Math.ceil(rollDie() / 2);
        let delta;
        if (num == 1) {
            delta = 5;
        } else if (num == 2) {
            delta = 10;
        } else {
            delta = 20;
        }

        if (dir == 1) {
            this.stockValues[stock] += delta;
            if ( this.stockValues[stock] >= 200 ) {
                this.stockValues[stock] = 100;
                stockSplit(stock);
            }
            this.rollResult.direction = "UP";
        } else if (dir == 2) {
            this.stockValues[stock] -= delta;
            if ( this.stockValues[stock] <= 0 ) {
                this.stockValues[stock] = 100;
                stockCrash(stock);
            }
            this.rollResult.direction = "DOWN";
        } else {
            if (this.stockValues[stock] >= 100) {
                dividends(stock, delta);            
            }
            this.rollResult.direction = "DIV";
        }

        this.rollResult.stock = stockNames[stock];
        this.rollResult.delta = delta;
        this.rollResult.newValue = this.stockValues[stock];

        io.sockets.emit("roll", {roll: this.rollResult, history: this.rollHistory});

        Stocks.findOneAndUpdate({name: "main"}, {values: this.stockValues}, function(err, stocks) {
            if(err) {
                console.log(err);
            }
        });
    }
}

function stockSplit(index) {
    User.find(function(err, users) {
        users.forEach(function(user) {
            let temp = user.stocks;
            temp[index] *= 2;
            User.findByIdAndUpdate(user._id, {stocks: temp}, function(err, user){

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
            User.findByIdAndUpdate(user._id, {stocks: temp}, function(err, user){

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

function rollDie() {
    return Math.floor(Math.random()*6) + 1;
}

function cloneResult(result) {
    let clone = {};
    for(let key in result) {
        clone[key] = result[key];
    }
    return clone;
}