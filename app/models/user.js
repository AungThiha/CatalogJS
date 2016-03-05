var mongoose = require('mongoose'),
    bcrypt = require('bcrypt-nodejs'),
    randomToken = require('random-token'),
    hash = require('node_hash'),
    urlencode = require('urlencode');

var encryptKey = require("../../config/key").userEncrptor;
var encryptor = require('simple-encryptor')(encryptKey);
// create a schema
var userSchema = new mongoose.Schema({
  name: {type: String, required: true},
  email: { type: String, required: true, unique: true },
  password: {type: String, required: true}
});

// checking if password is valid
userSchema.methods.isValidPassword = function(password){
  console.log(password);
  console.log(this.password);
  return bcrypt.compareSync(password, this.password);
};

userSchema.methods.generateToken = function(){
  var salt = randomToken(16);
  return urlencode(encryptor.encrypt(this.email + "|" + salt + "|" + hash.sha1(this.password, salt)));
};

// the schema is useless so far
// we need to create a model using it
var User = mongoose.model('User', userSchema);

// methods =============
// generating a hash
User.generateHash = function(password){
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};


User.isValidToken = function(token, user_id, done){
  var splits = encryptor.decrypt(urlencode.decode(token)).split("|");
  if (splits.length !== 3) {
    return done(true, 403, "Invalid Token");
  }
  User.findOne({ email: splits[0]}, function(err, user){
    if (err) {
      return done(true, 500, "Internal Error");
    }
    if (!user) {
      return done(true, 403, 'No user found.');
    }
    if (user.id != user_id) {
      return done(true, 403, "You're not authorized");
    }
    var hashValue = hash.sha1(user.password, splits[1]);
    if (hashValue === splits[2]) {
      return done(false, 200, user);
    }else{
      return done(true, 403, "You're not authorized");
    }
  });
};


User.isValidEmail = function(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
};

// make this available to our users in our Node applications
module.exports = User;