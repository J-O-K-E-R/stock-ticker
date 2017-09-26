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
    $("#roll").on("click", function() {
        socket.emit("roll", "player rolled");
    });

    // display the value of the stocks when the page loads
    socket.on("load", function(stocksvalue) {
        $.each(stocks, function(i) {
            $("#" + stocks[i]).text(stocksvalue[i]);
        });        
    });

    socket.on("update player list", function(players) {
        console.log(players);
        $("#player-list").empty();
        $.each(players, function(i) {
            $("#player-list").append('<li class="player-display" id="' + players[i].id + '"></li>');
            $("#" + players[i].id).append('<div class="player-name">' + players[i].id + "</div>");
            $("#" + players[i].id).append('<div class="player-money">$' + players[i].money + "</div>");
            $("#" + players[i].id).append('<ul class="player-stocks"></ul>')
            $.each(players[i].stocks, function(j) {
                $("#" + players[i].id + "> ul").append('<li class="player-stock-display">' + players[i].stocks[j] + "</li>");
            });
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