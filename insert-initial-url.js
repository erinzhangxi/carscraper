const mongoClient = require('./models/mongo.js');
const URL = require('./models/url').model;

mongoClient.connect({
  uri: 'mongodb://localhost/web-scraper'
}, function () {
  console.log('Connected To MongoDB!');
})

const newUrl = new URL({
  url: 'https://www.carmax.com/cars?search=Lexus',
  depth: 0,
  domain: "www.carmax.com"
});

newUrl.save(function(err) {
  if (err) {
    throw err;
  }
  console.log('Saved New URL!', newUrl);
})
