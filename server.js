import path from 'path';
import express from 'express';
import ebay from 'ebay-api';
import userConfig from './config.js';
import bodyParser from 'body-parser';

const app = express();

/************************************************************
 *
 * Express routes for:
 *   - app.js
 *   - style.css
 *   - index.html
 *
 ************************************************************/

//Set up JSON parsers
 app.use(bodyParser.urlencoded({
   extended: false
 }))

 // parse application/json
 app.use(bodyParser.json())

 // parse application/vnd.api+json as json
 app.use(bodyParser.json({
   type: 'application/vnd.api+json'
 }))


// Serve application file depending on environment
app.get('/app.js', function(req, res) {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(__dirname + '/build/app.js');
  } else {
    res.redirect('//localhost:9090/build/app.js');
  }
});

// Serve aggregate stylesheet depending on environment
app.get('/style.css', function(req, res) {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(__dirname + '/build/style.css');
  } else {
    res.redirect('//localhost:9090/build/style.css');
  }
});

// Serve index page
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/build/index.html');
});

//Test data for graphing
app.get('/api/test', function(req, res) {
  let testData = [{
    name: "series1",

    values: [{
      x: "2016-01-24T04:33:30.000Z",
      y: 85
    }, {
      x: "2016-01-28T04:33:30.000Z",
      y: 36.75
    }, {
      x: "2016-01-30T04:33:30.000Z",
      y: 25
    }],
    currency: 'AUD',

    listings: [
      { name: 'Apple MacBook Air 11.6" - everything working, superb condition, in original box!',
        imageURL: 'http://thumbs4.ebaystatic.com/m/mDsOlZ_lAEePoO8J0SZl-MA/140.jpg',
        URL: 'http://www.ebay.com/itm/Apple-MacBook-Air-11-6-everything-working-superb-condition-original-box-/262243199779',
        price: 15 },
      { name: 'APPLE MACBOOK PRO 13.3" LAPTOP 2.4Ghz NEW CONDITION FAST & SMOOTH 750GB WDC BLK ',
        imageURL: 'http://thumbs3.ebaystatic.com/m/mWftMEVr4HQUlOAGS4KxGnQ/140.jpg',
        URL: 'http://www.ebay.com/itm/APPLE-MACBOOK-PRO-13-3-LAPTOP-2-4Ghz-NEW-CONDITION-FAST-SMOOTH-750GB-WDC-BLK-/141883016966',
        price: 12 },

      { name: 'MacBook Air 13.3" MD761X/A 2013 4Gb 256 SSD',
        imageURL: 'http://thumbs1.ebaystatic.com/m/mJJhrncdYk8WBoWM7AOaZUQ/140.jpg',
        URL: 'http://www.ebay.com/itm/MacBook-Air-13-3-MD761X-A-2013-4Gb-256-SSD-/321986726996',
        price: 10
      }
    ]
  }]
  res.send(testData);
});

//Interact with ebay API
app.post('/api', function(req, res) {
  let query = req.body;
  console.log(JSON.stringify(query));
  let items = [];

  if (query.keywords == undefined || query.keywords == '') {
    res.send('undefined api call');
    console.log('undefined api call');
    return;
  }

  let params = {
    keywords: [query.keywords],

    // add additional fields
    outputSelector: ['AspectHistogram'],

    paginationInput: {
      entriesPerPage: 100
    },

    itemFilter: [
      // {name: 'FreeShippingOnly', value: true},
      // {name: 'MinPrice', value: '150'},
      // {name: 'MaxPrice', value: '155'},
      {
        name: 'LocatedIn',
        value: query.locatedIn
      }, {
        name: 'SoldItemsOnly',
        value: query.avail =='SOLD' ? true : false
      }, {
        name: 'Condition',
        value: query.condition =='USED' ? 3000 : 1000
      }

    ],

    // domainFilter: [
    //   {name: 'domainName', value: 'Digital_Cameras'}
    // ]
  };

  ebay.xmlRequest({
      serviceName: 'Finding',
      opType: query.avial == 'AVAILABLE' ? 'findItemsByKeywords' : 'findCompletedItems',
      appId: userConfig.AppID,
      params: params,
      parser: ebay.parseResponseJson // (default)
    },
    // gets all the items together in a merged array
    function itemsCallback(error, itemsResponse) {
      if (error) throw error;
      items = itemsResponse.searchResult.item;
      let data = [];
      let a = [];
      let b = [];
      if(typeof(items) !== 'undefined'){
        for (let i = 0; i < items.length; i++) {
          a.push({
            x: items[i].listingInfo.endTime,
            y: items[i].sellingStatus.currentPrice.amount
          });
          b.push({
            name: items[i].title,
            imageURL: items[i].galleryPlusPictureURL,
            URL: items[i].viewItemURL,
            price: items[i].sellingStatus.currentPrice.amount
          });

        }

      data.push({
        name: "series1",
        values: a,
        currency: items[0].sellingStatus.currentPrice.currencyId,
        listings: b

      });
      }

      res.send(data);
    });
});

/*************************************************************
 *
 * Webpack Dev Server
 *
 * See: http://webpack.github.io/docs/webpack-dev-server.html
 *
 *************************************************************/

if (process.env.NODE_ENV !== 'production') {
  const webpack = require('webpack');
  const WebpackDevServer = require('webpack-dev-server');
  const config = require('./webpack.local.config');
  new WebpackDevServer(webpack(config), {
    publicPath: config.output.publicPath,
    hot: true,
    noInfo: true,
    historyApiFallback: true
  }).listen(9090, 'localhost', function (err, result) {
    if (err) {
      console.log(err);
    }
  });
}


/******************
 *
 * Express server
 *
 *****************/

const port = process.env.PORT || 8080;
const server = app.listen(port, function () {
  const host = server.address().address;
  const port = server.address().port;

  console.log('Essential React listening at http://%s:%s', host, port);
});
