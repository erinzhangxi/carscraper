/* 
 *	General purpose parser 
 *  It extracts title, description, and keywords from website meta data.
*/
var cheerio = require('cheerio');


exports.parse = function(htmlContent){
	var $ = cheerio.load(htmlContent);
		
	var result = {};
		
	result.title = $("head title").text() || "no-title";
	result.title = result.title.trim();

	result.description = $("head meta[name='description']").attr("content") || result.title;
	result.description = result.description.trim();

	var metaKeywords = $("head meta[name='keywords']").attr("content") || "";
	result.keywords = parseKeywords(metaKeywords);

	result.body = $('body').text();
	
	console.log("Page parsed : " + result.title);

	return result;
};


var parseKeywords = function (metaKeywords) {
	var keywords = [];

	var parts = metaKeywords.split(",");
	var i;
	for (i = 0; i < parts.length; i++) {
		var keyword = parts[i].trim();
		if (keyword.length > 0) {
			keywords.push(keyword);
		}
	}

	return keywords;
};