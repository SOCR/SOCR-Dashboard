var tiles=[];
people=[];
var varData=[], superVarData=[];
sourceDropDown=[{name: '---',value:'',subitems: []},{name: 'Custom',value:'Custom',subitems: []}];
 varUsage={names:[],amounts:[],dataIn:[],dimensions:[], sources:[], bounds:[]};
var superUsage={names:[],amounts:[],dataIn:[], dimensions:[], dependancies:[], sources:[]};
var stateDimension=0;
var statesJson=0;
var cfilter, all;
var supersList=[];
var completion=0;
var gridster;
var chartType, dataset;
var tableItems=0;
var removeMode=false;

//document initialization
$(document).ready(function(){

    $(".gridster ul").gridster({
        widget_margins: [0, 0],
        widget_base_dimensions: [200, 250/3],
		max_cols:7
    });
	$("text").css({"color":"white"})
    gridster = $(".gridster ul").gridster().data('gridster');
	$("#splashpage").modal('show');
    loadData();
})


/*
function formatTable()
{
	if(tableItems<4)
	{
		var temp={};
		tableItems++
		$('.addtable').remove();
		$('.tablebody').append('Select Data Source:  <select id="colsource'+tableItems+'" name="colsource'+tableItems+'"></select></br>');
		$('.tablebody').append('Select Data Variable: <select class="tablevar" id="colvar'+tableItems+'" name="colvar'+tableItems+'"></select></br>');
		if(tableItems<2)
			$('.tablebody').append('<div class="fa-stack fa-lg addtable"><i class="fa fa-circle fa-stack-2x"></i><i class="fa fa-inverse fa-stack-1x">+</i></div>');
		
		$.each(sourceDropDown, function(){
			$("<option />")
			.attr("value", this.value)
			.html(this.name)
			.appendTo("#colsource"+tableItems);
			temp[this.value] = this.subitems;
		});
		
		$("#colsource"+tableItems).change(function(){
			var value = $(this).val();
			var key=this.id.substring(9);
			var menu = $("#colvar"+key);
			
			menu.empty();
			$.each(temp[value], function(){
				$("<option />")
				.attr("value", this.value)
				.html(this.name)
				.appendTo(menu);
			});
		}).change();
		$('.addtable').click(function(){
			formatTable();
		});
	}
}*/

function sortDropdown ()
{
	sourceDropDown.sort(function (a,b){return b.name<a.name});
	for(var j in sourceDropDown)
	{
		sourceDropDown[j].subitems.sort(function (a,b){
		if(a.name<b.name)
			return -1;
		else
			return 1;
		});
	}
}

//exports code to CSV file (FROM: EXPORT_CALL)
function exportToCSV() {
	var CSV = "FIPS Code,", title='Dashboard', headers=['fip'];
	for(var j in varUsage.dataIn)
	{
		if(varUsage.dataIn[j])
		{
			title+='+'+varUsage.names[j];
			CSV+=varUsage.names[j]+',';
			headers.push(varUsage.names[j])
		}
	} 
	
	for(var j in superUsage.dataIn)
	{
		if(superUsage.dataIn[j])
		{
			title+='+'+superUsage.names[j];
			CSV+=superUsage.names[j]+',';
			headers.push(superUsage.names[j])
		}
	} 
	title=title.substring(0,50);
	CSV+='\r\n'
	
	//populate file with population data
	cfilter.groupAll().reduce(function(p,v){
		for(var j in headers)
		{
			CSV+=v[headers[j]]+',';
		}
		CSV+='\r\n';
		return p;
	},function(p,v){return p}, function(p,v){return []}).value();
	title+='.csv';
	
	// Data URI
	var CSVData = URL.createObjectURL(new Blob([CSV], { type: 'text/csv' }));
	$('#exportlink')
		.attr({
			'href': CSVData,
			'download': title
		});
}

//Formats string according to Dashboard standards
String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

//iterate and search to find index of source (linear search)
function findSource(name)
{
	for(var j in sourceDropDown)
	{
		if(sourceDropDown[j].value==name)
		{
			return j;
		}
	}
	
	return -1;
}

function populateDropdown()
{
    var temp = {};
    $("#datasource").html("");
    $("#datavar").html("");
    $.each(sourceDropDown, function(){
        $("<option />")
        .attr("value", this.value)
        .html(this.name)
        .appendTo("#datasource");
        temp[this.value] = this.subitems;
    });
    
    $("#datasource").change(function(){
        var value = $(this).val();
        var menu = $("#datavar");
        
        menu.empty();
        $.each(temp[value], function(){
            $("<option />")
            .attr("value", this.value)
            .html(this.name)
            .appendTo(menu);
        });
    }).change();
};

function selectChart(dataset)
{
	var index=findVariable('super', dataset);
	$('#addstart').modal('hide');
	chartType=null;
	
		//quantitative
		if(index==-1)
		{console.log('quant')
			$('#addquant').modal('show');
		}
		
		//qualitative
		else
		{console.log('qual')
			$('#addqual').modal('show');
		}
}

function findVariable (dataClass, varName)
{
	if(dataClass=='super')
	{
		for(var j in superUsage.names)
		{
			if(superUsage.names[j]==varName)
				return j;
		}
	}
	else	
	{
		for(var j in varUsage.names)
		{
			if(varUsage.names[j]==varName)
			{
				return j;
			}
		}
	}
	console.error("ERROR: Invalid dataset name: "+varName);
	return -1;
}



function getDimension(dataset, datatype,chart) 
{
    var index=findVariable (datatype, dataset);
	var url='var';
	var variables=varUsage;
	if(datatype=='super')
	{
		variables=superUsage;
		url='super'
	}
	variables['amounts'][index]+=1;
	if(variables['amounts'][index]>1)
	{
		finishGen(variables['dimensions'][index],chart, index, dataset)
	}
	else
	{
		getData(dataset,function(arg, ind, datast, dataType){
			arg[0]['dimensions'][ind]= cfilter.dimension(function (d) {
				return d[datast];
			});
			
			finishGen(arg[0]['dimensions'][ind],arg[1], ind, datast)
		
		},[variables, chart]);
	}
} 

function getData(datasets, callback, args)
{
	var datasource=superUsage;
	var url='super';
	var dataIndex=findVariable ('super', datasets);
	if(dataIndex<0)
	{
		dataIndex=findVariable ('base', datasets);
		datasource=varUsage;
		url='var'
	}
	if(dataIndex<0)
	{
		console.error("Incorrect dataset: "+datasets)
	}
	else
	{
		if(datasource.dataIn[dataIndex])
		{
			callback(args, dataIndex, datasets, url);
		}
		else
		{
			datasource.dataIn[dataIndex]=true;
			$.getJSON('users/'+url+'/'+datasets, function(d){
				var data=d[0].data;
				addData(url, datasets, data);
				if(url!='super')
				{
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
				}
				callback(args, dataIndex, datasets, url);
			});
		}
	}
}

function finishGen(dimension, chart, index, dataset)
{
    if(chart.typeName!='geo'&&chart.typeName!='scatter')
	{
		chart.cDimension=dimension;
		chart.cGroup=chart.cDimension.group().reduce(
			function reduceAdd(p,v){
				if(v[dataset]!=-999)
					return p+1000;
				return p;
			},
			function reduceRemove(p,v){
				if(v[dataset]!=-999)
					return p-1000;
				return p;
			},
			function reduceInitial(){
				return 0;
			}
		);
	}
	if(chart.typeName=='hist')
	{
		var bounds=varUsage.bounds[index];
		chart.x(d3.scale.linear().domain(bounds))
		.xUnits(function(){return 50})
		var binWidth=(bounds[1]-bounds[0])/100;
		chart.cGroup=chart.cDimension.group(function(d){return Math.floor(d/binWidth)*binWidth}).reduce(
			function reduceAdd(p,v){
				if(v[dataset]!=-999)
					return p+1;
				return p;
			},
			function reduceRemove(p,v){
				if(v[dataset]!=-999)
					return p-1;
				return p;
			},
			function reduceInitial(){
				return 0;
			}
		);
	}
	else if(chart.typeName=='box')
	{   var indexDependant=findVariable('base',chart.yDataset);
		var bounds=varUsage.bounds[indexDependant];
		var dist=bounds[1]-bounds[0];
		chart.y(d3.scale.linear().domain([bounds[0]-dist*.05,bounds[1]+dist*.05]))
		chart.cGroup=chart.cDimension.group().reduce(
			function(p,v) {
				if(v[chart.yDataset]!=-999&&typeof v[chart.yDataset]!='undefined')
					p.push(+v[chart.yDataset]);
				return p;
			},
			function(p,v) {
				if(v[chart.yDataset]!=-999&&typeof v[chart.yDataset]!='undefined')
					p.splice(p.indexOf(v[chart.yDataset]), 1);
				return p;
			},
			function() {
				return [];
			}
		);
	}
	else if(chart.typeName=='bubble')
	{
		var ybounds=varUsage.bounds[findVariable('base',chart.otherData[2])];
		var xbounds=varUsage.bounds[findVariable('base',chart.otherData[1])];
		var radiusbounds=varUsage.bounds[findVariable('base',chart.otherData[3])];
		var colorbounds=varUsage.bounds[findVariable('base',chart.otherData[4])];
		chart.y(d3.scale.linear().domain(ybounds))
		chart.x(d3.scale.linear().domain([xbounds[0]*.9,xbounds[1]*100]))
		.xAxisPadding((xbounds[1]-xbounds[0])*.01)
		.yAxisPadding((ybounds[1]-ybounds[0])*.01)
		chart.r(d3.scale.linear().domain(radiusbounds))
		chart.cGroup=chart.cDimension.group().reduce(
			function(p,v) {
				if(v[chart.otherData[1]]!=-999&&typeof v[chart.otherData[1]]!='undefined')
				{
					p.xvalSum+=v[chart.otherData[1]]
					p.yvalSum+=v[chart.otherData[2]]
					p.radiusSum+=v[chart.otherData[3]]
					p.colorSum+=v[chart.otherData[4]]
					p.total++;
					if(p.total!=0)
					{
						p.xvalAvg=p.xvalSum/p.total
						p.yvalAvg=p.yvalSum/p.total
						p.radiusAvg=p.radiusSum/p.total
						p.colorAvg=p.colorSum/p.total
					}
					else
					{
						p.xvalAvg=0;
						p.yvalAvg=0;
						p.radiusAvg=0;
						p.colorAvg=0;
					}
					
				}
				return  p;
			},
			function(p,v) {
				if(v[chart.otherData[1]]!=-999&&typeof v[chart.otherData[1]]!='undefined')
				{
					p.xvalSum-=v[chart.otherData[1]]
					p.yvalSum-=v[chart.otherData[2]]
					p.radiusSum-=v[chart.otherData[3]]
					p.colorSum-=v[chart.otherData[4]]
					p.total--;
					if(p.total!=0)
					{
						p.xvalAvg=p.xvalSum/p.total
						p.yvalAvg=p.yvalSum/p.total
						p.radiusAvg=p.radiusSum/p.total
						p.colorAvg=p.colorSum/p.total
					}
					else
					{
						p.xvalAvg=0;
						p.yvalAvg=0;
						p.radiusAvg=0;
						p.colorAvg=0;
					}
				}
				return p;
			},
			function() {
				return {xvalSum:0,yvalSum:0,radiusSum:0,colorSum:0,total:0, xvalAvg:0,yvalAvg:0,radiusAvg:0,colorAvg:0};
			}
		);
		chart
			.dimension(chart.cDimension) // set dimension
			.group(chart.cGroup) // set group
		chart.keyAccessor(function(p){return p.value['xvalAvg']})
			.valueAccessor(function(p){return p.value['yvalAvg']})
			.radiusValueAccessor(function(p){return p.value['radiusAvg']})
			.colorAccessor(function(d){return d.value['colorAvg']})
		chart.calculateColorDomain()
		chart.on("preRedraw", function(c){
			c.calculateColorDomain();
		});
	}
	else if(chart.typeName=='scatter')
	{
		var ybounds=varUsage.bounds[findVariable('base',chart.otherData[1])];
		var xbounds=varUsage.bounds[findVariable('base',chart.otherData[0])];
		var colorbounds=varUsage.bounds[findVariable('base',chart.otherData[2])];
		chart.y(d3.scale.linear().domain(ybounds))
		chart.x(d3.scale.linear().domain([xbounds[0]*.9,xbounds[1]*100]))
		.xAxisPadding((xbounds[1]-xbounds[0])*.01)
		.yAxisPadding((ybounds[1]-ybounds[0])*.01)
		chart.r(d3.scale.linear().domain([0,1]))
		chart.cDimension=stateDimension;
		chart.cGroup=chart.cDimension.group().reduce(
			function(p,v) {
				if(v[chart.otherData[1]]!=-999&&typeof v[chart.otherData[1]]!='undefined')
				{
					p.xvalSum+=v[chart.otherData[0]]
					p.yvalSum+=v[chart.otherData[1]]
					p.colorSum+=v[chart.otherData[2]]
					p.total++;
					if(p.total!=0)
					{
						p.xvalAvg=p.xvalSum/p.total
						p.yvalAvg=p.yvalSum/p.total
						p.colorAvg=p.colorSum/p.total
					}
					else
					{
						p.xvalAvg=0;
						p.yvalAvg=0;
						p.radiusAvg=0;
						p.colorAvg=0;
					}
					
				}
				return p;
			},
			function(p,v) {
				if(v[chart.otherData[1]]!=-999&&typeof v[chart.otherData[1]]!='undefined')
				{
					p.xvalSum-=v[chart.otherData[0]]
					p.yvalSum-=v[chart.otherData[1]]
					p.colorSum-=v[chart.otherData[2]]
					p.total--;
					if(p.total!=0)
					{
						p.xvalAvg=p.xvalSum/p.total
						p.yvalAvg=p.yvalSum/p.total
						p.colorAvg=p.colorSum/p.total
					}
					else
					{
						p.xvalAvg=0;
						p.yvalAvg=0;
						p.colorAvg=0;
					}
					
				}
				return p;
			},
			function() {
				return {xvalSum:0,yvalSum:0,colorSum:0,total:0, xvalAvg:0,yvalAvg:0,colorAvg:0};
			}
		);
		chart
			.dimension(chart.cDimension) // set dimension
			.group(chart.cGroup) // set group
		chart.keyAccessor(function(p){return p.value['xvalAvg']})
			.valueAccessor(function(p){
				var t=p.value['yvalAvg'];
				return(t)
			})
			.radiusValueAccessor(function(p){return .1})
			.colorAccessor(function(d){return d.value['colorAvg']})
		chart.calculateColorDomain()
		chart.on("preRedraw", function(c){
			c.calculateColorDomain();
		});
	}
	else if(chart.typeName=='geo')
	{
		var bounds=varUsage.bounds[index];
		chart.cDimension=stateDimension;
		chart.cGroup=chart.cDimension.group().reduce(
		function reduceAdd(p,v){
				if(v[dataset]!=-999)
				{
					p.sum+=v[dataset];
					p.amount++;
					p.avg=p.sum/p.amount;
				}
				return p;
			},
			function (p,v){
				if(v[dataset]!=-999)
				{
					p.sum-=v[dataset];
					p.amount--;
					p.avg=p.sum/p.amount;
				}
				return p;
			},
			function (){
				return {sum:0,amount:0,avg:0}
			}
		)
		chart
			.valueAccessor(function (p) {
				return p.value.avg;
			})
			.colorDomain(bounds)
	}
	chart
        .dimension(chart.cDimension) // set dimension
        .group(chart.cGroup) // set group
    dc.renderAll();
	
}


function addData(datatype, dataset, data)
{
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
			people[person][dataset]=superUsage['dependancies'][findVariable (datatype, dataset)][index];
		}
		else
		{
			people[person][dataset]=data[fipcode];
		}
		
	} 
}


function tileSizes(t)
{
    switch(t)
    {
        case 'pie':
        case 'row':
        case 'donut':
        case 'number':
            return [1,1,1,1];
            break;
		case 'hist':
		case 'box':
			return [1,1,2,1];
			break;
		case 'geo':
			return [1,1,2,1];
			break;
		case 'list':
			return [1,1,tableItems+2,1];
			break;
		case 'bubble':
		case 'scatter':
			return [1,1,3,1];
			break;
    }
}

function titleGen(chart, data)
{
    switch(chart)
    {
        case 'pie':
            return 'Pie Chart of '+data.split("_").join(' ').toProperCase();
            break;
		case 'number':
            return '';
            break;
        case 'row':
            return 'Bar Graph of '+data.split("_").join(' ').toProperCase();
            break;
        case 'donut':
            return 'Donut Chart of '+data.split("_").join(' ').toProperCase();
            break;
        case 'hist':
            return 'Histogram of '+data.split("_").join(' ').toProperCase();
            break;
        case 'geo':
            return 'Theme Chart of '+data.split("_").join(' ').toProperCase();
            break;
        case 'box':
            return 'Box Plots of '+data[0].split("_").join(' ').toProperCase()+' vs. '+data[1].split("_").join(' ').toProperCase();
			break;
        case 'list':
            return 'List of Filtered Population Data';
            break;
        case 'bubble':
            return 'Bubble Chart Comparing '+data[0].split("_").join(' ').toProperCase();
			break;
        case 'scatter':
            return 'Scatterplot of '+data[0].split("_").join(' ').toProperCase()+' vs '+data[1].split("_").join(' ').toProperCase()+'<br>Color: '+data[2].split("_").join(' ').toProperCase();
			break;
    }
}

function pieGen(dataset, idcode, colorKey)
{
    var chart = dc.pieChart('#'+idcode);
	chart.typeName='pie';
    chart
        .width(180) // (optional) define chart width, :default = 200
        .height(180) // (optional) define chart height, :default = 200
        .radius(80) // define pie radius
        .ordinalColors(colorKey)
        .label(function (d) {
            if (chart.hasFilter() && !chart.hasFilter(d.key))
                return d.key + "(0%)";
            return d.key.split("_").join(' ') + "(" + Math.floor(d.value / all.value()/10) + "%)";
        });
	getDimension(dataset, 'super',chart) 
	return chart;
}

function numberGen(dataset, idcode, colorKey)
{
	$('#'+idcode).append('<div class="div-count"></div>')
	$('#'+idcode).css({'color':colorKey[0]})
    var chart = dc.dataCount('#'+idcode);
	chart.dimension(cfilter).group(all);
	dc.renderAll();
	return chart;
}

function barGen(dataset, idcode, colorKey)
{
    var chart = dc.rowChart('#'+idcode);
	chart.typeName='bar';
    chart.width(180)
        .height(180)
        .ordinalColors(colorKey)
        .margins({top: 20, left: 10, right: 10, bottom: 20})
        .label(function (d) {
            return d.key.split("_").join(' ');
        })
        // title sets the row text
        .title(function (d) {
            return d.value;
        })
        .elasticX(true)
        .xAxis().tickFormat(function(d){return "";});
	getDimension(dataset, 'super',chart) 
	return chart;
}

function donutGen(dataset, idcode, colorKey)
{
    var chart = dc.pieChart('#'+idcode);
	chart.typeName='donut';
    chart
        .width(180) // (optional) define chart width, :default = 200
        .height(180) // (optional) define chart height, :default = 200
        .radius(80) // define pie radius
        .innerRadius(30)
        .ordinalColors(colorKey)
        .label(function (d) {
            if (chart.hasFilter() && !chart.hasFilter(d.key))
                return d.key + "(0%)";
            return d.key.split("_").join(' ') + "(" + Math.floor(d.value / all.value()/10) + "%)";
        });
	getDimension(dataset, 'super',chart) 
	return chart;
}

function histGen(dataset, idcode, colorKey)
{
	var chart = dc.barChart('#'+idcode);
	chart.typeName='hist';
    chart
        .width(180*2) // (optional) define chart width, :default = 200
        .height(180) // (optional) define chart height, :default = 200
        .ordinalColors(colorKey)
        .label(function (d) {
            if (chart.hasFilter() && !chart.hasFilter(d.key))
                return d.key + "(0%)";
            return d.key + "(" + Math.floor(d.value / all.value()/10) + "%)";
        })
		.elasticY(true)
		.x(d3.scale.linear().domain([0,5000000]))
		.round(dc.round.floor)
		.alwaysUseRounding(true);
	getDimension(dataset, 'base',chart) 
	return chart;
}

function geoGen(dataset, idcode, colorKey)
{
	if(statesJson===0)
	{
		
		$.getJSON('geojson/statesSmall.json', function(d){
			statesJson=d;
			var chart = dc.geoChoroplethChart('#'+idcode);
			chart.typeName='geo';
			chart
				.width(180*3+20) // (optional) define chart width, :default = 200
				.height(200/3*5+30) // (optional) define chart height, :default = 200
				.projection(d3.geo.albersUsa().scale(700).translate([300, 180]))
				.colors(d3.scale.quantize().range(colorKey))
                .colorCalculator(function (d) { return d ? chart.colors()(d) : '#ccc'; })
				.title(function (d) {
					return d.value;
				})
				.overlayGeoJson(statesJson.features, "state", function (d) {
					return String(Number(d.id));
				});
				getData(dataset,function(arg, ind, datast, dataType){
					finishGen(arg[0]['dimensions'][ind],arg[1], ind, datast)
				},[varUsage, chart]);
			return chart;
		})
	}
	else
	{
		var chart = dc.geoChoroplethChart('#'+idcode);
		chart.typeName='geo';
		chart
				.width(180*3+20) // (optional) define chart width, :default = 200
				.height(200/3*5+30) // (optional) define chart height, :default = 200
				.projection(d3.geo.albersUsa().scale(700).translate([300, 180]))
				.colors(d3.scale.quantize().range(colorKey))
				.title(function (d) {
					return d.value;
				})
				.overlayGeoJson(statesJson.features, "state", function (d) {
					return String(Number(d.id));
				});
				getData(dataset,function(arg, ind, datast, dataType){
					finishGen(arg[0]['dimensions'][ind],arg[1], ind, datast)
				},[varUsage, chart]);
		return chart;
	}
}


function boxGen(dataset, idcode, colorKey)
{
	var chart = dc.boxPlot('#'+idcode);
	chart.typeName='box';
    chart
        .width(290*2) // (optional) define chart width, :default = 200
        .height(480) // (optional) define chart height, :default = 200
        .label(function (d) {
            return 'AAA';
        })
		.margins({top:10,bottom:20,left:0,right:0})
		.ordinalColors(colorKey)
		.tickFormat(d3.format(".1f"))
		.elasticX(true)
	var callBox=function(arg, ind, datast, dataType)
	{
		getDimension(arg[0], 'base',arg[1]) 
	}
	var args=[dataset[0], chart];
	chart.yDataset=dataset[1];
	getData(dataset[1],callBox,args);
	return chart;
}
function listGen(dataset, idcode, colorKey)
{
	var chart = dc.dataTable('#'+idcode);
	chart.typeName='list';
    chart
        .size(tableItems+2)
	var listCallback=function(arg, ind, datast, dataType)
	{
		arg[1]++;
		if(arg[1]<arg[2].length)
		{
			getData(arg[2][arg[1]],arg[0], arg);
		}
		else
		{
			var functions=[];
			for(var j in arg[2])
			{
				functions.push(arg[2][j]);
			}
			arg[3].columns(functions);
			dc.renderAll();
		}
	}
	var args=[listCallback, 0,dataset, chart]
	
	getData(dataset[0],listCallback,args);
	return chart;
}

function bubbleGen(dataset, idcode, colorKey)
{
	var chart = dc.bubbleChart('#'+idcode);
	chart.typeName='bubble';
    chart
        .width(390*2) // (optional) define chart width, :default = 200
        .height(350) // (optional) define chart height, :default = 200
        .label(function (d) {
            return d.key;
        })
		.margins({top:10,bottom:20,left:0,right:0})
		.colors(colorKey)
		.elasticX(true)
		.elasticY(true)
		.elasticRadius(true)
		.maxBubbleRelativeSize(.1)
	var callBubble=function(arg, ind, datast, dataType)
	{
		arg[2]++;
		if(arg[2]>=arg[0].length)
		{
			getDimension(arg[0][0], 'base',arg[1]) 
		}
		else
		{
			getData(arg[0][arg[2]],callBubble,arg);
		}
	}
	var args=[dataset, chart, 0];
	chart.otherData=dataset;
	getData(dataset[0],callBubble,args);
	return chart;
}

function scatterGen(dataset, idcode, colorKey)
{
	var chart = dc.bubbleChart('#'+idcode);
	chart.typeName='scatter';
    chart
        .width(380*2) // (optional) define chart width, :default = 200
        .height(370) // (optional) define chart height, :default = 200
		.margins({top:10,bottom:45,left:25,right:0})
		.colors(colorKey)
		.elasticX(true)
		.xAxisLabel(dataset[0].split("_").join(' ').toProperCase(), 23)
		.yAxisLabel(dataset[1].split("_").join(' ').toProperCase())
		.elasticY(true)
		.maxBubbleRelativeSize(.1)
		.label(function(d){return '';})
	var callScatter=function(arg, ind, datast, dataType)
	{
		arg[2]++;
		if(arg[2]>=arg[0].length)
		{
			finishGen(0, arg[1], ind, arg[0][0])
		}
		else
		{
			getData(arg[0][arg[2]],callScatter,arg);
		}
	}
	var args=[dataset, chart, 0];
	chart.otherData=dataset;
	getData(dataset[0],callScatter,args);
	return chart;
}

function chartGen(chartType, dataset, idcode, colorKey)
{   
	var colorList=[];
    for(var j=0;j<9;j++)
        colorList.push(tinycolor("hsl(" + colorKey + ', 100%, '+(45+j*5)+'%)').toHexString());
    switch(chartType)
    {
        case 'pie':
            return pieGen(dataset, idcode, colorList)
            break;
		case 'number':
            return numberGen(dataset, idcode, colorList)
            break;
        case 'row':
            return barGen(dataset, idcode, colorList)
			break;
        case 'donut':
            return donutGen(dataset, idcode, colorList)
			break;
        case 'hist':
            return histGen(dataset, idcode, colorList)
			break;
        case 'geo':
			colorList=[];
			for(var j=0;j<=100;j++)
				colorList.push(tinycolor("hsl(" + colorKey + ', 100%, '+(j)+'%)').toHexString());
            return geoGen(dataset, idcode, colorList)
			break;
        case 'box':
            return boxGen(dataset, idcode, colorList)
			break;
        case 'list':
            return listGen(dataset, idcode, colorList)
			break;
        case 'bubble':
			colorList=[];
			for(var j=2;j<=17;j++)
				colorList.push(tinycolor("hsl(" + colorKey + ', 100%, '+(j*5)+'%)').toHexString());
            return bubbleGen(dataset, idcode, colorList)
        case 'scatter':
			colorList=[];
			for(var j=2;j<=17;j++)
				colorList.push(tinycolor("hsl(" + colorKey + ', 100%, '+(j*5)+'%)').toHexString());
            return scatterGen(dataset, idcode, colorList)
			break;
    }
}

function dropTile(dropcode, chartType)
{
    switch(chartType)
    {
        case 'pie':
        case 'row':
        case 'donut':
            gridster.add_widget(dropcode, 1, 3);
            break;
        case 'number':
            gridster.add_widget(dropcode, 1, 2);
            break;
		case 'hist':
            gridster.add_widget(dropcode, 2, 3);
            break;
		case 'box':
            gridster.add_widget(dropcode, 3, 7);
            break;
		case 'geo':
            gridster.add_widget(dropcode, 3, 5);
            break;
		case 'list':
            gridster.add_widget(dropcode, tableItems+2, 5);
            break;
		case 'bubble':
            gridster.add_widget(dropcode, 4, 5);
            break;
		case 'scatter':
            gridster.add_widget(dropcode, 4, 5);
            break;
    }
}

function createTile(chartType, dataset)
{
    var tile={"tilenum":tiles.length};
    var dropcode="";
    var sizes=tileSizes(chartType)
	$.each($('.chart-button'), function(){
			$(this).css({"background-image":"-webkit-linear-gradient(top, #757c82, #757882)"})
	})
    tile.colorKey=Math.floor(360*Math.random())
    tile.color="hsl(" + tile.colorKey + ", 100%, 20%)";
    tile.type=chartType;
    dropcode='<li id="tile'+tile.tilenum+'" class="tile" data-row="'+sizes[0]+'" data-col="'+sizes[1]+'" data-sizex="'+sizes[2]+'" data-sizey="'+sizes[3]+'">';
    dropcode+='<div id="chart'+tile.tilenum+'"class="widget '+chartType+'">'
    dropcode+='<strong>'+titleGen(chartType, dataset)+'</strong></br> <span style="color:'+tile.color+'">.</span>'
    dropcode+='<a class="reset" href="javascript:tiles['+tile.tilenum+'].chart.filterAll();dc.redrawAll();" style="display: none;">reset</a>'
    dropcode+='<div class="clearfix"></div>'
    dropcode+='</div>'
    dropcode+='</li>';
    dropTile(dropcode, chartType);
	$('.tile').click(function(){
		if(removeMode)
		{
			gridster.remove_widget($(this));
		}
	});
    $('#tile'+tile.tilenum).css({'background-color':tile.color})
    tile.chart=chartGen(chartType, dataset, 'chart'+tile.tilenum, tile.colorKey)
    tiles.push(tile)
}
function loadData()
{
    var htmlcode="";
    $.getJSON('users/all', function(data){
		for(var j in data)
		{
			varUsage.names.push(data[j]['name'])
			varUsage.amounts.push(0);
			varUsage.dataIn.push(false);
			varUsage.dimensions.push({});
			varUsage.sources.push(data[j].source)
			varUsage.bounds.push([0,0]);
			if(data[j]['super']=='N')
			{
				var index=findSource(data[j].source)
				if(index==-1)
				{
					sourceDropDown.push({name:data[j].source.split("_").join(' ').toProperCase(),value: data[j].source, subitems:[{name:data[j]['name'].split("_").join(' ').toProperCase() ,type:'quant',value:data[j]['name'] }]})
				}
				else
				{
					sourceDropDown[index].subitems.push({name:data[j]['name'].split("_").join(' ').toProperCase() ,type:'quant',value:data[j]['name'] });
				}
			}
		}
        endLoad();
    })
    $.getJSON('users/allsuper', function(data){
		//superUsage={names:[],amounts:[], dimensions:[], dependancies:[]};
		for(var j in data)
		{
			superUsage.names.push(data[j]['name'])
			superUsage.amounts.push(0);
			superUsage.dataIn.push(false);
			superUsage.dimensions.push({});
			superUsage.dependancies.push(data[j]['dependancies']);
			superUsage.sources.push(data[j].source);
			var index=findSource(data[j].source)
			if(index==-1)
			{
				sourceDropDown.push({name:data[j].source.split("_").join(' ').toProperCase(),value: data[j].source, subitems:[{name:data[j]['name'].split("_").join(' ').toProperCase(),type:'qual' ,value:data[j]['name'] }]})
			}
			else
			{
				sourceDropDown[index].subitems.push({name:data[j]['name'].split("_").join(' ').toProperCase() ,type:'qual',value:data[j]['name'] });
			}
		}
        endLoad();
    })
    $.getJSON('users/var/Population', function(d){
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
	cfilter=crossfilter(people);
	all=cfilter.groupAll();
	stateDimension=cfilter.dimension(function(d){
		return (Math.floor(Number(d.fip.substring(3))/1000))
	})
	$('#add').click(function(){
		sortDropdown();
		populateDropdown();
	})
	$('#chartpage').click(function(){
		var val=$('#datavar').val();
		dataset=val;
		if(val!=null)
		selectChart(val)
	})
	$('.chart-button').click(function(){
		chartType=$(this).attr("id")
	})
	$('#genqual').click(function(){
		if(chartType!=null)
		{
			$('#addqual').modal('hide');
			switch(chartType)
			{
				case 'box':
					$('#boxconfig').modal('show');
					var temp={};
					$("#boxsource").html("");
					$("#boxvar").html("");
					$.each(sourceDropDown, function(){
						{
							$("<option />")
							.attr("value", this.value)
							.html(this.name)
							.appendTo("#boxsource");
							temp[this.value] = this.subitems;
						}
					});
					
					$("#boxsource").change(function(){
						var value = $(this).val();
						var menu = $("#boxvar");
						
						menu.empty();
						$.each(temp[value], function(){
							if(this.type=='quant')
							{
								$("<option />")
								.attr("value", this.value)
								.html(this.name)
								.appendTo(menu);
							}
						});
					}).change();
					break;
				case 'bubble':
					$('#bubbleconfig').modal('show');
					var xtemp={},ytemp={},rtemp={},ctemp={};
					$("#xbubblesource").html("");
					$("#xbubblevar").html("");
					$.each(sourceDropDown, function(){
						{
							$("<option />")
							.attr("value", this.value)
							.html(this.name)
							.appendTo("#xbubblesource");
							xtemp[this.value] = this.subitems;
						}
					});
					
					$("#xbubblesource").change(function(){
						var value = $(this).val();
						var menu = $("#xbubblevar");
						
						menu.empty();
						$.each(xtemp[value], function(){
							if(this.type=='quant')
							{
								$("<option />")
								.attr("value", this.value)
								.html(this.name)
								.appendTo(menu);
							}
						});
					}).change();
					$("#ybubblesource").html("");
					$("#ybubblevar").html("");
					$.each(sourceDropDown, function(){
						{
							$("<option />")
							.attr("value", this.value)
							.html(this.name)
							.appendTo("#ybubblesource");
							ytemp[this.value] = this.subitems;
						}
					});
					
					$("#ybubblesource").change(function(){
						var value = $(this).val();
						var menu = $("#ybubblevar");
						
						menu.empty();
						$.each(ytemp[value], function(){
							if(this.type=='quant')
							{
								$("<option />")
								.attr("value", this.value)
								.html(this.name)
								.appendTo(menu);
							}
						});
					}).change();
					$("#rbubblesource").html("");
					$("#rbubblevar").html("");
					$.each(sourceDropDown, function(){
						{
							$("<option />")
							.attr("value", this.value)
							.html(this.name)
							.appendTo("#rbubblesource");
							rtemp[this.value] = this.subitems;
						}
					});
					
					$("#rbubblesource").change(function(){
						var value = $(this).val();
						var menu = $("#rbubblevar");
						
						menu.empty();
						$.each(rtemp[value], function(){
							if(this.type=='quant')
							{
								$("<option />")
								.attr("value", this.value)
								.html(this.name)
								.appendTo(menu);
							}
						});
					}).change();
					$("#cbubblesource").html("");
					$("#cbubblevar").html("");
					$.each(sourceDropDown, function(){
						{
							$("<option />")
							.attr("value", this.value)
							.html(this.name)
							.appendTo("#cbubblesource");
							ctemp[this.value] = this.subitems;
						}
					});
					
					$("#cbubblesource").change(function(){
						var value = $(this).val();
						var menu = $("#cbubblevar");
						
						menu.empty();
						$.each(ctemp[value], function(){
							if(this.type=='quant')
							{
								$("<option />")
								.attr("value", this.value)
								.html(this.name)
								.appendTo(menu);
							}
						});
					}).change();
					break;
				default:
					createTile(chartType, dataset);
					break;
			}
		}
	})
	$('#genquant').click(function(){
		if(chartType!=null)
		{
			$('#addquant').modal('hide');
			switch(chartType)
			{
				case 'table':
					tableItems=0;
					var temp={};
					$('.tablebody').html('');
					$('.tablebody').append('Select Data Source: <select id="colsource'+0+'" name="colsource'+0+'"></select></br>');
					$('.tablebody').append('Select Data Variable: <select class="tablevar" id="colvar'+tableItems+'" name="colvar'+tableItems+'"></select></br>');
					$('.tablebody').append('<div class="fa-stack fa-lg addtable"><i class="fa fa-circle fa-stack-2x"></i><i class="fa fa-inverse fa-stack-1x">+</i></div>');
					$('#tableconfig').modal('show');
					$.each(sourceDropDown, function(){
						$("<option />")
						.attr("value", this.value)
						.html(this.name)
						.appendTo("#colsource"+tableItems);
						temp[this.value] = this.subitems;
					});
					
					$("#colsource"+tableItems).change(function(){
						var value = $(this).val();
						var key=this.id.substring(9);
						var menu = $("#colvar"+key);
						menu.empty();
						$.each(temp[value], function(){
							$("<option />")
							.attr("value", this.value)
							.html(this.name)
							.appendTo(menu);
						});
					}).change();
					$('.addtable').click(function(){
						formatTable();
					})
					break;
				case 'scatter':
					$('#scatterconfig').modal('show');
					var ytemp={},ctemp={};
					$("#yscattersource").html("");
					$("#yscattervar").html("");
					$.each(sourceDropDown, function(){
						{
							$("<option />")
							.attr("value", this.value)
							.html(this.name)
							.appendTo("#yscattersource");
							ytemp[this.value] = this.subitems;
						}
					});
					
					$("#yscattersource").change(function(){
						var value = $(this).val();
						var menu = $("#yscattervar");
						
						menu.empty();
						$.each(ytemp[value], function(){
							if(this.type=='quant')
							{
								$("<option />")
								.attr("value", this.value)
								.html(this.name)
								.appendTo(menu);
							}
						});
					}).change();
					$("#cscattersource").html("");
					$("#cscattervar").html("");
					$.each(sourceDropDown, function(){
						{
							$("<option />")
							.attr("value", this.value)
							.html(this.name)
							.appendTo("#cscattersource");
							ctemp[this.value] = this.subitems;
						}
					});
					
					$("#cscattersource").change(function(){
						var value = $(this).val();
						var menu = $("#cscattervar");
						
						menu.empty();
						$.each(ctemp[value], function(){
							if(this.type=='quant')
							{
								$("<option />")
								.attr("value", this.value)
								.html(this.name)
								.appendTo(menu);
							}
						});
					}).change();
					break;
				default:
					createTile(chartType, dataset);
					break;
			}
		}
	})
	$('#gentable').click(function(){
		var filled=true;
		$(".tablevar").each(function(){
			if($(this).val() ==null)
				filled=false;
		});
		if(filled)
		{
			var options=[];
			options.push(dataset);
			$(".tablevar").each(function(){
				options.push($(this).val());
			});
			createTile('list', options);
		}
			
	});
	$('#genbox').click(function(){
		if($('#boxvar').val()!=null)
		{
			$('#boxconfig').modal('hide')
			createTile('box', [dataset, $('#boxvar').val()]);
		}
	});
	$('#genbubble').click(function(){
		if($('#xbubblevar').val()!=null&&$('#ybubblevar').val()!=null&&$('#rbubblevar').val()!=null&&$('#cbubblevar').val()!=null)
		{
			$('#bubbleconfig').modal('hide')
			createTile('bubble', [dataset, $('#xbubblevar').val(), $('#ybubblevar').val(), $('#rbubblevar').val(), $('#cbubblevar').val()]);
		}
	});
	$('#genscatter').click(function(){
		if($('#yscattervar').val()!=null&&$('#cscattervar').val()!=null)
		{
			$('#scatterconfig').modal('hide')
			createTile('scatter', [dataset, $('#yscattervar').val(),  $('#cscattervar').val()]);
		}
	});
	
	$('#exportlink').click(function(){
		exportToCSV.apply();
	});
	$('#remove').click(function(){
		if(removeMode)
		{
			removeMode=false;
			$('#remove').css({color:'#fb308d','background-color':'#db004d'})
		}
		else
		{
			removeMode=true;
			$('#remove').css({color:'#db004d','background-color':'#fb308d'})
		}
	});
	$('.chart-button').click(function(){
		$.each($('.chart-button'), function(){
			$(this).css({"background-image":"-webkit-linear-gradient(top, #757c82, #757882)"})
		})
		$(this).css({"background-image":"-webkit-linear-gradient(top, #222222, #777777)"})
	})
	sortDropdown();
}