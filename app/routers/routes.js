var subdomain = require('express-subdomain');

var userapi_users = require('./userapi/user');

var adminapi_admins = require('./adminapi/admin');

module.exports = function(app, express) {
    
    
    /* userapi */
    var userapi = express.Router();

    var user_passport = require('passport');
    require('../../config/user/passport')(user_passport);
    userapi.use(user_passport.initialize());

    userapi.use('/users', userapi_users(user_passport));
    

    app.use(subdomain('userapi', userapi));


    
	/* adminapi */    
    var adminapi = express.Router();

    adminapi.use('/admins', adminapi_admins());

    app.use(subdomain('adminapi', adminapi));

};