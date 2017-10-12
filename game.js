const socketIO = require("socket.io");

const User = require("./models/user");
const Stocks = require("./models/stock");
const Trends = require("./models/trend");
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
    constructor(io) {
        let temp;
        this.players = [];
        let getStocks = new Promise(
            (resolve, reject) => {
                Stocks.findOne({name: "main"}, function(err, stocks) {
                    temp = stocks.values;
                    resolve(temp);
                });
            }
        )
        getStocks.then((temp) => {
            this.stockValues = temp;
        });
        this.rollResult = {};
        this.rollHistory = [];
        this.io = io;
        console.log(this.io)
    }

    pushPlayer(userId) {
        let temp;
        let findPlayer = new Promise(
            (resolve, reject) => {
                User.findById(userId, function(err, user) {
                    temp = new player.Player(user._id, user.username, user.money, user.stocks);
                    resolve(temp);
                });
            }
        );
        findPlayer.then((temp) => {
            this.players.push(temp);
        })
    }
    
    dropPlayer(userId) {
        const index = this.players.findIndex(function(i) {
            return i.id === userId;
        });
        this.players.splice(index, 1);
    }

    roll() {
        if(Object.keys(this.rollResult).length !== 0) {
            if(this.rollHistory.length >= 25) {
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
                stockSplit(stock, this.io);
            }
            this.rollResult.direction = "UP";
        } else if (dir == 2) {
            this.stockValues[stock] -= delta;
            if ( this.stockValues[stock] <= 0 ) {
                this.stockValues[stock] = 100;
                stockCrash(stock, this.io);
            }
            this.rollResult.direction = "DOWN";
        } else {
            if (this.stockValues[stock] >= 100) {
                dividends(stock, delta, this.io);            
            }
            this.rollResult.direction = "DIV";
        }

        this.rollResult.stock = stockNames[stock];
        this.rollResult.delta = delta;
        this.rollResult.newValue = this.stockValues[stock];

        this.io.sockets.emit("roll", {result: this.rollResult, resultHist: this.rollHistory});

        Stocks.findOneAndUpdate({name: "main"}, {values: this.stockValues}, function(err, stocks) {
            if(err) {
                console.log(err);
            }
        });

        let toBeSaved = this.rollResult;
        Trends.findOne({index: stock}, function(err, trend) {
            if (trend.history.length >= 50) {
                trend.history.pop();
            }
            trend.history.unshift(toBeSaved);
            trend.save();
        });

        let updateTrend = new Promise(
            (resolve, reject) => {
                Trends.findOne({index: stock}, function(err, trend) {
                    if (err) {
                        // handle error
                    }
                    resolve(trend);
                });
            }
        )
        updateTrend.then( (trend) => {
            console.log(trend);
            this.io.sockets.emit("update one trend", trend);
        });
    }

    buyStock(index, userId) {
        let player = this.players.find(function(player) {return player.id == userId});
        player.buyStock(index, this.stockValues[index]);
        User.findByIdAndUpdate(userId, {money: player.money, stocks: player.stocks}, function(err, user) {
            if (err) {
                console.log(err);
            }
        });

        return player;
    }

    sellStock(index, userId) {
        let player = this.players.find(function(player) {return player.id == userId});
        player.sellStock(index, this.stockValues[index]);
        User.findByIdAndUpdate(userId, {money: player.money, stocks: player.stocks}, function(err, user) {
            if (err) {
                console.log(err);
            }
        });

        return player;
    }
}

function stockSplit(index, io) {
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

function stockCrash(index, io) {
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

function dividends(index, amount, io) {
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