const fs = require('fs');
const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const placesRoutes = require('./routes/places-route');
const usersRoutes = require('./routes/users-route');
const HttpError = require('./models/http-error');

const app = express();

app.use(bodyParser.json());

app.use('/uploads/images', express.static(path.join('uploads', 'images')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST,PATCH, DELETE');
    next();
});

app.use('/api/places', placesRoutes); // => /api/places...
app.use('/api/users', usersRoutes); 

//middleware
app.use((req, res, next) => {
    const error = new HttpError('Could not find this route.', 404);
    throw error;
});

app.use((error, req, res, next) => {
    if (req.file) {
        fs.unlink(req.file.path, err => {
            console.log(err);
        });
    }
    // console.log(error.message);
    if (res.headerSent) {
        return next(error);
    }
    res.status(error.code || 500)
    res.json({ message: error.message || 'An unknown error occured!' });
});

mongoose
    .connect(`mongodb+srv://arathirajagopalan22:arathi123@cluster0.vegapgy.mongodb.net/mern_test?retryWrites=true&w=majority`)
    .then(() => {
        app.listen(5000);//if connection is successful
    })
    .catch(err => {
        console.log(err);
    });

// app.listen(5000);