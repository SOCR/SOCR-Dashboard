var express = require('express');
var router = express.Router();


function getProp(req){
	var reqObj = {} ;
	for (var propName in req.query) {
        //console.log(req.query);
        //console.log(req.query[propName]);
		//if (req.query.hasOwnProperty(propName)) {
            var lowerPropName = propName.toLowerCase();
            if (typeof(reqObj[lowerPropName]) != "undefined") {
                reqObj[lowerPropName] = reqObj[lowerPropName].concat([req.query[propName].toLowerCase()]);
                //console.log("no");
            }
            else {
                reqObj[lowerPropName] = [req.query[propName].toLowerCase()];
            }

		//}
	}
	console.log(reqObj);
	return reqObj;

};

router.get('/request', function(req, res){
	res.send(getProp(req));
});



module.exports = router;

