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

    // updates the game with the result of the roll
    socket.on("update", function(result) {
        $("#" + result.stock).text(result.stockvalue);
        $("#roll-stock").text(result.stock);
        $("#roll-dir").text(result.direction);
        $("#roll-num").text(result.delta);
    });
});