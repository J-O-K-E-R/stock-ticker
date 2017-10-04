const express     = require("express"),
    router      = express.Router(),
    passport    = require("passport"),
    User        = require("../models/user"),
    Stocks      = require("../models/stock");

router.get("/", function(req, res) {
    res.render("home");
});

router.get("/login", function(req, res) {
    res.render("login");
});

router.post("/login", passport.authenticate("local",
    {
    successRedirect: "/play",
    failureRedirect: "/login"
    }), function(req, res) {

    });

router.get("/register", function(req, res) {
    res.render("register");
});

router.post("/register", function(req, res) {
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user) {
        if(err) {
            console.log(err);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function() {
            res.redirect("/");
        });
    });
});

router.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});

router.get("/admin", isLoggedIn, isAdmin, function(req, res) {
    let userList = [];
    User.find(function(err, users) {
        users.forEach(function(err, user) {
            userList.push(user);
        });
    });
    console.log(userList);
    res.render("admin", {users: userList});
});

router.get("/admin/users", isLoggedIn, isAdmin, function(req, res) {
    User.find(function(err, users) {
        res.send(users);
    });
});

// router.post("/admin/reset", isLoggedIn, isAdmin, function(req, res) {
//     User.find(function(err, users) {
//         users.forEach(function(user) {
//             user.money = 5000;
//             user.stocks = [0, 0, 0, 0, 0, 0]
//             user.save();
//         });
//     });
//     Stocks.findOne({name: "main"}, function(err, foundStocks) {
//         foundStocks.values = [100, 100, 100, 100, 100, 100];
//         // stockValues = [100, 100, 100, 100, 100, 100];
//         foundStocks.save();
//         console.log(foundStocks);
//     });
// });

function isAdmin(req, res, next) {
    if (req.user.isAdmin === true) {
        return next();
    }
    res.redirect("login");
}

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("login");
}

module.exports = router;