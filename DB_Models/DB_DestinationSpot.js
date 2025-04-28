const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DestinationSpotSchema = new Schema({
    SpotName:{
        type: String,
        required: true
    },    
    StreetAddress:{
        type: String,
        required: true
    },
    City:{
        type: String,
        required: true
    },
    StateOrProvince:{
        type: String,
        required: true
    },
    Country:{
        type: String,
        required: true
    },
    Latitude:{
        type: Number,
        required: true
    },
    Longitude:{
        type: Number,
        required: true
    },
    BestTimeToVisitInDay:{
        type: String,
        required: true
    },
    BestTimeToVisitInYear:{
        type: String,
        required: true
    },
    AverageTimeSpent:{
        type: String,
        required: true
    },
    Fees:{
        type: String,
        required: true
    },
    Rating:{
        type: Number,
        required: true
    },
})

module.exports = mongoose.model("Destination Spot", DestinationSpotSchema);