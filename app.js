// require express
const express = require('express');

const bcrypt = require('bcrypt')
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const { default: mongoose } = require('mongoose');
const session = require('express-session')
const app = express();
const MONGODB_URI = "mongodb+srv://netninja:tero123@cluster0.xecqchu.mongodb.net/MovieApp?retryWrites=true&w=majority"

// set up ejs
app.set('view engine', 'ejs');

//
app.use(express.urlencoded({extended:true})) // allow to parse data


// require Users db
const User = require('./models/user');
const { eventNames } = require('./models/user');


mongoose.connect(MONGODB_URI, {useNewUrlParser: true})
    .then((result) => console.log("Connected to db"))
    .catch((err) => console.log(err))


app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));
app.use(express.json());

//passport.js
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user,done) {
    done(null, user.id);
})

passport.deserializeUser(function(id, done) {
    
    User.findById(id, function(err,user) {
        done(err, user);
    })
})

passport.use(new localStrategy(function(username, password, done) {
    User.findOne({username: username}, function(err,user) {
        if(err) {
            return done(err);
        }
        if(!user) {
            return done(null,false,{message: "incorrect username"}); 
        }

        bcrypt.compare(password, user.password, function(err,res) {
            if (err) return done(err);

            if (res === false) {
                return done(null,false, {message: "incorrect password."})
            }

            return done(null, user);
        })
    })
})) 


app.get("/", (req,res) => {

    res.render('index', {title: "Home"});

});


app.get('/login', (req,res) => {
    res.render('login')
})

app.post('/login', (req,res) => {
    
})

app.get('/register', (req,res) => {
    res.render('register')
})





app.listen(3000, function () {
    console.log("Server started on port 3000");
})