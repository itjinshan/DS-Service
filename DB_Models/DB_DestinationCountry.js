const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DestinationCountrySchema = new Schema({
    CountryName:{
        type: String,
        required: true
    },
    CountryCode:{
        type: String,
        required: true
    },
    Continent:{
        type: String,
        required: true
    },
    Currency:{
        type: String,
        required: true
    },
    CurrencyCode:{
        type: String,
        required: true
    },
    CurrencySymbol:{
        type: String,
        required: true
    }
})

module.exports = mongoose.model("Destination Country", DestinationCountrySchema);