const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt')

const UserSchema = new Schema({ 
    email: {type: String, lowercase: true},
    avatar: String,
    name: String, 
    password: String, 
    phone:String,
    address: String,
    provider: String,
    facebookId: String,
    googleId:String, 
    created_at: { type: Date, default: Date.now },
});

//hash password before save user if the password is changed

UserSchema.pre('save', async function (next) {
    const user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
        console.log('da hash')
    }

    next()
})

module.exports = mongoose.model('User', UserSchema);

