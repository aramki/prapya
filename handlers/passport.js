/*
 * Copyright (c) 2018. Beaconstalk Technologies Pvt Ltd
 * Author: Ramakrishnan A
 */
const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
