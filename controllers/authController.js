/*
 * Copyright (c) 2018. Beaconstalk Technologies Pvt Ltd
 * Author: Ramakrishnan A
 */

const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

const oneHour = 3600000;
const halfHour = oneHour/2;

exports.login = passport.authenticate('local', {
   failureRedirect: '/login',
   failureFlash: 'Login Failed. Please try again.',
   successRedirect: '/',
   successFlash: 'You are now logged in'
});

exports.logout = (req, res) => {
    req.logout();
    req.flash('success', 'You are now logged out');
    res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        next(); //User is logged in
        return;
    }
    req.flash('error', 'You must be logged in to perform this action');
    res.redirect('/login');
};

exports.forgotPassword = async (req, res) => {

    //Check if the user exists
    const user = await User.findOne({email: req.body.email});
    if (!user) {
        req.flash('error', 'A password reset has been sent to the mail id if it exists in our database');
        return res.redirect('/login');
    }

    //Generate the reset token
    user.resetPasswordToken = crypto.randomBytes(24).toString('hex');
    user.resetPasswordExpires = Date.now() + halfHour; //(30 mins)
    await user.save();

    //Send the mail with the token
    const resetURL= `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;

    await mail.send({
       user: user,
       subject: 'Password Reset',
       resetURL: resetURL,
       filename: 'password-reset'
    });

    req.flash('success', `You have been emailed a password reset link.`);
    res.redirect('/login');
};

exports.reset = async (req, res) => {
    const user = await User.findOne({
       resetPasswordToken: req.params.token,
       resetPasswordExpires: {$gt: Date.now()}
    });

    if (!user) {
        req.flash('error', 'Password reset is Invalid');
        return res.redirect('/login');
    }

    res.render('reset', {title: "Reset the Password"});

};

exports.confirmPassword = (req, res, next) => {
    if (req.body.password === req.body['password-confirm']) {
        next();
        return;
    }
    req.flash('error', 'Passwords do not match');
    res.redirect('back');
};

//This function updates the password
exports.update = async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {$gt: Date.now()}
    });

    if (!user) {
        req.flash('error', 'Password reset is Invalid');
        return res.redirect('/login');
    }

    const setPassword = promisify(user.setPassword, user);
    await setPassword(req.body.password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    const updatedUser = await user.save();
    await req.login(updatedUser);
    req.flash('success', 'Password has been updated');
    res.redirect('/');

    // TODO Debug why this piece of code isn't working. Cannot depend on promisify
    // user.setPassword(req.body.password, function(err, user) {
    //    if (err) {
    //        console.log(err);
    //        req.flash('error', 'Password update failed');
    //        res.redirect('back');
    //    } else {
    //        user.resetPasswordToken = undefined;
    //        user.resetPasswordExpires = undefined;
    //
    //        user.save(function(err){
    //           req.login(user, function(err) {
    //               done(err, user);
    //           });
    //        });
    //    }
    // });
};
