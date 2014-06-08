var dataValues=[], tiles=[];
var varData={};
var cfilter, all;
var supersList=[];
var completion=0;
var gridster;

String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

$(document).ready(function(){
    $(".gridster ul").gridster({
        widget_margins: [0, 0],
        widget_base_dimensions: [200, 250/3]
    });
	$("text").css({"color":"white"})
    
    gridster = $(".gridster ul").gridster().data('gridster');
    loadData();
})

function tileSizes(t)
{
    switch(t)
    {
        case 'pie':
        case 'bar':
        case 'donut':
            return [1,1,1,1];
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
        case 'bar':
            return 'Bar Graph of '+data.split("_").join(' ').toProperCase();
            break;
        case 'donut':
            return 'Donut Chart of '+data.split("_").join(' ').toProperCase();
            break;
    }
}

function getDimension(dataset) 
{
    return cfilter.dimension(function (d) {
        return d[dataset];
    });
}

function pieGen(dataset, idcode, colorKey)
{
    var chart = dc.pieChart('#'+idcode);
    chart.cDimension=getDimension(dataset)
    chart.cGroup=chart.cDimension.group();
    chart
        .width(180) // (optional) define chart width, :default = 200
        .height(180) // (optional) define chart height, :default = 200
        .radius(80) // define pie radius
        .dimension(chart.cDimension) // set dimension
        .group(chart.cGroup) // set group
        .ordinalColors(colorKey)
        .label(function (d) {
            if (chart.hasFilter() && !chart.hasFilter(d.key))
                return d.key + "(0%)";
            return d.key + "(" + Math.floor(d.value / all.value() * 100) + "%)";
        });
    dc.renderAll();
    return chart;
}

function barGen(dataset, idcode, colorKey)
{
    var chart = dc.barChart('#'+idcode);
    chart.cDimension=getDimension(dataset)
    chart.cGroup=chart.cDimension.group();
    chart.width(420)
        .height(180)
        .margins({top: 10, right: 50, bottom: 30, left: 40})
        .dimension(chart.cDimension)
        .group(chart.cGroup)
        .elasticY(true)
        // (optional) whether bar should be center to its x value. Not needed for ordinal chart, :default=false
        .centerBar(true)
        // (optional) set gap between bars manually in px, :default=2
        .gap(1)
        // (optional) set filter brush rounding
        .round(dc.round.floor)
        .alwaysUseRounding(true)
        .x(d3.scale.linear().domain([1960, 2020]))
        .renderHorizontalGridLines(true)
        // customize the filter displayed in the control span
        .filterPrinter(function (filters) {
            var filter = filters[0], s = "";
            s += filter[0] + " -> " + (filter[1]) ;
            return s;
        });
    dc.renderAll();
    return chart;
}

function donutGen(dataset, idcode, colorKey)
{
    var chart = dc.pieChart('#'+idcode);
    chart.cDimension=getDimension(dataset)
    chart.cGroup=chart.cDimension.group();
    chart
        .width(180) // (optional) define chart width, :default = 200
        .height(180) // (optional) define chart height, :default = 200
        .radius(80) // define pie radius
        .innerRadius(30)
        .dimension(chart.cDimension) // set dimension
        .group(chart.cGroup) // set group
        .ordinalColors(colorKey)
        .label(function (d) {
            if (chart.hasFilter() && !chart.hasFilter(d.key))
                return d.key + "(0%)";
            return d.key + "(" + Math.floor(d.value / all.value() * 100) + "%)";
        });
    dc.renderAll();
    return chart;
}

function chartGen(chartType, dataset, idcode, colorKey)
{   var colorList=[];
    for(var j=0;j<9;j++)
        colorList.push(tinycolor("hsl(" + colorKey + ', 100%, '+(45+j*5)+'%)').toHexString());
    switch(chartType)
    {
        case 'pie':
            return pieGen(dataset, idcode, colorList)
            break;
        case 'bar':
            return barGen(dataset, idcode, colorList)
        case 'donut':
            return donutGen(dataset, idcode, colorList)
    }
}

function dropTile(dropcode, chartType)
{
    switch(chartType)
    {
        case 'pie':
        case 'bar':
        case 'donut':
            gridster.add_widget(dropcode, 1, 3);
            break;
    }
}

function createTile(chartType, dataset)
{
    var tile={"tilenum":tiles.length};
    var dropcode="";
    var sizes=tileSizes(chartType)
    tile.colorKey=Math.floor(360*Math.random())
    tile.color="hsl(" + tile.colorKey + ", 100%, 40%)";
    tile.type=chartType;
    dropcode='<li id="tile'+tile.tilenum+'" data-row="'+sizes[0]+'" data-col="'+sizes[1]+'" data-sizex="'+sizes[2]+'" data-sizey="'+sizes[3]+'">';
    dropcode+='<div id="chart'+tile.tilenum+'"class="widget">'
    dropcode+='<strong>'+titleGen(chartType, dataset)+'</strong></br> <span style="color:'+tile.color+'">.</span>'
    dropcode+='<a class="reset" href="javascript:tiles['+tile.tilenum+'].chart.filterAll();dc.redrawAll();" style="display: none;">reset</a>'
    dropcode+='<div class="clearfix"></div>'
    dropcode+='</div>'
    dropcode+='</li>';
    dropTile(dropcode, chartType)
    $('#tile'+tile.tilenum).css({'background-color':tile.color})
    tile.chart=chartGen(chartType, dataset, 'chart'+tile.tilenum, tile.colorKey)
    tiles.push(tile)
}
function loadData()
{
    var htmlcode="";
    $.getJSON('users/all', function(data){
        $.each(data, function(){
            varData[this.name]={name:this.name, cat:"basic"}
            if(this['super']!='N')
            {
                varData[this.name]['super']=this['super']
                if(varData.hasOwnProperty(this['super']))
                {
                    varData[this['super']].dependants.push(this.name)
                }
                
                else
                {
                    varData[this['super']]={name:this['super'], dependants:[], cat:'super'}
                    varData[this['super']].dependants.push(this.name)
                    supersList.push(this['super'])
                }
            }
        })
        endLoad();
    })
    $.getJSON('users/fip', function(data){
        dataValues=data;
        cfilter=crossfilter(dataValues);
        all=cfilter.groupAll();
        endLoad();
    })
}

function endLoad()
{
    if(completion<1)
    {
        completion++;
        return;
    }
    
    for(var j in supersList)
    {console.log(supersList[j])
        for(var curfip in dataValues)
        {
            var max=-9999999, maxKey="";
            for (var dependant in varData[supersList[j]].dependants)
            {
                if(dataValues[curfip][varData[supersList[j]].dependants[dependant]]>max)
                {
                    max=dataValues[curfip][varData[supersList[j]].dependants[dependant]];
                    maxKey=varData[supersList[j]].dependants[dependant];
                }
            }
            dataValues[curfip][supersList[j]]=maxKey
        }
    }
    $('#add').click(function(){
        var chartTypes=['pie', 'donut'], dataSources=['Race', 'AGE', 'Gender', 'Highest_Level_of_Education']
        createTile(chartTypes[Math.floor(Math.random()*2)],dataSources[Math.floor(Math.random()*4)])
    })
    
}