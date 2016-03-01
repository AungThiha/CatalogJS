
var express = require('express'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    flash = require('connect-flash'),
    morgan = require('morgan'),
    User = require('./app/models/user');

var port = process.env.PORT || 8080;
var app = express();

mongoose.connect(require('./config/database').url);

require('./config/passport')(passport); // pass passport for configuration

app.use(morgan('dev')); // log every request to the console
app.use(cookieParser("3dafjoei32j30dvnqxmziea33"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// set the view engine to ejs
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');


app.use(passport.initialize());
// app.use(passport.session()); 
app.use(flash());

var user_router = require('./app/routers/user')(passport);
app.use('/users', user_router);

app.listen(port);
console.log('App started! Look at ' + port);
