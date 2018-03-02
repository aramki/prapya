/*
 * Copyright (c) 2018. Beaconstalk Technologies Pvt Ltd
 * Author: Ramakrishnan A
 */
const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');
const User = mongoose.model('User');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter: (req, file, next) => {
      const isPhoto = file.mimetype.startsWith('image/');
      if (isPhoto) {
          next(null, true);
      } else {
          next({message: 'Filetype is not supported'}, false);
      }
  }
};

exports.homePage = (req, res) => {
  res.render('index', {title: "Prapya"});
};

exports.addStore = (req,res) => {
    res.render('editStore', {title: 'Add a Store'});
};

exports.upload = multer(multerOptions).single('photo');
exports.resize = async (req, res, next) => {
    if (!req.file) {
        //Upload only if a file is present
        next();
        return;
    }
    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`;
    //Resizing the photo
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);
    next();
};


exports.createStore = async (req,res) => {
    req.body.author = req.user._id;
    const store = await(new Store(req.body)).save();
    req.flash('success', `Successfully Created ${store.name}.`);
    res.redirect(`/store/${store.slug}`);
};

exports.updateStore = async (req,res) => {
    req.body.location.type = 'Point';
    const store = await Store.findOneAndUpdate(
                            {_id: req.params.id},
                            req.body,
                            {new: true, runValidators: true}
                        ).exec();
    // language=HTML
    req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store</a>`);
    res.redirect(`/stores/${store._id}/edit`);        
};

exports.getStores = async (req,res) => {
    let page = req.params.page || 1;
    const limit = 6;
    const skip = (page * limit) - limit;
    //Check the database for all stores
    //TODO Display the stores associated with the author
    const storesPromise = Store
        .find()
        .skip(skip)
        .limit(limit)
        .sort({created: 'desc'});
    const countPromise = Store.count();
    const [stores, count] = await Promise.all([storesPromise, countPromise]);
    const numberOfPages = Math.ceil(count / limit);
    if (!stores.length && skip) {
        req.flash('info', `You asked for page ${page}, but that does not exist. So, you are being redirected to the last page.`);
        res.redirect(`/stores/page/${numberOfPages}`);
        return;
    }
    res.render('stores', {title: 'Stores', stores: stores, page: page, numberOfPages: numberOfPages, count: count });
};

const confirmAuthor= (store, user) => {
    if (!store.author.equals(user._id)) {
        throw Error('You must own the store to edit it');
    }
};

exports.editStore = async (req,res) => {

    //Find the store for the ID sent in req.params
    const store = await Store.findOne({_id: req.params.id});

    //Allow changes only if permissions are available
    confirmAuthor(store, req.user);
    //Render the edit form
    res.render('editStore', {title: `Edit ${store.name}`, store: store});
};

exports.getStoreBySlug = async (req, res, next) => {
    const store = await Store.findOne({slug: req.params.slug}).populate('author reviews');

    //console.log(store);
    if (!store) return next();
    res.render('store', {title: store.name, store: store});
};

exports.getStoresByTag = async (req, res) => {
    const currentTag = req.params.tag;
    const tagQuery = currentTag || {$exists: true};
    const tagPromise = Store.getTagsList();
    const storesPromise = Store.find({tags: tagQuery});
    const [tags, stores] = await Promise.all([tagPromise, storesPromise]);

    res.render('tag', { tags: tags,
                        currentTag: currentTag,
                        title: 'Tags',
                        stores: stores});

};

exports.displayMap = (req, res) => {
    res.render('map', {title: 'Map'});
};

exports.searchStores = async (req, res) => {
    const stores = await Store.find({
        $text: {
            $search: req.query.q
        }
    }, {
        score: {$meta: 'textScore'}
    }).sort({
        score: {$meta: 'textScore'}
    }).limit(5);
    res.json(stores);
};

exports.mapStores = async (req, res) => {
    //Need to map over the array as lng and lat are strings
    const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
    const query = {
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: coordinates
                },
                $maxDistance: 10000 //10kms
            }
        }
    };
    //TODO Specify a select parameter if only specific fields are required
    const stores = await Store.find(query).select('-author -storeOwnerName -storeOwnerContactNumber -storeBoxId').limit(10);
    res.json(stores);
};

exports.heartStore = async (req, res) => {
    const hearts = req.user.hearts.map(obj => obj.toString());
    const operator = hearts.includes(req.params.id) ? '$pull':'$addToSet';
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {[operator]: {hearts: req.params.id}},
        { new: true});

    res.json(user);
};

exports.getHearts = async(req, res) => {
    const stores = await Store.find({
       _id: {$in: req.user.hearts}
    });
    res.render('stores', {title: 'Stores I like', stores});
};

exports.getTopStores = async (req, res) => {
    console.log("Inside Top 10 Stores");
    const stores = await Store.getTopStores();
    res.render('topstores', {title: '`\u2B50` Top Stores', stores: stores});
    //res.json(stores);
};