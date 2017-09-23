var socket = io();

// var stocksvalue = [100, 100, 100, 100, 100, 100];

var stocks = {
    "grain-value": 100,
    "industrial-value": 100,
    "bonds-value": 100,
    "oil-value": 100,
    "silver-value": 100,
    "gold-value": 100
};

$(document).ready(function() {
    $("#roll").on("click", function() {
        socket.emit("roll", "player rolled");
    });

    socket.on("update", function(result) {
        console.log("updating with...");
        console.log(result.stocksvalue);
        var i = 0;
        $.each(stocks, function(key, value) {
            stocks.key = result.stocksvalue[i];
            $("#" + key).text(stocks.key);
            i++;
        });
        $("#roll-stock").text(result.stock);
        $("#roll-dir").text(result.direction);
        $("#roll-num").text(result.delta);
    });
});