const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// TODO url should be the id
const pageSchema = new Schema({

  url: { type: String, required: true },

  title: { type: String, required: true },

  description: { type: String, required: true },

  body: { type: String, required: true },

  keywords: [String]
  
});

pageSchema.index({ url: 1 }, { name: 'key', unique: true });

const PageModel = mongoose.model('Page', pageSchema, 'pages');
module.exports.schema = pageSchema;
module.exports.model = PageModel;

