const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    name: String,
    price: {type: Number, min: 0.1, required: [true, 'Service price is required'] },
    location: [Object],
    account_details: {type: mongoose.Schema.ObjectId, ref: 'Account'},
    created_by: {type: mongoose.Schema.ObjectId, ref: 'User'},
    description: String,
    summery: String,
    category: String,
    cover_image: String,
    images: [String],
    slug: String,
    rating: {type: Number, min: 1, max: 5},
    ratings_avg: {type: Number, default: 4.5},
    discount: {
        type: Number,
        validate: {
            validator: function(val){
                return val < this.price
            }
        }
    },
    business_name: String,
    date_created: {type: Date, default: Date.now()},
    status: {type: Number, default: 1}
});

const Model = mongoose.model('Service', Schema);

module.exports = Model;