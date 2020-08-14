/*  Parser for carmax.com */
var cheerio = require('cheerio');
const { html } = require('cheerio');

const relevantAttributesFromCarMax = [
  'stockNumber',
  'make',
  'model',
  'year',
  'trim',
  'basePrice',
  'msrp',
  'mileage',
  'storeName',
  'storeCity',
  'state',
  'lastMadeSaleableDate',
  'newTireCount',
  'highlights',
  'geoCity',
  'highlightedFeatures',
  'isNew',
  'IsNewArrival',
  'imageCount',
  'transferText',
  'isComingSoon',
  'isSaleable',
];

exports.parse = function(htmlContent){
  const results = [];
  
  const $ = cheerio.load(htmlContent, { xmlMode: true });
  
  const pageResults = $('#orig-cars-listing');
  
  if (pageResults.length != 1) {
    return results;  
  }
  
  const pageResultCell = $("#orig-cars-listing > .car-tile");
  
  pageResultCell.each(function(cellIdx, resultCell) {
    console.log('Iterating through cell!');
  
    const firstLayerDivs = $('> div', $(resultCell));
    console.log('firstLayerDivs', firstLayerDivs.length);
  
    const cellResults = {};
  
    // Go through each first-layer div
    firstLayerDivs.each(function(divIdx, firstLayerDiv) {
      // Get the divs ID
      const firstLayerId = $(firstLayerDiv).attr('id');
      // Check if the ID is relevant to us
      if (relevantAttributesFromCarMax.indexOf(firstLayerId) !== -1) {
        // Collect value + store in cellResults
        const firstLayerValue = $(firstLayerDiv).text();
        cellResults[firstLayerId] = firstLayerValue;
      }
    });
  
    // Collect result image
    const resultImage = $('.hero-image noscript img', $(resultCell));
    if (resultImage.length === 1) {
      cellResults['image'] = resultImage.attr('src');
    }
    results.push(cellResults);
  
  });
  return results;
}
