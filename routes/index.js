var express = require('express');
var router = express.Router();

router.get('/new', function(req, res) {
  res.render('index', { title: 'SOCR Analytics Dashboard', mode:'free' });
});

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'SOCR Analytics Dashboard', mode:'location' });
});


module.exports = router;
