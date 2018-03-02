/*
 * Copyright (c) 2018. Beaconstalk Technologies Pvt Ltd
 * Author: Ramakrishnan A
 */

const mongoose = require('mongoose');
const Review = mongoose.model('Review');

exports.addReview = async (req, res) => {
    //console.log("Entered addReview");
    req.body.author = req.user._id;
    req.body.store = req.params.id;

    const newReview = new Review(req.body);
    await newReview.save();
    req.flash('success', 'Thanks for the review');
    res.redirect('back');
};
