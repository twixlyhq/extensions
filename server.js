// call the packages we need
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');
var compression = require('compression');
var swig = require('swig');
var session = require('express-session');
var routes = require('./routes/index.js');

app.use(session({ 
  secret: 'ssshhhhh', 
  resave: true,
  saveUninitialized: true,
  key: 'app-cms'
}));

// This is where all the magic happens!
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/src');

// Swig will cache templates for you, but you can disable
// that and use Express's caching instead, if you like:
app.set('view cache', true);
// To disable Swig's cache, do the following:   
// NOTE: You should always cache templates in a production environment.
// Don't leave both of these to false in production!
swig.setDefaults({ cache: false });

// set our port 
app.set('port', (process.env.PORT || 12000));  

app.use(bodyParser({limit: '1mb'}));

// compress responses
// app.use(compression());

var cacheFor = -1;
// if(process.env.NODE_ENV) {
//   cacheFor = 86400000; // one day
// }

app.use(routes);

app.use('/', express.static( path.join( __dirname, 'src' ), { maxAge: cacheFor }));
app.use(express.static( path.join( __dirname, 'dist' ), { maxAge: cacheFor }));

// start the server
app.listen(app.get('port'), function() { 
  console.log('Node app is running on port', app.get('port'));
});