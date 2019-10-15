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
          return res.status(400).json({
              message: info ? info.message : 'Register failed',
              user   : user
          });
      }

      req.login(user, {session: false}, (err) => {
          if (err) {
              res.send(err);
          }

          const token = jwt.sign({id: user._id}, secret);
          res.cookie('JWT', token, { maxAge: 900000, httpOnly: true });
          return res.json({name: user.name, email:user.email, token});
      });
  })
  (req, res);
});

/* Login new user */
router.post('/login', function (req, res, next) {
  passport.authenticate('local-login', {session: false}, (err, user, info) => {
    console.log(err,'user',user._id);
      if (err || !user) {
          return res.status(400).json({
              message: info ? info.message : 'Login failed',
              user   : user
          });
      }

      req.login(user, (err) => {
          if (err) {
            console.log('err',err)
             return res.status(403).send(err);
          }

          const token = jwt.sign({id: user._id}, secret);
          res.cookie('JWT', token, { maxAge: 900000, httpOnly: true });

          return res.json({name: user.name, email:user.email, token});
          //return res.redirect('/user/me');
      });
  })
  (req, res);
});

/* Get info user */
router.get('/me',  function (req, res, next) {
  passport.authenticate('jwt', {session: false}, (err, user, info) => {
      if(err){
        console.log(err);
        return res.status(403).send(err);
      }
      if(info){
        console.log('info',info.message)
        return res.status(400).send(info.message + '. Please login!');
      }else{
        console.log('User was found!',user);
        return res.json(user)
      }
  })
  (req, res);
});
module.exports = router;
