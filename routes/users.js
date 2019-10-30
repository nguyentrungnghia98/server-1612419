var express = require("express");
var router = express.Router();
var passport = require("passport");
var jwt = require("jsonwebtoken");
var { secret } = require("../config/config");
var auth_api = require("../middlewares/auth_api");
var User = require("../models/User");
const bcrypt = require("bcrypt");

function infoUser(user) {
  return {
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    phone: user.phone,
    address: user.address
  };
}

function handleLogin(res, err, user, info) {
  if (err || !user) {
    return res.status(403).json({
      message: info ? info.message : "Login failed",
      err
    });
  }

  const token = jwt.sign({ id: user._id }, secret);

  res.json({ ...infoUser(user), token });
}
/* Register new user */
router.post("/register", function(req, res, next) {
  passport.authenticate(
    "local-signup",
    { session: false },
    (err, user, info) => {
      console.log(err, "user", user._id);
      handleLogin(res, err, user, info);
    }
  )(req, res, next);
});

/* Login new user */
router.post("/login", function(req, res, next) {
  passport.authenticate(
    "local-login",
    { session: false },
    (err, user, info) => {
      console.log(err, "user", user._id);
      handleLogin(res, err, user, info);
    }
  )(req, res, next);
});

/* Login with social */
router.post("/login-social", async function(req, res, next) {
  try {
    const data = req.body;
    let user = await User.findOne({
      email: data.email
    });
    if (!user) {
      user = new User({
        name: data.name,
        email: data.email,
        provider: data.provider,
        facebookId: data.facebookId,
        googleId: data.googleId
      });
      await user.save();
    } else {
      if (!user.provider || data.provider !== user.provider) {
        return res
          .status(403)
          .json({ message: "You already signed up with another platform!" });
      }
    }
    const token = jwt.sign({ id: user._id }, secret);

    res.json({ ...infoUser(user), token });
  } catch (err) {
    console.log(err);
    return res.status(403).json({ message: "Fetch data failed!" });
  }
});

/* Get info user */
router
  .route("/me")
  .get(auth_api, function(req, res, next) {
    res.json(infoUser(req.user));
  })
  .put(auth_api, async (req, res, next) => {
    const updates = Object.keys(req.body);
    console.log("Fields update ", updates);
    const allowedUpdates = [
      "avatar",
      "name",
      "phone",
      "address",
      "password",
      "newPassword"
    ];
    const isValidOperation = updates.every(element =>
      allowedUpdates.includes(element)
    );

    if (!isValidOperation) {
      return res
        .status(403)
        .send({ error: "Some updates fields are invalid!" });
    }

    try {
      let user = await User.findById(req.user._id);
      if (req.body.password || req.body.newPassword) {
        //update password
        const isCorrectPassword = await bcrypt.compare(req.body.password, user.password);
        if (!isCorrectPassword) {
          return res.status(403).json({ message: "Wrong password!", current: user.password, new: await bcrypt.hash(req.body.password, 8)  });
        } else {
          user.password = req.body.newPassword;
          await user.save();
          res.json(infoUser(user));
        }
      } else {
        //update info
        updates.forEach(element => (user[element] = req.body[element]));
        console.log(user);
        await user.save();
        res.json(infoUser(user));
      }
    } catch (err) {
      console.log(err);
      res.status(500).json({ err });
    }
  });
module.exports = router;
