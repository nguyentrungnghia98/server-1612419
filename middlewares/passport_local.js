const localStrategy = require('passport-local').Strategy;
var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcrypt');
const User = require('../models/User');
const {secret} = require("../config/config");

module.exports = function (app, passport) {
    const local_login = new localStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback : true,
        session:false
    }, async (req,email, password, done) => {
        const user = await User.findOne({ email: email }) 
        try {
            console.log(req.body);
            if (!user) {
                return done(null, false,  {message: 'Email was not exist!'});
            }
            const ret = await bcrypt.compare(password, user.password);
            if (ret) { 
                return done(null, user);
            } 
            console.log('Invalid password!');
            return done(null, false, {message: 'Invalid password!'});  
        } catch (err) {
            return done(err, false);
        };
    });


  const local_signup =  new localStrategy({
      usernameField : 'email',
      passwordField : 'password',
      passReqToCallback : true,
      session:false
  },
  async (req, email, password, done) => {
      console.log('rester req',req.body)
      try{
        const user = await User.findOne({ email :  email });
        if (user) { 
          console.log('That email is already taken.');
            return done(null, false, {message:  'That email is already taken.'});
        } else {
          var newUser = new User({
            email,
            password,
            name: req.body.name,
          });
          await newUser.save();
          return done(null, newUser);
        }
      } catch(err){
        done(err);
      }   
  });  

  var cookieExtractor = function(req) {
    var token = null;
    if (req && req.cookies)
    {
        token = req.cookies['JWT'];
    }
    return token;
  };

  const local_jwt = new JwtStrategy({
    //jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('JWT'),
    //jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    jwtFromRequest: cookieExtractor,
    secretOrKey: secret
  }, 
    function(jwt_payload, done) {
    console.log('jwt',jwt_payload)
    User.findOne({_id: jwt_payload.id}, function(err, user) {
        if (err) {
            return done(err, false);
        }
        if (user) {
            return done(null, user);
        } else {
          console.log('User not exit');
            return done(null, false);
            // or you could create a new account
        }
    });
})

  passport.use('local-login', local_login);
  passport.use('local-signup', local_signup);
  passport.use('jwt', local_jwt);

  passport.serializeUser((user, done) => {
    console.log('serializeUser',user.email)
    return done(null, user._id);
  });
  
  // passport.deserializeUser(async (_id, done) => {
  //   console.log('deserializeUser',_id)
  //   const user = await User.findOne({ _id })
  //   return done(null, user)
  // });
} 