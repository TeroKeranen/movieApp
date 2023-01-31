// require express
const express = require('express');
const dotenv = require("dotenv").config();
const bcrypt = require('bcrypt')
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
// const {getMovies} = require("./movieFinder.js")
const { default: mongoose } = require('mongoose');
const session = require('express-session')
const app = express();
const Mongodb = process.env.MONGODB_URI;

// set up ejs
app.set('view engine', 'ejs');

//
app.use(express.urlencoded({extended:true})) // allow to parse data

app.use(express.static('public')) // setup css file


// require Users db
const User = require('./models/user');
const { eventNames, rawListeners } = require('./models/user');


mongoose.connect(Mongodb, {useNewUrlParser: true})
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
    const API_KEYs = process.env.API_KEY; // api key
    const BASE_URL = "https://api.themoviedb.org/3"; // Api url
    const API_URL = BASE_URL + "/discover/movie?sort_by=popularity.desc&" + API_KEYs; // this bring all the popular movies to page
    console.log(API_URL)


    // use these to display welcome text including user name
    let user = req.user.username
    let message = `Tervetuloa ${user}`
    
    if(!req.user) {
        res.render('login', {title: "Login", error: error, logged: false} )
    } else {

        function getMovies (url) {

            const popularMovies = url;

            // this function return class color on page
            function getColor(vote) {
                if(vote >= 8) {
                    return 'green'
                } else if (vote >= 5) {
                    return 'orange'
                } else {
                    return 'red'
                }
            }

            fetch(popularMovies)
                .then(res => res.json())

                .then ((data) => {

                     // showMovies(data.results)
                    const results = data.results;
                    // create arrays where to push movie datas
                    let titles = []
                    let posters = []
                    let overviews = []
                    let voteAvg = []

                    if (data) {

                            // iterate trought data results
                        data.results.forEach(movie => {
                            const {title, poster_path, vote_average, overview} = movie;

                            // push values to theyr arrays
                            titles.push(title);
                            posters.push(poster_path)
                            overviews.push(overview)
                            voteAvg.push(vote_average)
                            
                            
                        })
                        
                        res.render('home', {color: getColor,movieTitle: titles, poster: posters, overview : overviews, vote: voteAvg, title: "MoviaApp", logged: true, message: "msg"})
                    }
                    

                })
                .catch((error) => {
                     res.render('home', {color: getColor,movieTitle:" titles", poster:" posters", overview : "overviews", vote: "voteAvg", title: "MoviaApp", logged: true, message: process.env.API_KEYs})
                })
                 
        }




        
        getMovies(API_URL)
    }
    
   
    
})

app.post("/home", (req,res) => {


    const API_KEYs = process.env.API_KEY; // api key
    const BASE_URL = "https://api.themoviedb.org/3"; // Api url
    const API_URL = BASE_URL + "/discover/movie?sort_by=popularity.desc&" + API_KEYs;
    const searchURL = BASE_URL + "/search/movie?" + API_KEYs;
    const IMG_URL = "https://image.tmdb.org/t/p/w500/"; // use this on home page when searching images
    
    let search = req.body.search
    let message = `etsit hakusanalla ${search}`;
    
    
    
    
    getMovies(searchURL + '&query=' + search, res, message)
    
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



const port = process.env.PORT || 5000

app.listen(port, function () {
    console.log(`server started on port ${port}`);
})