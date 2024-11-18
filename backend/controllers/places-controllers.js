
const fs = require('fs');

const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');
const User = require('../models/user');

const getPlaceById = async (req, res, next) => {
    const placeId = req.params.pid;//{pid:'p1'}

    let place;
    try {
        place = await Place.findById(placeId);
    } catch (err) {
        const error = new HttpError('Something went wrong, Could not find a place.', 500);
        return next(error);
    }

    if (!place) {
        const error = new HttpError('Could not find a place provided id', 404);
        return next(error);
    }

    res.json({ place: place.toObject({ getters: true }) });
};

//alternate way of assiging function
// function getPlaceById(){...}
// const getPlaceById=function(){...}

const getPlacesByUserId = async (req, res, next) => {
    const userId = req.params.uid;

    // let places;
    let userWithPlaces;
    try {
        userWithPlaces = await User.findById(userId).populate('places');
        // places = await Place.find({ creator: userId });
    } catch (err) {
        const error = new HttpError('Something went wrong, fetching places failed.', 500);
        return next(error);
    }

    // if (!places || places.length === 0) {
    if (!userWithPlaces || userWithPlaces.places.length === 0) {
        return next(
            new HttpError('Could not find a places for the  provided userid', 404)
        );
    }

    res.json({ places: userWithPlaces.places.map(place => place.toObject({ getters: true })) });

}

const createPlace = async (req, res, next) => {
    const errors = validationResult(req);//it will check if there is any validation error detected

    if (!errors.isEmpty()) {
        next(new HttpError('Invalid inputs passed, please check u r data.', 422));
    }

    //const title=req.title;//easy way is in the above..
    const { title, description, address, creator } = req.body;

    let coordinates;
    try {
        coordinates = await getCoordsForAddress(address);
    } catch (error) {
        return next(error);
    }

    const createdPlace = new Place({
        title,
        description,
        image: req.file.path,//'https://upload.wikimedia.org/wikipedia/commons/d/df/NYC_Empire_State_Building.jpg',
        address,
        location: coordinates,
        creator
    });

    let user;
    try {
        user = await User.findById(creator);

    } catch (err) {
        const error = new HttpError('Creating place failed, please try again', 500);
        return next(error);
    }

    if (!user) {
        const error = new HttpError('Could not find user for provided id', 404);
        return next(error);
    }

    console.log(user);

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdPlace.save({ session: sess });//,  validateModifiedOnly: true 
        user.places.push(createdPlace);
        await user.save({ session: sess });
        await sess.commitTransaction();
        // await createdPlace.save();
    } catch (err) {
        const error = new HttpError('Creating place failed, please try again', 500);
        return next(error);
    }

    res.status(201).json({ place: createdPlace });//200 is success status code
};

const updatePlace = async (req, res, next) => {
    const errors = validationResult(req);//it will check if there is any validation error detected

    if (!errors.isEmpty()) {
        return next(
            new HttpError('Invalid inputs passed, please check your data.', 422)
        );
    }

    const { title, description } = req.body;
    const placeId = req.params.pid;

    let place;
    try {
        place = await Place.findById(placeId);
    } catch (err) {
        const error = new HttpError(
            'Something went wrong, could not update place.',
            500
        );
        return next(error);
    }

    place.title = title;
    place.description = description;

    try {
        await place.save();
    } catch (err) {
        const error = new HttpError(
            'Something went wrong, could not update place.',
            500
        );
        return next(error);
    }

    res.status(200).json({ place: place.toObject({ getters: true }) });

};

const deletePlace = async (req, res, next) => {
    const placeId = req.params.pid;

    let place;
    try {
        place = await Place.findById(placeId).populate('creator');//await Place.findById(placeId).populate({ path: 'creator', model: User })
    } catch (err) {
        const error = new HttpError('Something went wrong, Could not delete place.', 500);
        return next(error);
    }

    if (!place) {
        const error = new HttpError('Could not find place by this id.', 404);
        return next(error);
    }

    const imagePath = place.image;

    try {
        // // await place.remove();
        // await place.deleteOne();
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await place.deleteOne({ session: sess });
        place.creator.places.pull(place);
        await place.creator.save({ session: sess });
        await sess.commitTransaction();

    } catch (err) {
        const error = new HttpError(
            'Something went wrong, Could not delete place.',
            500
        );
        return next(error);
    }

    fs.unlink(imagePath, err => {
        console.log(err);
    });

    res.status(200).json({ message: 'Deleted place.' });
};


exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;