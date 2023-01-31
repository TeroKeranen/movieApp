const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose')


const UserSchema = new Schema({
    username: String,
    password : String,
    email : String,
    registeredDate: String,

    favoriteMovies : [
        {
            title: String,
            poster : String,
            vote: Number,
            overview: String
        }
    ]
})
UserSchema.plugin(passportLocalMongoose);
const User = mongoose.model('User', UserSchema);
module.exports = User;