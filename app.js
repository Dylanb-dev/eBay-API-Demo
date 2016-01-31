import express from 'express';
import ebay from 'ebay-api';
import userConfig from './config.js';
import bodyParser from 'body-parser';

const app = express();

/*
 *
 * Express routes for:
 *   - app.js
 *   - style.css
 *   - index.html
 *
 */

// Set up JSON parsers
app.use(bodyParser.urlencoded({
  extended: false,
}));

// parse application/json
app.use(bodyParser.json());

// parse application/vnd.api+json as json
app.use(bodyParser.json({
  type: 'application/vnd.api+json',
}));


// Serve application file depending on environment
app.get('/app.js', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(`${__dirname}/build/app.js`);
  } else {
    res.redirect('//localhost:9090/build/app.js');
  }
});

// Serve aggregate stylesheet depending on environment
app.get('/style.css', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(`${__dirname}/build/style.css`);
  } else {
    res.redirect('//localhost:9090/build/style.css');
  }
});

// Serve index page
app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/build/index.html`);
});

// Test data for graphing
app.get('/api/test', (req, res) => {
  res.send([{
    name: 'series1',
    values: [{
      x: '2016-01-29T11:11:58.000Z',
      y: 1999,
    }, {
      x: '2016-01-29T08:53:31.000Z',
      y: 2999.99,
    }, {
      x: '2016-01-27T22:19:14.000Z',
      y: 2200,
    }, {
      x: '2016-01-26T23:05:04.000Z',
      y: 3019.95,
    }],
    currency: 'AUD',
    listings: [{
      name: 'MACBOOK PRO 2015 RETINA. 13\', 256SSD, 8GB RAM, FINAL CUT, OFFICE + 2.5YR WRTY!',
      imageURL: 'http://galleryplus.ebayimg.com/ws/web/252269300050_1_0_1.jpg',
      URL: 'http://www.ebay.com/itm/MACBOOK-PRO-2015-RETINA-13-256SSD-8GB-RAM-FINAL-CUT-OFFICE-2-5YR-WRTY-/252269300050',
      price: 1999,
    }, {
      name: '2015 Apple MacBook Pro 15\' 2.5ghz 16gb Ram 512gb Storage & Magic Mouse',
      imageURL: 'http://galleryplus.ebayimg.com/ws/web/121872017491_1_0_1.jpg',
      URL: 'http://www.ebay.com/itm/2015-Apple-MacBook-Pro-15-2-5ghz-16gb-Ram-512gb-Storage-Magic-Mouse-/121872017491',
      price: 2999.99,
    }, {
      name: 'Retina MacBook Pro 15\' | Mid 2015 | i7 2.2GHz | 256GB SSD | 16GB RAM',
      imageURL: 'http://galleryplus.ebayimg.com/ws/web/222007509778_1_0_1.jpg',
      URL: 'http://www.ebay.com/itm/Retina-MacBook-Pro-15-Mid-2015-i7-2-2GHz-256GB-SSD-16GB-RAM-/222007509778',
      price: 2200,
    }, {
      name: '2015 Apple MacBook Pro Retina Display 15\' i7  2.5GHz  512GB  16GB  MJLT2X/A',
      imageURL: 'http://galleryplus.ebayimg.com/ws/web/221987410385_1_0_1.jpg',
      URL: 'http://www.ebay.com/itm/2015-Apple-MacBook-Pro-Retina-Display-15-i7-2-5GHz-512GB-16GB-MJLT2X-A-/221987410385',
      price: 3019.95,
    }],
  }]
);
});

// Interact with ebay API
app.post('/api', (req, res) => {
  const query = req.body;
  let items = [];

  if (query.keywords === undefined || query.keywords === '') {
    res.send('undefined api call');
    return;
  }

  const params = {
    keywords: [query.keywords],

    // add additional fields
    outputSelector: ['AspectHistogram'],

    paginationInput: {
      entriesPerPage: 20,
    },

    itemFilter: [
      // {name: 'FreeShippingOnly', value: true},
      // {name: 'MinPrice', value: '150'},
      // {name: 'MaxPrice', value: '155'},
      {
        name: 'LocatedIn',
        value: query.locatedIn,
      }, {
        name: 'SoldItemsOnly',
        value: query.condition === 'USED' ? true : false,
      }, {
        name: 'Condition',
        value: query.condition === 'USED' ? 3000 : 1000,
      },

    ],
  };

  ebay.xmlRequest({
    serviceName: 'Finding',
    opType: query.time === 'AVAILABLE' ? 'findItemsByKeywords' : 'findCompletedItems',
    appId: userConfig.AppID,
    params: params,
    parser: ebay.parseResponseJson, // (default)
  },
    // gets all the items together in a merged array
    (error, itemsResponse) => {
      if (error) throw error;
      items = itemsResponse.searchResult.item;
      const data = [];
      const a = [];
      const b = [];
      if (typeof(items) !== 'undefined') {
        for (let i = 0; i < items.length; i++) {
          a.push({
            x: items[i].listingInfo.endTime,
            y: items[i].sellingStatus.currentPrice.amount,
          });
          b.push({
            name: items[i].title,
            imageURL: items[i].galleryPlusPictureURL,
            URL: items[i].viewItemURL,
            price: items[i].sellingStatus.currentPrice.amount,
          });
        }

        data.push({
          name: 'series1',
          values: a,
          currency: items[0].sellingStatus.currentPrice.currencyId,
          listings: b,
        });
      }
      res.send(data);
    });
});

/*
 *
 * Webpack Dev Server
 *
 * See: http://webpack.github.io/docs/webpack-dev-server.html
 *
 */

if (process.env.NODE_ENV !== 'production') {
  const webpack = require('webpack');
  const WebpackDevServer = require('webpack-dev-server');
  const config = require('./webpack.local.config');
  new WebpackDevServer(webpack(config), {
    publicPath: config.output.publicPath,
    hot: true,
    noInfo: true,
    historyApiFallback: true,
  }).listen(9090, 'localhost', (err) => {
    if (err) {
      console.log(err);
    }
  });
}
/*
 *
 * Express server
 *
 */

let port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  const host = server.address().address;
  port = server.address().port;

  console.log('Essential React listening at http://%s:%s', host, port);
});
