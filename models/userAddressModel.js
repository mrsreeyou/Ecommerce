const mongoose = require('mongoose')

const AddressSchema = new mongoose.Schema({
    fullname: { type: String, require: true },
    address: { type: String, require: true },
    city: { type: String, require: true },
    state: { type: String, require: true },

    country: { type: String, require: true },
    pincode: { type: Number, require: true },
    contactno: { type: Number, require: true }

})

module.exports= mongoose.model('AddressModel',AddressSchema)