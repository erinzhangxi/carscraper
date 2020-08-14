/*

  <Start>
  1) Pick single URL from database (oldest URL first)
  2) Load single URL in a browser
  3) Identify all links within the page
  4) Store all links in database


  --
  How do we cache the raw page?
  How do we re-scrape a page?
  Respect robot.txt?

*/

var mongoClient = require('./models/mongo.js'),
    URL         = require('./models/url').model,
    Page        = require('./models/pageContent').model;

var uri             = require("urijs"),
    async           = require("async"),
    puppeteer       = require("puppeteer"),
    _               = require("lodash");

var parser = require("./parser.js");
var carmaxScraper = require("./scraper/carmaxScraper.js");
const WHITELIST_SITES = ['www.carmax.com'];


mongoClient.connect({
  uri: 'mongodb://localhost/web-scraper'
}, function() {
  console.log('Connected To MongoDB!');
})

/** 
 * Crawler configurations
 */
// crawler will terminate once reaches this number.
let maxCrawlingDepth = 3;
//  Controls whether the crawler fetches only URL's where the hostname matches the initial URL.
let filterByDomain = true;
// Controls what domains the crawler is allowed to fetch from, regardless of filterByDomain settings.
let domainWhitelist = [];
// Controls whether to treat the www subdomain as the same domain as url host
// so if {@link http://a.com} has been fetched, {@link http://www.a.com} won't be fetched again.
let ignoreWWWDomain = true;
// Controls whether URL's that points to a subdomain of should also be fetched.
let scanSubdomains = false;

let host = "";


async.forever(
  function (next) {

    // Fetch least recently scrapped URL from database
    URL.find({}).sort({ lastScrapped: 1 }).limit(1).exec(function(err, url) {
      if (err) {
        return next(err);
      }

      url = url[0];

      if (!url || url === "") {
        return next('No Urls Found!');
      }

      console.log('\n\nProcessing URL', url.url);

      if (url.depth >= maxCrawlingDepth) {
        return next("Exceeded Maximal Crawling Depth");
      }

      try {
        processURL(url);
      } catch(e) {
        return next(err);
      }
    });

  },
  function (err) {
    console.log(err);
  }
);


/**
 * Given an url, open a headless browser and navigate to the page.
 * Crawl all links from page and insert into database.
 * @param  {String} url Current URL to fetch. 
 * @return {}           No return value
 */
async function processURL(url) {

  (async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 926 });

    // waitUntil handles any redirect time
    await page.goto(url.url, { waitUntil: 'networkidle0' });
  
    closeInitialModal(page);
  
    // Retrieve links to crawl next
    const pageLinks = await page.$$eval('a', as => as.map(a => a.href));
    
    // Parse page content and save to db
    await registerPage(page, url);
    
    await browser.close();

    const uniqueLinks = _.uniq(pageLinks);

    console.log('FOUND', uniqueLinks.length, 'Unique Links');

    // When there's no link on the page
    if (uniqueLinks.length === 0) {
      try {
        await setLastScrappedDate(url);
      }
      catch (e) {
        process.exit(1);
      }
    }

    try {
      await addLinksToQueue(url, uniqueLinks)
    }
    catch(e) {
      process.exit(1);
    }
    
  })();
}

async function insertCarData(cars) {
  console.log('INSERTING CARS ...', cars);
  const bulkUpsertOperation = URL.collection.initializeUnorderedBulkOp();

  if (cars.length === 0) return;

  cars.forEach(function(car) {
    bulkUpsertOperation.insert({
      ...car,
      source: 'www.carmax.com'   
    });
  });

  bulkUpsertOperation.execute(function (err, result) {
    if (err) {
      throw new Error(err);
    }

    car.save(function(err) {
      if (err) {
        throw new Error(err);
      }
      return;
    });
  });
  return;
}

async function registerPage(page, url) {
  console.log("Registering page: " + url.url);
  const bodyHTML = await page.content();
  let carResults = [];

  const domain = url.domain;

  if (WHITELIST_SITES.includes(domain)) {
    switch(domain) {
      case 'www.carmax.com':
        carResults = carmaxScraper.parse(bodyHTML);
        try {
          await insertCarData(carResults);
        }
        catch(e) {
          console.log('No car data to insert', e);
        }
        break;
			default:
				break;
		}
  }
  else {
    var parsedPage = parser.parse(url, bodyHTML);
  
    parsedPage = {
      ...parsedPage,
      url: url.url
    };
  
    console.log("Page " + url.url + " registered!");
  
    // insert new page content
    const newPage = new Page(parsedPage);
    
    newPage.save(function(err) {
      if (err) {
        throw err;
      }
      console.log('Saved New Page!', newPage);
      return newPage;
    })
  }
}



// When loading website, close any modal that blocks action
async function closeInitialModal(page) {
  try {
    await page.waitForSelector('.ReactModal__Body--open > .ReactModalPortal > .ReactModal__Overlay');
    await page.click('.ReactModal__Body--open > .ReactModalPortal > .ReactModal__Overlay');
  } catch (e) {}
}


function isUrlAbsolute(url) {
  var r = new RegExp('^(?:[a-z]+:)?//', 'i');
  return r.test(url);
}

/**
 * Current url doesn't have more link on its page. 
 * Setting its lastScrapped value in database to indicate it has been processed.
 * @param  {String} url Current URL to parse. 
 * @return {}           No return value
 */
async function setLastScrappedDate(url) {
  try {
    await URL.updateOne({ 
      url: url.url
    },
    { $set: 
      { 
        lastScrapped: new Date(), 
      } 
    });
  } catch(e) {
    throw new Error(e);
  }
}



function isURLValid(uniqueLink, url) {
  // skip self or empty link
  if (uniqueLink === url.url || uniqueLink === "" || !uniqueLink) {
    return false;
  }

  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator

  if (!pattern.test(uniqueLink)) {
    return false;
  }
  
  if (!isDomainValid(uri(uniqueLink).normalizeHostname())) {
    return false;
  }

  return true;
}



/**
 * Add all unique links from current url to database.
 * @param  {String} url Current URL to parse. 
 * @param  {Array}  uniqueLinks unique URLs to insert into db
 * @return {}           No return value
 */
async function addLinksToQueue(url, uniqueLinks) {
  const bulkUpsertOperation = URL.collection.initializeUnorderedBulkOp();
    
  const newDepth = (isNaN(url.depth) && !url.depth) ? 0 : url.depth + 1;

  let insertCount = 0;
  
  // Get links from current page, for each link - insert into database 
  uniqueLinks.forEach(function(uniqueLink) {
    if (isURLValid(uniqueLink, url)) {
      insertCount++;
      let currentUrl;
      if (!isUrlAbsolute(uniqueLink)) {
        currentUrl = url.domain + uniqueLink;
      }
      else {
        currentUrl = uniqueLink;
      }
      
      const parsedURL = uri(currentUrl).normalize();
      host = parsedURL.hostname();
  
      bulkUpsertOperation.find({
        url: currentUrl
      }).upsert().updateOne({
        $set: {
          url: currentUrl,
          lastFound: new Date(),
          depth: newDepth,
          domain: parsedURL.hostname()
        }
      });
    }
  });

  if (insertCount === 0) {
    throw new Error('No unique url to insert');
  }

  bulkUpsertOperation.execute(function (err, result) {
    if (err) {
      throw new Error(err);
    }

    // Mark original URL as scrapped
    console.log('Marking URL as scrapped! ---> depth: ', url.depth);

    url.set('lastScrapped', new Date());
    url.save(function(err) {
      if (err) {
        throw new Error(err);
      }
      return;
    });
  });
}



function isDomainValid(domain) {
  // If we're ignoring the WWW domain, remove the WWW for comparisons...
  if (ignoreWWWDomain) {
    domain = domain.replace(/^www\./i, "");
  }

  function domainInWhitelist(domain) {

    // If there's no whitelist, or the whitelist is of zero length,
    // just return false.
    if (!domainWhitelist || !domainWhitelist.length) {
        return false;
    }

    // Otherwise, scan through it.
    return domainWhitelist.some(function(entry) {
        // If the domain is just equal, return true.
        if (domain === entry) {
            return true;
        }
        // If we're ignoring WWW subdomains, and both domains,
        // less www. are the same, return true.
        if (ignoreWWWDomain && domain === entry.replace(/^www\./i, "")) {
            return true;
        }
        return false;
    });
  }

  // Checks if the first domain is a subdomain of the second
  function isSubdomainOf(subdomain, domain) {

    // Comparisons must be case-insensitive
    subdomain   = subdomain.toLowerCase();
    domain      = domain.toLowerCase();

    // If we're ignoring www, remove it from both
    // (if www is the first domain component...)
    if (ignoreWWWDomain) {
        subdomain = subdomain.replace(/^www./ig, "");
        domain = domain.replace(/^www./ig, "");
    }

    // They should be the same flipped around!
    return subdomain.split("").reverse().join("").substr(0, domain.length) ===
            domain.split("").reverse().join("");
  }

  // If we're not filtering by domain, just return true.
  return !filterByDomain ||
        // Or if the domain is just the right one, return true.
        domain === host ||
        // Or if we're ignoring WWW subdomains, and both domains,
        // less www. are the same, return true.
        ignoreWWWDomain &&
          host.replace(/^www\./i, "") === domain.replace(/^www\./i, "") ||
        // Or if the domain in question exists in the domain whitelist,
        // return true.
        domainInWhitelist(domain) ||
        // Or if we're scanning subdomains, and this domain is a subdomain
        // of the crawler's set domain, return true.
        scanSubdomains && isSubdomainOf(domain, host);
}
