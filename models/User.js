/*
 * Copyright (c) 2018. Beaconstalk Technologies Pvt Ltd
 * Author: Ramakrishnan A
 */

'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

//TODO Add 2 factor authentication for anyone who can add a store
const userSchema = new mongoose.Schema({
    email:{
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, 'Invalid EMail Address'],
        required: 'Please provide an EMail Address'
    },
    name: {
        type: String,
        required: 'Please provide a Name',
        trim: true
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    hearts: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Store'
        }
    ]
});

userSchema.virtual('gravatar').get(function() {
    const hash = md5(this.email);
    return `https://gravatar.com/avatar/${hash}?s=200`;
});

userSchema.plugin(passportLocalMongoose, {usernameField: 'email'});
userSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model('User', userSchema);
