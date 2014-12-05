var currop=0;
var numcalls=0;
var newname="";
var var2, var1;
var table;
$(document).ready( function () {
    table=$('#custvartable').DataTable();
} );
$('#settings').click(function(){
	$('#customlist').modal('show');
})
$('#startcreate').click(function(){
	$('#customlist').modal('hide');
	$('#varcreator').modal('show');
	var temp={};
	$("#primarynewvarsource").html("");
	$("#primarynewvar").html("");
	$.each(sourceDropDown, function(){
		{
			$("<option />")
			.attr("value", this.value)
			.html(this.name)
			.appendTo("#primarynewvarsource");
			temp[this.value] = this.subitems;
		}
	});

	$("#primarynewvarsource").change(function(){
		var value = $(this).val();
		var menu = $("#primarynewvar");
		
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
	});
	
	var temp2={};
	$("#secondarynewvarsource").html("");
	$("#secondarynewvar").html("");
	$.each(sourceDropDown, function(){
		{
			$("<option />")
			.attr("value", this.value)
			.html(this.name)
			.appendTo("#secondarynewvarsource");
			temp2[this.value] = this.subitems;
		}
	});

	$("#secondarynewvarsource").change(function(){
		var value = $(this).val();
		var menu = $("#secondarynewvar");
		
		menu.empty();
		$.each(temp2[value], function(){
			if(this.type=='quant')
			{
				$("<option />")
				.attr("value", this.value)
				.html(this.name)
				.appendTo(menu);
			}
		});
	});
})
$('#endcreate').click(function(){
	newname=$('#newvarname').val();
	if(newname!=null && $("#secondarynewvar").val()!=null && $("#primarynewvar").val()!=null)
	{
		newname=newname.replace(/\W/g, '');
		if(newname!='')
		{
			numcalls=0;
			var2=$("#secondarynewvar").val(); 
			var1=$("#primarynewvar").val();
			getData(var1, function(){finishNewVar()},[]);
			getData(var2, function(){finishNewVar()},[]);
			
		}
	}
})
$('#operator').click(function(){
	currop++;
	currop%=4;
	$('.opicon').css({display:"none"});
	$('#operator'+currop).css({display:"inline"})
})

function finishNewVar()
{console.log('finishnewvar')
	numcalls++;
	if(numcalls==2)
	{
		var newmin=Number.MAX_VALUE, newmax=-1*Number.MAX_VALUE;
		numcalls=0;
		$('#varcreator').modal('hide');
		for(var person in people)
		{
			var fipcode=people[person].fip;
			if(currop==0)
			{
				if(people[person][var2]!=0)
					people[person][newname]=people[person][var1]/people[person][var2];
				else
					people[person][newname]=0;
			}
			else if(currop==1)
				people[person][newname]=people[person][var1]+people[person][var2];		
			else if(currop==2)
				people[person][newname]=people[person][var1]-people[person][var2];		
			else 
				people[person][newname]=people[person][var1]*people[person][var2];		
				
			if(people[person][newname]>newmax)
				newmax=people[person][newname];
			if(people[person][newname]<newmin)
				newmin=people[person][newname];
				
		}
		varUsage.names.push(newname)
		varUsage.amounts.push(0);
		varUsage.dataIn.push(true);
		varUsage.dimensions.push({});
		varUsage.sources.push('Custom');
		varUsage.bounds.push([newmin,newmax]);
		var index= findSource('Custom');
		sourceDropDown[index].subitems.push({value:newname, name:newname});
		var addObject=[newname,var1.substring(0,20),var2.substring(0,20)];
		if(currop==0)
			addObject.push('/')
		else if(currop==1)
			addObject.push('+')
		else if(currop==2)
			addObject.push('-')
		else 
			addObject.push('*')
		
		table.row.add( addObject ).draw();
	}
}