var express = require('express');
var router = express.Router();
var startupAPI=require('./apihelper');



function getProp(req){
    var reqObj = {} ;
	console.log(req.query);
	var query2={};
	for(var prop in req.query)
	{
		var lowprop=prop.toLowerCase();
		if(typeof req.query[prop] === 'object')
		{
			if(query2[lowprop]==undefined)
				query2[lowprop]=req.query[prop];
			else if(req.query[prop] instanceof Array)
			{
					query2[lowprop]=req.query[prop].concat(query2[lowprop]);
			}
			else
			{
				for(var j in query2[lowprop])
					req.query[prop][j]=query2[lowprop][j];
				query2[lowprop]=req.query[prop]
			}
		}
		else
		{
			if(query2[lowprop]!=undefined)
				query2[lowprop]=[req.query[prop]].concat(query2[lowprop]);
			else
				query2[lowprop]=[req.query[prop]]
		}
	}
	req.query=query2;
    for (var propName in req.query) {
            if (!(req.query[propName] instanceof Array)) {
                reqObj[propName] = {};
                for (var each in req.query[propName]) {
                    reqObj[propName][each] = parseFloat(req.query[propName][each]);
                }
            }
            else {
                reqObj[propName] = req.query[propName];
				if(propName=='reqvar')
				{
					for(var j in reqObj[propName])
					reqObj[propName][j]=reqObj[propName][j].toLowerCase();
				}
            }
    }
    console.log(reqObj);
    return reqObj;
}

router.get('/request', function(req, res){
 	process.on('uncaughtException', function (err) {
	  res.send("ERROR: Invalid Request")
	  console.log(err);
	}); 
	startupAPI(req.db, getProp(req), res);
});

module.exports = router;
