var passport = require("passport");

const auth_api = async (req, res, next) => {
  passport.authenticate('jwt', {session: false}, (err, user, info) => {
    if(err){
      console.log(err);
      return res.status(500).json({ error: 'Something wrong!' })
    }
    if(info){
      console.log('info',info.message)
      return res.status(403).json({ error: 'Permisstion require!' })
    }else{
      req.user = user;
      //console.log('User was found!',user);
      next();
    }
  })
  (req, res, next);
}


module.exports = auth_api;