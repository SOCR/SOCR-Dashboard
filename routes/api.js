var express = require('express');
var router = express.Router();

function collect() {
    var ret = {};
    var len = arguments.length;
    for (var i=0; i<len; i++) {
        for (p in arguments[i]) {
            if (arguments[i].hasOwnProperty(p)) {
                ret[p] = arguments[i][p];
            }
        }
    }
    return ret;
}

function changeToNum(obj){
    newObj = {};
    for (var each in obj) {
        newObj[each] = parseFloat(obj[each]);
    }
    return newObj;
}

function getProp(req){
    var reqObj = {} ;
    for (var propName in req.query) {

        var lowerPropName = propName.toLowerCase();

        if (typeof(reqObj[lowerPropName]) != 'undefined') {
            if (typeof req.query[propName] === 'object'){
                reqObj[lowerPropName] = collect(reqObj[lowerPropName],changeToNum(req.query[propName]));
            }
            else{
                reqObj[lowerPropName] = reqObj[lowerPropName].concat([req.query[propName].toLowerCase()]);
            }
        }


        else {
            if (typeof req.query[propName] === 'object') {
                reqObj[lowerPropName] = {};
                for (var each in req.query[propName]) {
                    reqObj[lowerPropName][each] = parseFloat(req.query[propName][each]);
                }
            }
            else {
                reqObj[lowerPropName] = [req.query[propName].toLowerCase()];
            }
        }
    }
    console.log(reqObj);
    return reqObj;
}

router.get('/request', function(req, res){
	res.send(getProp(req));
});

module.exports = router;

