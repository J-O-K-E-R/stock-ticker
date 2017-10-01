var mongoose = require("mongoose")

var StocksSchema = new mongoose.Schema({
    name: String,
    values: [Number]
});

module.exports = mongoose.model("Stocks", StocksSchema)