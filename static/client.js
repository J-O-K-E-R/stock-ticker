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

    socket.on("roll", function(data) {
        $("#" + data.result.stock).text(data.result.stockvalue);
        $("#roll-stock").text(data.result.stock);
        $("#roll-dir").text(data.result.direction);
        $("#roll-num").text(data.result.delta);
        $("#roll-history").empty();
        $.each(data.resultHist, function(i) {
            let stock = "<div>" + data.resultHist[i].stock + "</div>"
            let dir = "<div>" + data.resultHist[i].direction + "</div>"
            let delta = "<div>" + data.resultHist[i].delta + "</div>"
            $("#roll-history").append($('<li id="hist-'+i+'"></li>').append(stock,dir,delta));
        })
    });

    // Could use only one event for div/split/crash, but will keep seperate in case we need to pass specific data with them
    socket.on("dividends", function() {
        socket.emit("update player", userid);
    });

    socket.on("crash", function() {
        socket.emit("update player", userid);
    });

    socket.on("split", function() {
        socket.emit("update player", userid);
    });
});