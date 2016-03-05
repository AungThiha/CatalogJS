
var express = require('express'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    mongoose = require('mongoose'),
    // flash = require('connect-flash'),
    morgan = require('morgan');

var port = process.env.PORT || 8080;
var app = express();

mongoose.connect(require('./config/database').url);

app.use(morgan('dev')); // log every request to the console
app.use(cookieParser(require("./config/key").cookieEncrptor));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// set the view engine to ejs
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

// app.use(passport.session()); 
// app.use(flash());

// var user_router = require('./app/routers/user')(passport);

require('./app/routers/routes')(app, express);

var multer = require('multer'),
    path = require('path');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
  	var extension = path.extname(file.originalname);
  	var filename;
  	if (extension) {
  		filename = file.originalname.substring(0, file.originalname.length - extension.length) +
  			Date.now() + extension;
  	}else{
  		filename = file.originalname + Date.now();
  	}
    cb(null, filename);
  }
});
var upload = multer({ storage: storage });

app.post('/test/upload', upload.array('torrents'), function (req, res, next) {
  res.json({ error: null, message: req.files.map(function(f){
      return req.protocol + '://' + req.get('host') + "/" + f.path;
    })
  });
})

app.listen(port);
console.log('App started! Look at ' + port);
