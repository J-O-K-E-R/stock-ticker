var mongoose = require("mongoose");

var TrendsSchema = new mongoose.Schema({
    index: Number,
    name: String,
    history: []
});

module.exports = mongoose.model("Trends", TrendsSchema);