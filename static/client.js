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
    // sets up event listeners for buy/sell buttons
    $.each(stocks, function(i) {
        $("#buy-" + stocks[i].toLowerCase()).on("click", function() {
            socket.emit("buy stock", i);
            console.log("buying stock " + i);
        });
        $("#sell-" + stocks[i].toLowerCase()).on("click", function() {
            socket.emit("sell stock", i);
            console.log("selling stock " + i);
        })
    });

    // display the value of the stocks when the page loads
    socket.on("load", function(stocksvalue) {
        $.each(stocks, function(i) {
            $("#" + stocks[i]).text(stocksvalue[i]);
        });        
    });

    socket.on("render player", function(players) {
        $.each(players, function(i) {
            if (players[i].id === socket.id) {
                $(".player-name").text(players[i].id);
                $(".player-money").text(players[i].money);
                $.each(players[i].stocks, function(j) {
                    $("#player-" + stocks[j].toLowerCase()).text(players[i].stocks[j]);
                });
            }
        });
    });

    // updates the game with the result of the roll
    socket.on("update", function(result) {
        $("#" + result.stock).text(result.stockvalue);
        $("#roll-stock").text(result.stock);
        $("#roll-dir").text(result.direction);
        $("#roll-num").text(result.delta);
    });
});