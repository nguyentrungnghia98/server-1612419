var express = require('express');
var router = express.Router();
var passport = require("passport");
var jwt = require("jsonwebtoken");
var User = require("../models/User");
var {secret} = require("../config/config");

/* Register new user */
router.post('/register',  function (req, res, next) {
  passport.authenticate('local-signup', {session: false}, (err, user, info) => {
      console.log(err,'user',user._id);
      if (err || !user) {
          return res.status(401).json({
              message: info ? info.message : 'Register failed',
              err
          });
      }

      req.login(user, {session: false}, (err) => {
          if (err) {
            return res.status(401).json({
              message: "Register failed",
              info,
              err
            });
          }

          const token = jwt.sign({id: user._id}, secret);
          res.cookie('JWT', token, { maxAge: 900000, httpOnly: true });
          res.json({name: user.name, email:user.email, token});
      });
  })
  (req, res, next);
});

/* Login new user */
router.post('/login', function (req, res, next) {
  passport.authenticate('local-login', {session: false}, (err, user, info) => {
    console.log(err,'user',user);
      if (err || !user) {
          return res.status(401).json({
              message: info ? info.message : 'Login failed',
              err
          });
      }

      req.login(user, (err) => {
          if (err) {
             return res.status(401).json({
              message: "Login failed",
              info,
              err
             });
          }

          const token = jwt.sign({id: user._id}, secret);
          res.cookie('JWT', token, { maxAge: 900000, httpOnly: true });

          res.json({name: user.name, email:user.email, token});
          //return res.redirect('/user/me');
      });
  })
  (req, res, next);
});

/* Get info user */
router.get('/me',  function (req, res, next) {
  passport.authenticate('jwt', {session: false}, (err, user, info) => {
      if(err){
        console.log(err);
        return next(err);
      }
      if(info){
        console.log('info',info.message)
        res.status(400).send(info.message + '. Please login!');
      }else{
        console.log('User was found!',user);
        res.json(user)
      }
  })
  (req, res, next);
});
module.exports = router;
