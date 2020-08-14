WIP (Set up for node-scraper)

## Table of contents
* [General info](#general-info)
* [Technologies](#technologies)
* [Setup](#setup)
* [Features (In Progress)](#features)
* [Future work](#future)

## General info
This project is a web application portion for the car search engine. 
	
## Technologies
Project is created with:
* Node.js: 11.7
* Mongoose: 5.9.17 
* React.js (TODO)
* Puppeteer: 3.3.0
	
## Setup
To run this project, install it locally using npm:

```
$ cd ../node-scraper
$ npm install

# If you have nvm installed
$ nvm install 11.7.0
$ nvm use 11.7.0

# Inserts the initial start url to crawl 
$ node ./insert-initial-url.js
$ npm start
```

## Features (In Progress)
### Crawler 
* Crawl car dealer websites with all their subpages
* If page is from one of the known sites, use scraper to parse car data.
* If page is from an unknown site, save html page, and page will be parsed offline (Solved in future works).

### Front End & Back End
* User can interact with webpage, type in information they want to search for, and receive search result.


## Future work

### NLP Processing
* Basic NLP processing (tokenizing, part of speech (POS) tagging, named entity-recognition (NER)) on the plain text

### Classification & Extraction
* Use the data from NLP processing to decide whether a page contains the data user is looking for, extract the data we're looking for
