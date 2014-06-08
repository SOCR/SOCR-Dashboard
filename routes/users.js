var express = require('express');
var router = express.Router();

/* GET all datasets. */
router.get('/all', function(req, res){
	var db=req.db;
	db.collection('all').find().toArray(function(err, items){
		res.json(items);
	})
});

router.get('/fip', function(req, res){
	var db=req.db;
	db.collection('fip').find().toArray(function(err, items){
		res.json(items);
	})
});

module.exports = router;
