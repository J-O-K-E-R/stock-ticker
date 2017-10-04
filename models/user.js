var mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    isAdmin: {type: Boolean, required: true, default: false},
    money: { type: Number, required: true, default: 5000},
    stocks: { type: [Number], required: true, default: [0,0,0,0,0,0] }
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema)