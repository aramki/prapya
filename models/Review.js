/*
 * Copyright (c) 2018. Beaconstalk Technologies Pvt Ltd
 * Author: Ramakrishnan A
 */

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const reviewSchema = new mongoose.Schema({
    created : {
        type: Date,
        default: Date.now
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'You must be logged in to review'
    },
    store: {
        type: mongoose.Schema.ObjectId,
        ref: 'Store',
        required: 'You must provide a store'
    },
    reviewText: {
        type: String,
        required: 'The review cannot be blank!!'
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    }
    //TODO Implement like & dislike for ratings
});

function autopopulate(next) {
    this.populate('author');
    next();
}

reviewSchema.pre('find', autopopulate);
reviewSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Review', reviewSchema);
