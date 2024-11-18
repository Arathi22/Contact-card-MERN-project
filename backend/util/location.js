const axios = require('axios');

const HttpError = require('../models/http-error');

const API_KEY = 'pk.4e61298f5285ca7e457c828212b2b0a1';

async function getCoordsForAddress(address) {
    // return {
    //   lat: 40.7484474,
    //   lng: -73.9871516
    // };
    //   const response = await axios.get(
    //     `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    //       address 
    //     )}&key=${API_KEY}`
    //   );
    const response = await axios.get(
        `https://us1.locationiq.com/v1/search.php?key=${API_KEY}&q=${encodeURIComponent(
            address
        )}&format=json`
    );

    const data = response.data[0];

    if (!data || data.status === 'ZERO_RESULTS') {
        const error = new HttpError(
            'Could not find location for the specified address.',
            422
        );
        throw error;
    }

    // const coordinates = data.results[0].geometry.location;
    const coorLat = data.lat;
    const coorLon = data.lon;
    const coordinates = {
        lat: coorLat,
        lng: coorLon
    };

    return coordinates;
}

module.exports = getCoordsForAddress;
