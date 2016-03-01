var mongoose = require('mongoose'),
    bcrypt = require('bcrypt-nodejs'),
    randomToken = require('random-token'),
    hash = require('node_hash'),
    urlencode = require('urlencode'),
    base64 = require('base64-url'),
    encryptor = require('simple-encryptor');

var keys = require("../../config/key");
var tokenEncryptor = encryptor(keys.adminEncrptor);
var passwordEncryptor = encryptor(keys.passwordEncryptor);

// create a schema
var adminSchema = new mongoose.Schema({
  name: {type: String, required: true},
  email: { type: String, required: true, unique: true },
  password: {type: String, required: true}
});

// checking if password is valid
adminSchema.methods.isValidPassword = function(password){
  return bcrypt.compareSync(base64.encode(passwordEncryptor.encrypt(password)), this.password);
};

adminSchema.methods.generateToken = function(){
  var salt = randomToken(32);
  return urlencode(tokenEncryptor.encrypt(base64.encode(this.email + "$" + salt + "$" + hash.sha256(this.password, salt))));
};

// the schema is useless so far
// we need to create a model using it
var Admin = mongoose.model('Admin', adminSchema);

// methods =============
// generating a hash
Admin.generateHash = function(password){
  return bcrypt.hashSync(base64.encode(passwordEncryptor.encrypt(password)), bcrypt.genSaltSync(8), null);
};


Admin.isValidToken = function(token, admin_id, done){
  var splits = base64.decode(tokenEncryptor.decrypt(urlencode.decode(token))).split("$");
  if (splits.length !== 3) {
    return done(true, 403, "Invalid Token");
  }
  Admin.findOne({ email: splits[0]}, function(err, admin){
    if (err) {
      return done(true, 500, "Internal Error");
    }
    if (!admin) {
      return done(true, 403, 'No Admin found.');
    }
    if (admin.id != admin_id) {
      return done(true, 403, "You're not authorized");
    }
    var hashValue = hash.sha256(admin.password, splits[1]);
    if (hashValue === splits[2]) {
      return done(false, 200, admin);
    }else{
      return done(true, 403, "You're not authorized");
    }
  });
};


Admin.isValidEmail = function(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
};

// make this available to our admins in our Node applications
module.exports = Admin;