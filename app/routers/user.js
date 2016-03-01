
var express = require('express'),
    User = require('../models/user'),
    bleach = require('bleach');

module.exports = function(passport){

    var router = express.Router(); 

    router.route('/')
        .get(function(req, res){

            User.find({}, "name email", function(err, users) {
                if (err) throw err;
                res.json(users);
            });

        })
        .post(passport.authenticate('local-signup', {session: false}),
        function(req, res){
            if (req.user) {
                var user = req.user.toJSON();
                user.token = req.user.generateToken();
                res.json(user);
            }else{
                res.json({ error: true, message: req.error});
            }
        });


    router.post('/login', passport.authenticate('local-login', {session: false}),
    function(req, res){
        if (req.user) {
            var user = req.user.toJSON();
            user.token = req.user.generateToken();
            res.json(user);
        }else{
            res.json({ error: true, message: req.error});
        }
    });

    router.use('/:user_id', function(req, res, next) {
      if (!req.headers["token"]) {
        res.status(403);
        res.json({ error: true, message: "Please, login"});
        return;
      }
      User.isValidToken(req.headers.token, req.params.user_id, function(err, status, user){
        if (err) {
            res.status(status);
            res.json({ error: true, message: user});
            return;   
        }
        req.user = user;
        next();
      });
    });


    router.route('/:user_id')
        .get(function(req, res){
            res.json(req.user);
        })
        .delete(function(req, res){
            req.user.remove(function(err){
                if (err) {
                    res.status(500);
                    res.json({ error: true, message: err});
                    return;
                }
                res.json({ error: null, message: 'user deleted'});
            });
        })
        .put(function(req, res){

            if (!req.body.hasOwnProperty('name')) {
                res.status(400);
                res.json({ error: true, message: 'Invalid Name'});
                return;
            }
            var name = bleach.sanitize(req.body['name']);

            User.findOneAndUpdate({_id: req.params.user_id}, { $set: { name: name }}, {new: true}, function(err, user){
                if (err){
                    res.status(500);
                    res.json({ error: true, message: err});
                    return;
                }
                res.json(user);
            });
        });


    return router;


}