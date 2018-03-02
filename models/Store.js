/*
 * Copyright (c) 2018. Beaconstalk Technologies Pvt Ltd
 * Author: Ramakrishnan A
 */

'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
    name:{
        type: String,
        trim: true,
        required: 'Please enter a Store Name'
    },
    slug: String,
    description: {
        type: String,
        trim: true,
        required: 'Please provide a brief description for the store'
    },
    tags: [String],
    created: {
        type: Date,
        default: Date.now()
    },
    location: {
        // TODO Add a google maps visualizer which shows the actual location and asks the users to confirm.
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: [{
            type: Number,
            required: 'You must provide the coordinates'
        }],
        address: {
            type: String,
            required: 'Please provide the address of the store'
        }
    },
    photo: {
        type: String
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'Please provide an author'
    },
    storeTimings: {
        type: String,
        trim: true,
        required: 'Please enter the store timings'
    },
    storeLink: {
        type: String,
        trim: true,
        required: "Please enter the Store's Website"
    },
    storeOwnerName: {
        type: String,
        trim: true,
        required: 'Please provide the name of the Owner'
    },
    storeOwnerContactNumber: {
        type: Number,
        trim: true,
        required: 'Please provide the contact number of the Owner'
    },
    storeBoxId: {
        type: String,
        trim: true,
        required: 'Please provide the Box ID'
    }
}, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

storeSchema.index({
    name: 'text',
    description: 'text'
});

storeSchema.index({
    location: '2dsphere'
});

storeSchema.pre('save', async function(next) {
    if (!this.isModified('name')) {
        return next(); //Do nothing if the store name hasn't been changed
    }
    this.slug = slug(this.name);
    //find other stores that have a slug of a, a-1, a-2
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');

    const storesWithSlug = await this.constructor.find({slug: slugRegEx});

    if (storesWithSlug.length) {
        this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
    }
    next();
});

//TODO - No HTML should be saved to the schema

storeSchema.statics.getTagsList = function() {
    return this.aggregate([
        //This function uses the unwind, group & sort operators of MongoDB
        {$unwind: '$tags'},
        {$group: {_id: '$tags', count: {$sum: 1} }},
        {$sort: {count: -1}}
    ]);
};

storeSchema.virtual('reviews', {
   ref: 'Review',
   localField: '_id', //The field in the Store model
   foreignField: 'store' //The field in the Review Model
});

storeSchema.statics.getTopStores = function() {
    return this.aggregate([
        {
            $lookup: {
                from: 'reviews',
                localField: '_id',
                foreignField: 'store',
                as: 'reviews'
            }
        },
        {
            $match: { //If more than 1 review exists
                'reviews.1': {$exists: true}
            }
        },
        {
            $addFields: { //Add this field to the collection
                averageRating: { $avg: '$reviews.rating'}
            }
        },
        {
            $sort: {
                averageRating: -1
            }
        },
        {
            $limit: 10
        }
    ]);
};

function autopopulate(next) {
    this.populate('reviews');
    next();
}

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Store', storeSchema);