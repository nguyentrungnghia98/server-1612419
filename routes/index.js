var express = require('express');
var router = express.Router();
var User = require("../models/User")

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('login', { layout: 'login.handlebars',script: "login", style: "login" });
});

router.get('/login', async function(req, res, next) {
  const users = await (3+2);
  res.render('login', { layout: 'login.handlebars', users, script: "login", style: "login" });
});

router.get('/register', function(req, res, next) {
  res.render('register', { layout: 'login.handlebars',script: "register", style: "login" });
});

// router.get('/me', function(req, res, next) {
//   res.render('profile', { layout: 'login.handlebars',script: "profile", style: "profile" });
// });
module.exports = router;
