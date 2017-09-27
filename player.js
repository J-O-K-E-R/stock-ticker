exports.Player = class Player {
    constructor(id, name, money, stocks) {
        this.id = id;
        this.name = name;
        this.money = money;
        this.stocks = stocks;
    }

    buyStock(index, value) {
        var cost = value * 5;
        if (this.money >= cost) {
            this.money -= cost;
            this.stocks[index] += 500;    
        }
    }

    sellStock(index, value) {
        var refund = value * 5;
        if (this.stocks[index] >= 500) {
            this.money += refund;
            this.stocks[index] -= 500;
        }
    }
}