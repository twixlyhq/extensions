var express = require('express');
var router = express.Router();
var swig = require('swig');
var process_env = process.env;

router.use(function(req, res, next) { 
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

/* Extensions */
router.get('/extensions/:extension', function(req, res) {
  var model = {
    title: 'Extensions - ' + req.params.extension,
    extension_name: req.params.extension,
    process_env,
    req
  };
  res.render('index.html', model);
});

module.exports = router;