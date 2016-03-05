
var express = require('express'),
    Admin = require('../../models/admin'),
    bleach = require('bleach');

module.exports = function(){

    var router = express.Router(); 

    /* / */
    router.route('/')
        .get(function(req, res){

            Admin.find({}, "name email", function(err, admins) {
                if (err) throw err;
                res.json(admins);
            });

        })
        .post(function(req, res){
            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            Admin.findOne({ 'email' : req.body['email']}, function(err, user){
                // if there are any errors, return the error
                if (err) {
                    res.status(401);
                    return res.json({error: true, message: err});
                }

                // check to see if there's already a user with that email

                if (user) {
                    res.status(401);
                    return res.json({error: true, message: 'That email is already taken.'});
                }else {

                    if (!req.body.hasOwnProperty('name') ) {
                        res.status(401);
                        return res.json({error: true, message: 'Please, enter name'});
                    }
                    if (!req.body.hasOwnProperty('email') || !Admin.isValidEmail(req.body.email)) {
                        res.status(401);
                        return res.json({error: true, message: 'Please, enter valid email'});
                    }

                    // if there is no user with that email
                    // create the user
                    var newAdmin = Admin({
                        name: bleach.sanitize(req.body['name']),
                        email: req.body['email'],
                        password: Admin.generateHash(req.body['password'])
                    });

                    // save the user
                    newAdmin.save(function(err, admin){
                        if (err) {
                            throw err;
                        }
                        adminj = admin.toJSON();
                        delete adminj['password'];
                        adminj.token = admin.generateToken();
                        res.json(adminj);
                    });
                }
            });
        });

    /* END / */

    /* /login */


    router.post('/login', function(req, res){
        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        Admin.findOne({ 'email' : req.body['email'] }, function(err, admin){
            if (err) {
                res.status(401);
                return res.json({error: true, message: err});
            }

            // if no user is found, return the message
            if (!admin) {
                res.status(401);
                return res.json({error: true, message: 'No admin found.'});
            }

            // if the user is found but the password is wrong
            if (!admin.isValidPassword(req.body['password'])) {
                res.status(401);
                return res.json({error: true, message: 'Oops! Wrong password.'});
            }

            adminj = admin.toJSON();
            delete adminj['password'];
            adminj.token = admin.generateToken();
            res.json(adminj);
        });
    });

    router.use('/:admin_id', function(req, res, next) {
      if (!req.headers["token"]) {
        res.status(403);
        res.json({ error: true, message: "Please, login"});
        return;
      }
      Admin.isValidToken(req.headers.token, function(err, status, admin){
        if (err) {
            res.status(status);
            res.json({ error: true, message: admin});
            return;   
        }
        req.admin = admin;
        next();
      });
    });

    /* END /login */

    /* /:admin_id */


    router.route('/:admin_id')
        .get(function(req, res){
            res.json(req.admin);
        })
        .delete(function(req, res){
            req.admin.remove(function(err){
                if (err) {
                    res.status(500);
                    res.json({ error: true, message: err});
                    return;
                }
                res.json({ error: null, message: 'admin deleted'});
            });
        })
        .put(function(req, res){
            var hasName = req.body.hasOwnProperty('name');
            var hasPassword = req.body.hasOwnProperty('password');
            if (!hasName && !hasPassword) {
                res.status(400);
                res.json({ error: true, message: 'No valid values'});
                return;
            }
            var updates = {};
            if (hasName) {
                updates.name = bleach.sanitize(req.body['name']);
            }
            if (hasPassword) {
                updates.password = Admin.generateHash(req.body['password']);
            }

            Admin.findOneAndUpdate({_id: req.params.admin_id}, { $set: updates}, {new: true}, function(err, admin){
                if (err){
                    res.status(500);
                    res.json({ error: true, message: err});
                    return;
                }
                res.json(admin);
            });
        });


    return router;


}