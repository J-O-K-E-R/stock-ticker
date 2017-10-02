var socket = io();

var stocks = [
    "Grain",
    "Industrial",
    "Bonds",
    "Oil",
    "Silver",
    "Gold"
];

$(document).ready(function() {
    socket.emit("push user", userid);
    // sets up event listeners for buy/sell buttons
    $.each(stocks, function(i) {
        $("#buy-" + stocks[i].toLowerCase()).on("click", function() {
            socket.emit("buy stock", {i: i, userid: userid});
            console.log("buying stock " + i);
        });
        $("#sell-" + stocks[i].toLowerCase()).on("click", function() {
            socket.emit("sell stock", {i: i, userid: userid});
            console.log("selling stock " + i);
        });
    });

    // display the value of the stocks when the page loads
    socket.on("load", function(stocksvalue) {
        $.each(stocks, function(i) {
            $("#" + stocks[i]).text(stocksvalue[i]);
        });        
    });

    socket.on("render player", function(player) {
        $(".player-name").text(player.name);
        $(".player-money").text(player.money);
        $.each(stocks, function(i) {
            $("#player-" + stocks[i].toLowerCase()).text(player.stocks[i]);
        });
    });

    // updates the game with the result of the roll
    socket.on("roll", function(result) {
        $("#" + result.stock).text(result.stockvalue);
        $("#roll-stock").text(result.stock);
        $("#roll-dir").text(result.direction);
        $("#roll-num").text(result.delta);
    });

    socket.on("dividends", function() {
        socket.emit("update player", userid);
    });

    socket.on("crash", function() {
        socket.emit("update player", userid);
    });

    socket.on("split", function() {
        socket.emit("update player", userid);
        console.log("stock split");
    });
});