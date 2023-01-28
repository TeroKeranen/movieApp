// require express
const express = require('express');

const bcrypt = require('bcrypt')
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
// const {getMovies} = require("./movieFinder.js")
const { default: mongoose } = require('mongoose');
const session = require('express-session')
const app = express();
const MONGODB_URI = "mongodb+srv://netninja:tero123@cluster0.xecqchu.mongodb.net/MovieApp?retryWrites=true&w=majority"

// set up ejs
app.set('view engine', 'ejs');

//
app.use(express.urlencoded({extended:true})) // allow to parse data

app.use(express.static('public')) // setup css file


// require Users db
const User = require('./models/user');
const { eventNames, rawListeners } = require('./models/user');


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

// Function that check if user is logged in
function isLoggedIn(req,res,next) {
    if (req.isAuthenticated()) {
        
        return next();
    }
   
    res.redirect('/home');
}

// Function that check if user is loggedOut in
function isLoggedOut(req,res,next) {
    if (!req.isAuthenticated()) return next();
    res.redirect('/login');
}
// go to index page
app.get("/", (req,res) => {
    

    // If user is not logged in we send data boolean inside logged so when can change our navbar
    if(!req.user) {
        res.render('index', {title: "Home2", logged : false})
    } else {
        res.render('index', {title: "Home", logged: true})
    }
    

});

// Home is for logged in users
app.get('/home', isLoggedIn, (req,res) => {

    

    // use these to display welcome text including user name
    let user = req.user.username
    let message = `Tervetuloa ${user}`
    
    if(!req.user) {
        res.render('home', {title: "MovieApp", logged : false})
    } else {
        
        res.render('home', {title: "MoviaApp", logged: true, message: message})
    }
    
    
})

app.post("/home", (req,res) => {
    const API_KEY = "api_key=a710a7022b9279d7b829c1371ed47e06"; // api key
    const BASE_URL = "https://api.themoviedb.org/3"; // Api url
    const API_URL = BASE_URL + "/discover/movie?sort_by=popularity.desc&" + API_KEY;

    function getMovies (url) {
        fetch(url)
            .then(res => res.json())
            .then(data => {
                console.log(data);
                
            })
    }

    let search = req.body.search
    console.log(search);
})



app.get('/login', isLoggedOut, (req,res) => {

    // check if error is true or false
    let error = req.query.error;
    
    
    res.render('login', {title: "Login", error: error, logged: false} )
})

app.get('/setup', async (req,res) => {
    const exists = await User.exists({username: "admin"});

    if (exists) {
        res.redirect('/login');
        return;
    }
    
    bcrypt.genSalt(10, function(err,salt) {
        if (err) return next(err);
        
        bcrypt.hash("pass", salt, function(err, hash) {
            if (err) return next(err);
            
            const newAdmin = new User ( {
                username: "admin",
                password: hash
            })

            newAdmin.save();

            res.redirect('/login');
        })
    })
})

// Login post. when logging in this will redirect you home page
app.post('/login', passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect : '/login?error=true'


}))

app.get('/logout', function(req,res) {
    req.logout((err) => {
        if (err ) {
            return next(err)
        }

    })
    res.redirect('/');
})

app.get('/register', (req,res) => {
    res.render('register', {title: "Register", logged: false})
})





app.listen(3000, function () {
    console.log("Server started on port 3000");
})