const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CarSchema = new Schema({

  make: { type: String, required: true },

  model: { type: String, required: true },

  year: { type: Number, required: true },

  // where is this source scraped from
  source: {type: String, required: true},

  price: { type: String  },

  mileage: { type: String },

  storeName: { type: String },

  storeCity: { type: String },

  state: { type: String},

  isNew: { type: Boolean },

});

CarSchema.index({ make: 1 }, { background: true });
CarSchema.index({ model: 1 }, { background: true });
CarSchema.index({ source: 1 }, { background: true });


const CarMode = mongoose.model('Car', CarSchema, 'cars');
module.exports.schema = CarSchema;
module.exports.model = CarMode;
