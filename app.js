// require express
const express = require('express');

const app = express();
const bcrypt = require('bcrypt')

const users = [];
// set up ejs
app.set('view engine', 'ejs');

//
app.use(express.urlencoded({extended:true}))



app.get("/", (req,res) => {

    res.render('index');

});


app.get('/login', (req,res) => {
    res.render('login')
})

app.post('/login', (req,res) => {
    
})

app.get('/register', (req,res) => {
    res.render('register')
})

app.post('/register', async (req,res) => {
    
    
})





app.listen(3000, function () {
    console.log("Server started on port 3000");
})