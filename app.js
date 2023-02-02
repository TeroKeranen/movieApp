// require express
const express = require('express');
const dotenv = require("dotenv").config();
const bcrypt = require('bcrypt')
const passport = require('passport');

const localStrategy = require('passport-local').Strategy;
const {getMovies} = require("./movieFinder.js")
const {getDate} = require('./getdate')
const {getColor} = require('./getColor')
const mongoose = require('mongoose');
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
    


    // use these to display welcome text including user name
    let user = req.user.username
    let message = `Tervetuloa ${user}`
    
    
    if(!req.user) {
        res.render('login', {title: "Login", error: error, logged: false} )
    } else {
        
        getMovies(API_URL,res,message)
    }
    
   
    
})

app.post("/home", (req,res) => {


    const API_KEYs = process.env.API_KEY; // api key
    const BASE_URL = "https://api.themoviedb.org/3"; // Api url
    const searchURL = BASE_URL + "/search/movie?" + API_KEYs;
    const IMG_URL = "https://image.tmdb.org/t/p/w500/"; // use this on home page when searching images
    
    let search = req.body.search
    let message = `etsit hakusanalla ${search}`;
    
    
    getMovies(searchURL + '&query=' + search, res, message)
    
})

app.get('/about', (req,res) => {
    const isLogged = req.isAuthenticated();

    if (!isLogged) {
      res.render('about', {title: "About", logged: false})  
    } else {

        res.render('about', {title: "About", logged: true})
    }
})



app.get('/login', isLoggedOut, (req,res) => {

    // check if error is true or false
    let error = req.query.error;
    
    
    res.render('login', {title: "Login", error: error, logged: false} )
})

app.get('/omatTiedot', (req,res) => {
    let user = req.user.username;
    let email = req.user.email;
    let registered = req.user.registeredDate;
    
    res.render('omatTiedot', {title: "Omat tiedot", logged: true, userName: user, userEmail: email, userRegisterDate: registered })
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

app.get('/favorites', (req,res) => {

    let id = req.user.id;
    
    let movies = req.user.favoriteMovies;
    let titles = []
    let posters = []
    let votes = []
    let overviews = []
    movies.forEach((movie) => {
        const {title, poster,vote,overview} = movie;
        titles.push(title);
        posters.push(poster);
        votes.push(vote);
        overviews.push(overview);
        
    })
    
    res.render('favorites', {title:"My movies", logged: true, favMovies: movies, movieTitle:titles,vote:votes, overview:overviews, poster:posters, color:getColor  })

})
app.post('/fav', (req,res) => {

    // get movie infos
    let favTitle = req.body.movieTitle;
    let favPoster = req.body.moviePoster;
    let favVote = req.body.movieVote;
    let favOverview = req.body.movieOverview;
    let message = `Lisäsit elokuvan ${favTitle} suosikkeihin`
    
    const API_KEYs = process.env.API_KEY; // api key
    const BASE_URL = "https://api.themoviedb.org/3"; // Api url
    const API_URL = BASE_URL + "/discover/movie?sort_by=popularity.desc&" + API_KEYs; // this bring all the popular movies to page
    
    

    
    // If try add movie in favorites page and that movie is there already it wont add it. Otherwise it will add movie in there
    User.findOne({username: req.user.username}, (error, foundUser)=>{
        if (error) {
            console.log(error);
            
        } else {
            const isInfavoriteMovies = foundUser.favoriteMovies.some(movie => movie.title === favTitle)

            if (isInfavoriteMovies) {
                console.log(`${favTitle} is already in favorite movies`)
                message = "Elokuva on jo suosikeissa"
            } else {
                foundUser.favoriteMovies.push({
                    title: favTitle,
                    poster: favPoster,
                    vote: favVote,
                    overview: favOverview,
                })

                foundUser.save((error) => {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log("added to favmovies")
                        
                    }
                })
            }
        }
        getMovies(API_URL,res,message)
    })
  
    
})

app.post('/delFav', (req,res) => {
    // take MovieTitle what user wants to delete
    let title = req.body.movieTitle;

    // get users database  and delete using $pull method
    User.updateOne({username: req.user.username}, {$pull: {favoriteMovies: {title: title}}}, (err) => {
        if (err) return res.status(400).send(err);
        res.redirect('/favorites')
  });
    
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
    res.render('register', {title: "Register", logged: false, error: ""})
})

app.post('/register', async (req,res) => {

    const userName = req.body.name;
    const userEmail = req.body.email;
    const userPass = req.body.password;
    let errorMessage = ""
    const nameExists = await User.exists({username: userName});
    const emailExists = await User.exists({email: userEmail})
    if(nameExists && emailExists) {
        errorMessage = "Käyttäjänimi ja sähköpostiosoite on jo käytössä"
        res.render('register', {title:"Register",error: errorMessage, logged: false })
        return;
    } else if (emailExists) {
        errorMessage = "Sähköpostiosoite on jo käytössä";
        res.render('register', {title:"Register",error: errorMessage, logged: false })
        return;

    } else if (nameExists) {
        errorMessage = "Käyttäjänimi on jo käytössä"
        res.render('register', {title:"Register",error: errorMessage, logged: false })
        return;

    } else {
        bcrypt.genSalt(10, function(err,salt) {
        if (err) return next(err);
        
        bcrypt.hash(userPass, salt, function(err, hash) {
            if (err) return next(err);
            
            const newUser = new User ( {
                username: userName,
                password: hash,
                email: userEmail,
                registeredDate: getDate(),

            })

            newUser.save();

            res.redirect('/login');
        })
    })
    }

    

})
app.get('/deleteAccount', (req,res) => {
    res.render('deleteAccount', {title: "Delete account", error: "", logged:true})
})

// DeleteAccount option
app.post('/deleteAccount', async (req,res) => {

    const user = req.user; // get username
    const id = req.user._id;    // user id
    // take password inputs  
    const password = req.body.password; 
    const passwordRepeat = req.body.passwordRepeat;
    
    // compare user password inputs
    if (password === passwordRepeat) {

        // compare user password input to current password
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            res.render('changepassword', {title: "Delete account", error: "Jotai meni väärin", logged:true})
        } else {

            User.findByIdAndDelete(id)
                .then(result => {
                    res.redirect('/register');
                })
                .catch(err => console.log(err))

        }

       
        
        
    } else {
        res.render('changepassword', {title: "Delete account", error: "Jotai meni väärin", logged:true})
    }

})

app.get('/changepassword', (req,res) => {

    res.render('changepassword', {title: "Vaihda salasana", error: "", logged:true})
})

app.post('/changepassword', async (req,res) => {
    

    const user = req.user;

    const oldPassword = req.body.oldpass;
    const newPassword = req.body.newpass;

    // Verify old password
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
        res.render('changepassword', {title: "Vaihda salasana", error: "Vanha salasana oli väärä", logged:true})
    } else {
         // Hash the new password
            const hash = await bcrypt.hash(newPassword, 10);

            // Update user password in the database
            user.password = hash;
            await user.save();

            // Log the user out
            req.logout(function (err) {
            if (err) {
            return res.status(500).json({ error: 'Failed to log out' });
            }

            // Redirect to login page
            res.redirect('/login');


        
        })
    }

   
})

const port = process.env.PORT || 5000

app.listen(port, function () {
    console.log(`server started on port ${port}`);
})