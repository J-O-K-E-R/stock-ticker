const socket = io();

const stocks = [
    "Grain",
    "Industrial",
    "Bonds",
    "Oil",
    "Silver",
    "Gold"
];

$(document).ready(function() {
    socket.emit("push user", userid);

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

    socket.on("load", function(stocksvalue) {
        $.each(stocks, function(i) {
            $("#" + stocks[i]).text(stocksvalue[i]);
        });
        socket.emit("update player", userid);
    });

    socket.on("render player", function(player) {
        $(".player-name").text(player.name);
        $(".player-money").text(player.money);
        $.each(stocks, function(i) {
            $("#player-" + stocks[i].toLowerCase()).text(player.stocks[i]);
        });
    });

    socket.on("roll", function(result) {
        $("#" + result.stock).text(result.stockvalue);
        $("#roll-stock").text(result.stock);
        $("#roll-dir").text(result.direction);
        $("#roll-num").text(result.delta);
    });

    // Could use only one event for div/split/crash, but will keep seperate in case we need to pass specific data with them
    socket.on("dividends", function() {
        socket.emit("update player", userid);
    });

    socket.on("crash", function() {
        socket.emit("update player", userid);
    });

    socket.on("split", function(data) {
        socket.emit("update player", userid);
    });
});