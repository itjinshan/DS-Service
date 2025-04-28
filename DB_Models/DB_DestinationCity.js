const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DestinationCitySchema = new Schema({
    CityName:{
        type: String,
        required: true
    },
    AirportCodes:[{
        AirportCode:{
            type: String
        }
    }],
    CountryIn:{
        type: String,
        required: true
    }
})

module.exports = mongoose.model("Destination City", DestinationCitySchema);