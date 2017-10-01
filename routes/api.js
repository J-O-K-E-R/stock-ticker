var express     = require("express"),
router      = express.Router(),
passport    = require("passport"),
User        = require("../models/user");

router.get("/:id", function(req, res) {
    User.findById( req.params.id, function(err, user) {
        if(err) {
            console.log(err);
        } else {
            // console.log(user);
            res.send(user);
        }
    });
});

module.exports = router;