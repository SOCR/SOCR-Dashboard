var crossfilter=require('crossfilter');
var varUsage={names:[],amounts:[],dataIn:[],dimensions:[], sources:[], bounds:[]};
var superUsage={names:[],amounts:[],dataIn:[], dimensions:[], dependancies:[], sources:[]};
var people=[];
var cfilter, all;
var completion=0;
var argumentsJ;
var response;
var db;
var reqvars, filtervars;
function startup(database, args, res)
{
	
	varUsage={names:[],amounts:[],dataIn:[],dimensions:[], sources:[], bounds:[]};
	superUsage={names:[],amounts:[],dataIn:[], dimensions:[], dependancies:[], sources:[]};
	completion=0;
	people=[];
	response=res;
	db=database;
	argumentsJ=args;
	reqvars=[];
	filtervars=[];
	loadData();
}

//finds index of variable
function findVariable (dataClass, varName)
{
	
	//search qualitative
	if(dataClass=='super')
	{
		for(var j in superUsage.names)
		{
			if(superUsage.names[j].toLowerCase()==varName)
				return j;
		}
	}
	
	//search quantitative
	else	
	{
		for(var j in varUsage.names)
		{
			if(varUsage.names[j].toLowerCase()==varName)
			{
				return j;
			}
		}
	}
	
	//no match
	console.error("ERROR: Invalid dataset name: "+varName);
	return -1;
}

function getDimension(dataset,chart) 
{
	//find index
	var datatype = 'super';
    var index=findVariable (datatype, dataset);
	if(index<0)
	{
		datatype='var';
		index=findVariable (datatype, dataset);
		if(index<0)
		{
			response.send('Invalid dataset "'+dataset+'"');
			return;
		}
		else
		{
			dataset=varUsage.names[index];
		}
	}
	else
	{
		dataset=superUsage.names[index];
	}
	
	//access variable list
	var variables=varUsage;
	if(datatype=='super')
	{
		variables=superUsage;
	}
	
	//checks for repeated dimension
	variables['amounts'][index]+=1;
	if(variables['amounts'][index]>1)
	{
		finishGen(variables['dimensions'][index],chart, index, dataset)
	}
	
	//creates unrepeated dimension
	else
	{
		getData(dataset.toLowerCase(),function(arg, ind, datast, dataType){
			var lowdata=datast.toLowerCase();
			arg[0]['dimensions'][ind]= cfilter.dimension(function (d) {
				return d[datast];
			});
			if(dataType=='super')
				arg[0]['dimensions'][ind].filter(function(d){return argumentsJ[lowdata].indexOf(d)>-1});
			else
				arg[0]['dimensions'][ind].filter(function(d){return d>argumentsJ[lowdata].min&&d<argumentsJ[lowdata].max});
			finishGen(arg[0]['dimensions'][ind],arg[1], ind, datast)
		
		},[variables, chart]);
	}
} 

//import specified variable into population
function getData(datasets, callback, args)
{
	var datasource=superUsage;
	var url='super';
	var dataIndex=findVariable ('super', datasets);
	if(dataIndex<0)
	{
		dataIndex=findVariable ('var', datasets);
		datasource=varUsage;
		url='var';
		if(dataIndex==-1)
		{	
			response.send('Error: Invalid Data Variable "'+datasets+'"');
			return;
		}
		else
		{
			datasets=varUsage.names[dataIndex];
		}
	}
	else
	{
		datasets=superUsage.names[dataIndex];
	}
	if(datasource.dataIn[dataIndex])
	{
		callback(args, dataIndex, datasets, url);
	}
	else
	{
		datasource.dataIn[dataIndex]=true;
		if(url=='super')
		{
			db.collection('super').find({name:datasets}).toArray(function(err, d){
				var data=d[0].data;
				addData(url, datasets, data);
				callback(args, dataIndex, datasets, url);
			})
		}
		else
		{
			db.collection('var').find({name:datasets}).toArray(function(err, d){
				var data=d[0].data;
				addData(url, datasets, data);
				var min=Number.MAX_VALUE;
				var max=-1*Number.MAX_VALUE;
				for(var j in data)
				{
					if(data[j]>max&&data[j]!=-999)
						max=data[j];
					if(data[j]<min&&data[j]!=-999)
						min=data[j]
				}
				varUsage.bounds[dataIndex][0]=min;
				varUsage.bounds[dataIndex][1]=max;
				callback(args, dataIndex, datasets, url);
			});
		}
	}
}

//finish importing specified variable
function finishGen(dimension, chart, index, dataset)
{
}

//incorporate imported variable into simulated population
function addData(datatype, dataset, data)
{
	var variableIndex=findVariable (datatype, dataset.toLowerCase());
 	for(var person in people)
	{
		var fipcode=people[person].fip;
		if(datatype=='super')
		{
			var distribution=data[fipcode];
			var key=Math.random();
			var index=0;
			while(key>distribution[index])
			{
				index++;
			}
			people[person][dataset]=superUsage['dependancies'][variableIndex][index];
		}
		else
		{
			people[person][dataset]=data[fipcode];
		}
		
	} 
}

function recursiveReq(n)
{
	if(n<reqvars.length)
		getData(reqvars[n], function(a){recursiveReq(a)}, n+1);
	else
		recursiveDim(0);
}
function recursiveDim(n)
{
	if(n<filtervars.length)
		getData(filtervars[n], function(a){recursiveDim(a)}, n+1);
	else
		finishFilter();
}

function finishFilter()
{
	for(var j in filtervars)
	{
		getDimension(filtervars[j],"");
	}
	response.send(cfilter.dimension(function(d){return 1}).top(Infinity));
}

//load values for dataset
function loadData()
{
	db.collection('all').find().toArray(function(err, data){
		for(var j in data)
		{ 
			if(data[j]['name']==undefined)
				continue;
			varUsage.names.push(data[j]['name'])
			varUsage.amounts.push(0);
			varUsage.dataIn.push(false);
			varUsage.dimensions.push({});
			varUsage.sources.push(data[j].source)
			varUsage.bounds.push([0,0]);
		}
        endLoad();
	})
	
	db.collection('allsuper').find().toArray(function(err, data){
		for(var j in data)
		{
			superUsage.names.push(data[j]['name'])
			superUsage.amounts.push(0);
			superUsage.dataIn.push(false);
			superUsage.dimensions.push({});
			superUsage.dependancies.push(data[j]['dependancies']);
			superUsage.sources.push(data[j].source);
		}
        endLoad();
	})
	
	db.collection('var').find({name:'Population'}).toArray(function(err, d){
		var data=d[0].data;
		for(var j in data)
		{
			for(var k=0;k<data[j]/1000;k++)
			{
				people.push({fip:j})
			}
		}
        endLoad();
	})
}





function endLoad()
{
    if(completion<2)
    {
        completion++;
        return;
    }
	
	//startup crossfilter
	cfilter=crossfilter(people);
	all=cfilter.groupAll();
	//iterate through arguments
	for(var variable in argumentsJ)
	{
		//check for null arguments
		if(argumentsJ[variable]=="")
			continue;
		if(variable=='reqvar')
		{
			for(var j in argumentsJ.reqvar)
				reqvars.push(argumentsJ['reqvar'][j]);
		}
		else
		{
			filtervars.push(variable);
		}	
		//fills in missing min/max for quantitative variables
		if(!(argumentsJ[variable] instanceof Array))
		{
			if(!(argumentsJ[variable].hasOwnProperty('min')))
				argumentsJ[variable].min=-Infinity;
			if(!(argumentsJ[variable].hasOwnProperty('max')))
				argumentsJ[variable].max=Infinity;
		}
	}
	recursiveReq(0);
}
module.exports=startup;
