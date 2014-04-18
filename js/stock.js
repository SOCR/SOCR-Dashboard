'use strict';
var instrumentChart = dc.pieChart("#instrument-chart");
var exitfyChart = dc.barChart("#exitfy-chart");
var regionChart = dc.pieChart("#region-chart");
var dayOfWeekChart = dc.rowChart("#day-of-week-chart");
var yearlyBubbleChart = dc.bubbleChart("#yearly-bubble-chart");


//Load data
d3.json("data/worldbank.json", function (error, oldData) {
	if(error)
	{
		console.log("!!!ERRROR!!!:"+error)
		return;
	}
	
	//formatting
    var dateFormat = d3.time.format("%m/%d/%Y");
    var numberFormat = d3.format(".2f");
	var data=[];
	
	//data processing and verification
    oldData.forEach(function (d) {
		if(d.ApprovalDate)
		{
			d.dd = dateFormat.parse(d.ApprovalDate);
			d.month = d3.time.month(d.dd); // pre-calculate month for better performance 
			//console.log(d.month)
			data.push(d)
		}
    });
	
	//initializing crossfilter
    var ndx = crossfilter(data);
    var all = ndx.groupAll();

    // dimension by year
    var yearlyDimension = ndx.dimension(function (d) {
        return d3.time.year(d.dd).getFullYear();
    });
	
	
    // maintain running tallies by year as filters are applied or removed
    var yearlyPerformanceGroup = yearlyDimension.group().reduce(
        /* callback for when data is added to the current filter results */
        function (p, v) {
            ++p.count;
            p.lendcost += v.LendProjCost;
            p.duration += v.Duration;
            p.avglend=p.lendcost/p.count;
            p.avgdur=p.duration/p.count;
            return p;
        },
        /* callback for when data is removed from the current filter results */
        function (p, v) {
            --p.count;
            p.lendcost -= v.LendProjCost;
            p.duration -= v.Duration;
            p.avglend=p.lendcost/p.count;
            p.avgdur=p.duration/p.count;
            return p;
        },
        /* initialize p */
        function () {
            return {count: 0, lendcost:0, avglend:0, duration:0, avgdur:0};
        }
    );

     // dimension by full date
    var dateDimension = ndx.dimension(function (d) {
        return d.dd;
    });

    // dimension by month
    var moveMonths = ndx.dimension(function (d) {
        return d.month;
    });
    // create categorical dimension
    var instrument = ndx.dimension(function (d) {
        return d.LendInstr;
    });
    // produce counts records in the dimension
    var instrumentGroup = instrument.group();

    // determine a histogram of percent changes
    var exitfy = ndx.dimension(function (d) {
        return d.ExitFY;
    });
    var exitfyGroup = exitfy.group();

    // summerize volume by region
    var region = ndx.dimension(function (d) {
        return d.Region;
    });
    var regionGroup = region.group();

    // counts per weekday
    var dayOfWeek = ndx.dimension(function (d) {
        var day = d.dd.getDay();
        var name=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
        return day+"."+name[day];
     });
    var dayOfWeekGroup = dayOfWeek.group(); 

    //### Define Chart Attributes

    // Bubble Chart
    yearlyBubbleChart
        .width(840) // (optional) define chart width, :default = 200
        .height(200)  // (optional) define chart height, :default = 200
        .transitionDuration(1500) // (optional) define chart transition duration, :default = 750
        .margins({top: 10, right: 50, bottom: 30, left: 40})
        .dimension(yearlyDimension)
        //Bubble chart expect the groups are reduced to multiple values which would then be used
        //to generate x, y, and radius for each key (bubble) in the group
        .group(yearlyPerformanceGroup)
        .colors(colorbrewer.RdYlGn[9]) // (optional) define color function or array for bubbles
        .colorDomain([0, 300000000]) //(optional) define color domain to match your data domain if you want to bind data or color
        //##### Accessors
        .colorAccessor(function (d) {
            return d.value.avglend;
        })
        .keyAccessor(function (p) {
            return p.value.avglend;
        })
        .valueAccessor(function (p) {
            return p.value.avgdur;
        })
        .radiusValueAccessor(function (p) {
            return p.value.count;
        })
        .maxBubbleRelativeSize(0.3)
        .x(d3.scale.linear().domain([0, 300000000]))
        .y(d3.scale.linear().domain([-5000,5000 ]))
        .r(d3.scale.linear().domain([0, 5000]))
        //##### Elastic Scaling
        //`.elasticX` and `.elasticX` determine whether the chart should rescale each axis to fit data.
        //The `.yAxisPadding` and `.xAxisPadding` add padding to data above and below their max values in the same unit domains as the Accessors.
        .elasticY(true)
        .elasticX(true)
        .yAxisPadding(100)
        .xAxisPadding(500)
        .renderHorizontalGridLines(true) // (optional) render horizontal grid lines, :default=false
        .renderVerticalGridLines(true) // (optional) render vertical grid lines, :default=false
        .xAxisLabel('Avg. Lending Amount') // (optional) render an axis label below the x axis
        .yAxisLabel('Avg. Duration') // (optional) render a vertical axis lable left of the y axis
        //#### Labels and  Titles
        //Labels are displaed on the chart for each bubble. Titles displayed on mouseover.
        .renderLabel(true) // (optional) whether chart should render labels, :default = true
        .label(function (p) {
            return p.key;
        })
        .renderTitle(true) // (optional) whether chart should render titles, :default = false
        .title(function (p) {
            return [p.key/* ,
                   "Index Gain: " + numberFormat(p.value.absGain),
                   "Index Gain in Percentage: " + numberFormat(p.value.percentageGain) + "%",
                   "Fluctuation / Index Ratio: " + numberFormat(p.value.fluctuationPercentage) + "%"*/]
                   .join("\n"); 
        })
		
    // #### Pie/Donut Chart

     instrumentChart
        .width(180) // (optional) define chart width, :default = 200
        .height(180) // (optional) define chart height, :default = 200
        .radius(80) // define pie radius
        .dimension(instrument) // set dimension
        .group(instrumentGroup) // set group
        .label(function (d) {
            if (instrumentChart.hasFilter() && !instrumentChart.hasFilter(d.key))
                return d.key + "(0%)";
            return d.key + "(" + Math.floor(d.value / all.value() * 100) + "%)";
        });

    regionChart.width(180)
        .height(180)
        .radius(80)
		
        .innerRadius(30)
        .dimension(region)
        .group(regionGroup);

    //#### Row Chart
    dayOfWeekChart.width(180)
        .height(180)
        .margins({top: 20, left: 10, right: 10, bottom: 20})
        .group(dayOfWeekGroup)
        .dimension(dayOfWeek)
        // assign colors to each value in the x scale domain
        .ordinalColors(['#3182bd', '#6baed6', '#3ecae1', '#46dbef', '#5adaeb','#6adaeb','#dadaeb' ])
        .label(function (d) {
            return d.key.split(".")[1];
        })
        // title sets the row text
        .title(function (d) {
            return d.value;
        })
        .elasticX(true)
        .xAxis().ticks(4);

    //#### Bar Chart
    exitfyChart.width(420)
        .height(180)
        .margins({top: 10, right: 50, bottom: 30, left: 40})
        .dimension(exitfy)
        .group(exitfyGroup)
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
		exitfyChart.xAxis().tickFormat(d3.format("d"))

    // Customize axis
    exitfyChart.yAxis().ticks(5);

    dc.renderAll();
});
