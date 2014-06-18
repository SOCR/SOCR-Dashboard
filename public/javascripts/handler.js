var tiles=[], people=[];
var varData=[], superVarData=[];
var sourceDropDown=[{name: '---',value:'',subitems: []}];
var varUsage={names:[],amounts:[],dimensions:[], sources:[], bounds:[]};
var superUsage={names:[],amounts:[], dimensions:[], dependancies:[], sources:[]};
var stateDimension=0;
var statesJson={};
var cfilter, all;
var supersList=[];
var completion=0;
var gridster;
var chartType, dataset;

$(document).ready(function(){
    $(".gridster ul").gridster({
        widget_margins: [0, 0],
        widget_base_dimensions: [200, 250/3]
    });
	$("text").css({"color":"white"})
    
    gridster = $(".gridster ul").gridster().data('gridster');
    loadData();
})

String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

function findSource(name)
{
	for(var j in sourceDropDown)
	{
		if(sourceDropDown[j].value==name)
			return j;
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
		for(var j in superUsage.names)
		{
			if(superUsage.names[j]==varName)
				return j;
		}
	else	
		for(var j in varUsage.names)
		{
			if(varUsage.names[j]==varName)
				return j;
		}
	
	console.error("ERROR: Invalid dataset name");
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
		$.getJSON('users/'+url+'/'+dataset, function(d){
			var data=d[0].data;
			addData(datatype, dataset, data);
			variables['dimensions'][index]= cfilter.dimension(function (d) {
				return d[dataset];
			});
			if(datatype!='super')
			{
				var min=Number.MAX_VALUE;
				var max=-1*Number.MAX_VALUE;
				for(var j in data)
				{
					if(data[j]>max)
						max=data[j];
					if(data[j]<min)
						min=data[j]
				}
				varUsage.bounds[index][0]=min;
				varUsage.bounds[index][1]=max;
			}
			finishGen(variables['dimensions'][index],chart, index, dataset)
		});
		
	}
} 

function finishGen(dimension, chart, index, dataset)
{
    chart.cDimension=dimension;
    chart.cGroup=chart.cDimension.group().reduce(
		function reduceAdd(p,v){
			return p+1000;
		},
		function reduceRemove(p,v){
			return p-1000;
		},
		function reduceInitial(){
			return 0;
		}
	);
	if(chart.typeName=='hist')
	{
		var bounds=varUsage.bounds[index];
		chart.x(d3.scale.linear().domain(bounds))
		.xUnits(function(){return 50})
		var binWidth=(bounds[1]-bounds[0])/100;
		chart.cGroup=chart.cDimension.group(function(d){return Math.floor(d/binWidth)*binWidth});
	}
	if(chart.typeName=='geo')
	{
		var bounds=varUsage.bounds[index];
		chart.cDimension=stateDimension;
		chart.cGroup=chart.cDimension.group().reduce(
		function reduceAdd(p,v){
				p.sum+=v[dataset];
				p.amount++;
				p.avg=p.sum/p.amount;
				return p;
			},
			function (p,v){
				p.sum-=v[dataset];
				p.amount--;
				p.avg=p.sum/p.amount;
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
            return [1,1,1,1];
            break;
		case 'hist':
			return [1,1,2,1];
			break;
		case 'geo':
			return [1,1,2,1];
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
	if(stateDimension===0)
	{
		stateDimension=cfilter.dimension(function(d){
			return (Math.floor(Number(d.fip.substring(3))/1000))
		})
		
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
			getDimension(dataset, 'base',chart) 
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
		getDimension(dataset, 'base',chart) 
		return chart;
	}
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
		case 'hist':
            gridster.add_widget(dropcode, 2, 3);
            break;
		case 'geo':
            gridster.add_widget(dropcode, 3, 5);
            break;
    }
}

function createTile(chartType, dataset)
{console.log(chartType)
     var tile={"tilenum":tiles.length};
    var dropcode="";
    var sizes=tileSizes(chartType)
    tile.colorKey=Math.floor(360*Math.random())
    tile.color="hsl(" + tile.colorKey + ", 100%, 20%)";
    tile.type=chartType;
    dropcode='<li id="tile'+tile.tilenum+'" data-row="'+sizes[0]+'" data-col="'+sizes[1]+'" data-sizex="'+sizes[2]+'" data-sizey="'+sizes[3]+'">';
    dropcode+='<div id="chart'+tile.tilenum+'"class="widget">'
    dropcode+='<strong>'+titleGen(chartType, dataset)+'</strong></br> <span style="color:'+tile.color+'">.</span>'
    dropcode+='<a class="reset" href="javascript:tiles['+tile.tilenum+'].chart.filterAll();dc.redrawAll();" style="display: none;">reset</a>'
    dropcode+='<div class="clearfix"></div>'
    dropcode+='</div>'
    dropcode+='</li>';
    dropTile(dropcode, chartType);
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
			varUsage.dimensions.push({});
			varUsage.sources.push(data[j].source)
			varUsage.bounds.push([0,0]);
			if(data[j]['super']=='N')
			{
				var index=findSource(data[j].source)
				if(index==-1)
				{
					sourceDropDown.push({name:data[j].source.split("_").join(' ').toProperCase(),value: data[j].source, subitems:[{name:data[j]['name'].split("_").join(' ').toProperCase() ,value:data[j]['name'] }]})
				}
				else
				{
					sourceDropDown[index].subitems.push({name:data[j]['name'].split("_").join(' ').toProperCase() ,value:data[j]['name'] });
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
			superUsage.dimensions.push({});
			superUsage.dependancies.push(data[j]['dependancies']);
			superUsage.sources.push(data[j].source);
			var index=findSource(data[j].source)
			if(index==-1)
			{
				sourceDropDown.push({name:data[j].source.split("_").join(' ').toProperCase(),value: data[j].source, subitems:[{name:data[j]['name'].split("_").join(' ').toProperCase() ,value:data[j]['name'] }]})
			}
			else
			{
				sourceDropDown[index].subitems.push({name:data[j]['name'].split("_").join(' ').toProperCase() ,value:data[j]['name'] });
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
	$('#add').click(function(){
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
			createTile(chartType, dataset);
		}
	})
	$('#genquant').click(function(){
		if(chartType!=null)
		{
			$('#addquant').modal('hide');
			createTile(chartType, dataset);
		}
	})
}