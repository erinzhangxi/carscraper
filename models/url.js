const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var PageModel = require("./pageContent.js");

const URLSchema = new Schema({

  domain: { type: String, required: true },

  parentUrl: { type: String },

  url: { type: String, required: true },

  // firstFound: { type: Date, default: Date.now },
  lastFound: { type: Date },

  lastScrapped: { type: Date },

  depth: { type: Number, default: 0 }

});

URLSchema.index({ url: 1 }, { background: true });
URLSchema.index({ lastScrapped: -1 }, { background: true });


const URLModel = mongoose.model('URL', URLSchema, 'urls');
module.exports.schema = URLSchema;
module.exports.model = URLModel;
