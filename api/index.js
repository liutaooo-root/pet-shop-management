const url = require('url');
const querystring = require('querystring');
const app = require('../server/app.js');

module.exports = (req, res) => {
  // Vercel rewrites /api/* to /api?__path__=*
  // We need to reconstruct the original URL for Express routing
  const parsedUrl = url.parse(req.url, true);
  const apiPath = parsedUrl.query.__path__ || '';
  delete parsedUrl.query.__path__;
  
  // Reconstruct the original URL path
  req.url = '/api/' + apiPath;
  const remainingParams = Object.keys(parsedUrl.query);
  if (remainingParams.length > 0) {
    req.url += '?' + querystring.stringify(parsedUrl.query);
  }
  
  // Let Express handle the request
  app(req, res);
};
