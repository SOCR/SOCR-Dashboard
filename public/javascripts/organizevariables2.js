
var numBoxes=0;
var sourceName;
var numFiles = 0;
var filesProcessed = 0;
function organizeVariables(variablesList, fileIndex, curFileName)
{
	filesProcessed++;
	$('#redips-drag').append('<table id="fileTable'+fileIndex+'" ><tr><td class="redips-mark"><input type="text" value="'+curFileName+'"></td></tr><tr><td class="first-box"></td></tr></table>');
	
	for (var j in variablesList)
	{console.log(variablesList[j])
		$('#fileTable'+fileIndex+' .first-box').append('<div class="redips-drag" id="dragfile'+fileIndex+'variable'+j+'">'+variablesList[j]+'</div>');
	}
	if(filesProcessed==numFiles)
	{
		finalizeVariableImportPage();
	}
}

var finalizeVariableImportPage = function ()
{
	filesProcessed = 0;
	$('#redips-drag').append('<div class="addbox-divider"></div>');
	$('#redips-drag').append('<table class="addbox " ><tr><td class= "redips-mark" >ADD</td></tr></table>');
	$('#redips-drag').append('<table class="deletebox"><tr><td class="redips-trash">DELETE</td></tr></table>');
	REDIPS.drag.trash.question='Are you sure you want to delete this variable?'
	$('#sortvariablesbox').modal('show');
	$('.addbox').on('click', function(){
		$('.addbox-divider').before('<table><tr><td class="redips-mark"><input type="text" id="boxname'+numBoxes+'" placeholder="Enter Variable Name"></td></tr><tr><td class="newbox'+numBoxes+'"></td></tr></table>')
		numBoxes++;
		REDIPS.drag.init();
	})
	REDIPS.drag.init();
}
$('#startimport').click(function(){

	//loops through each file
	for(var j=0;j<numFiles;j++)
	{
		sourceName=$('#fileTable'+j+' input').val();
		sourceDropDown.push({name:sourceName.split("_").join(' ').split(".").join(' ').toProperCase(),value: sourceName, subitems:[]})
		var quantVars=[];
		$('#fileTable'+j+' .first-box div').each(function(){
			quantVars.push($(this).text())
		})
		if(quantVars.length>0)
			addQuant(quantVars, j, sourceName)
	}
})
function addQuant(datasetNames, dataTableIndex, fileSourceName)
{
	var databaseName = "DataStorage";
	var databaseTable = "DataTable"+dataTableIndex;
	var importedData={numUsed:{}};
	var boundsData={};
	var qualVars={};
	for (var j in datasetNames)
	{
		importedData[datasetNames[j]]={};
		boundsData[datasetNames[j]]=[Number.MAX_VALUE,-1*Number.MAX_VALUE];
	}
	var request = indexedDB.open(databaseName);
	var dataTypes;
	request.onerror = function(event) {
		console.log("Database error: " + event.target.errorCode);
	};
	request.onsuccess = function(event){
		var headerused=true;
		var db = event.target.result;
		var objStore = db.transaction(databaseTable).objectStore(databaseTable);
		var cursorRequest = objStore.openCursor();
		cursorRequest.onsuccess = function (event) {
			var curCursor = event.target.result;
			if (curCursor) 
			{
				//header row
				if(headerused)
				{
					headerused=false;
					dataTypes=curCursor.value;
					console.log(dataTypes)
					for(var j in dataTypes)
					{
						if(dataTypes[j]!='number')
							qualVars[j]={data:{}, indices:{}, numSub:0, names:[]}
					} 
					curCursor.continue();
				}
				
				//non-header rows
				else
				{
					var value = curCursor.value;
					if (typeof(value[cohortName])!='number')
					{
						curCursor.continue();
						return;
					}
					var fipnum='fip'+Math.floor((value[cohortName]-minCohort)/cohortWidth);
					
					//checks bounds
					for(var j in datasetNames)
					{
						if(dataTypes[datasetNames[j]]=='number')
						{
							if(boundsData[datasetNames[j]][0]>value[datasetNames[j]])
								boundsData[datasetNames[j]][0]=value[datasetNames[j]]
							if(boundsData[datasetNames[j]][1]<value[datasetNames[j]])
								boundsData[datasetNames[j]][1]=value[datasetNames[j]]
						}
					}
					
					//if fip already previously accessed
					if(importedData.numUsed[fipnum])
					{
						for(var j in datasetNames)
						{
							if(dataTypes[datasetNames[j]]!='number')
							{
								if(typeof(importedData[datasetNames[j]][fipnum][value[datasetNames[j]]])=='undefined')
									importedData[datasetNames[j]][fipnum][value[datasetNames[j]]]=1
								else
									importedData[datasetNames[j]][fipnum][value[datasetNames[j]]]++;
									
								if(typeof(qualVars[datasetNames[j]].indices[value[datasetNames[j]]])=='undefined')
								{
									qualVars[datasetNames[j]].indices[value[datasetNames[j]]]=qualVars[datasetNames[j]].numSub;
									qualVars[datasetNames[j]].numSub++;
									qualVars[datasetNames[j]].names.push(value[datasetNames[j]]);
								}
							}
							else if(Number(value[datasetNames[j]])!=NaN)
								importedData[datasetNames[j]][fipnum]=(importedData[datasetNames[j]][fipnum]*importedData.numUsed[fipnum] +Number(value[datasetNames[j]]))/(importedData.numUsed[fipnum]+1)
						}
						importedData.numUsed[fipnum]++;
					}
					
					//previously unaccessed fip
					else
					{
						for(var j in datasetNames)
						{
							if(dataTypes[datasetNames[j]]!='number')
							{console.log(datasetNames[j]); console.log(datasetNames)
								importedData[datasetNames[j]][fipnum]={};
								importedData[datasetNames[j]][fipnum][value[datasetNames[j]]]=1
									
								if(typeof(qualVars[datasetNames[j]].indices[value[datasetNames[j]]])=='undefined')
								{
									qualVars[datasetNames[j]].indices[value[datasetNames[j]]]=qualVars[datasetNames[j]].numSub;
									qualVars[datasetNames[j]].numSub++;
									qualVars[datasetNames[j]].names.push(value[datasetNames[j]]);
								}
							}
							else if(Number(value[datasetNames[j]])!=NaN)
								importedData[datasetNames[j]][fipnum]=Number(value[datasetNames[j]])
							else
								importedData[datasetNames[j]][fipnum]=0;
						}
						importedData.numUsed[fipnum]=1;
					}
					curCursor.continue();
				}
			}
			
			//finalize import
			else
			{console.log('AAAAAAAABBBBBBBBB', importedData)
				for(var j in importedData)
				{
					var dataname=j;
					while(findVariable('super', dataname)>-1 || findVariable('var', dataname)>-1 )
					{
						dataname+='\0'
					}
					
					//qualitative variable import
					if(dataTypes[j]!='number'&&j!='numUsed')
					{
						for(var fipnum in importedData[j])
						{
							qualVars[j].data[fipnum]=[]
							for(var k=0;k<qualVars[j].numSub;k++)
							{
								qualVars[j].data[fipnum][k]=0;
							}
							
							var totSum=0;
							for(var k in importedData[j][fipnum])
							{
								qualVars[j].data[fipnum][qualVars[j].indices[k]]=importedData[j][fipnum][k]
								totSum+=importedData[j][fipnum][k]
							}
							for(var k=0;k<qualVars[j].numSub;k++)
							{
								qualVars[j].data[fipnum][k]/=totSum;
								if(k>0)
									qualVars[j].data[fipnum][k]+=qualVars[j].data[fipnum][k-1]
							}
						}
						
						superUsage.names.push(dataname)
						superUsage.amounts.push(0);
						superUsage.dataIn.push(true);
						superUsage.dimensions.push({});
						superUsage.dependancies.push(qualVars[j].names);
						superUsage.sources.push(fileSourceName);
						sourceDropDown[sourceDropDown.length-1].subitems.push({name:j.split("_").join(' ').toProperCase() ,type:'qual',value:dataname })
						addData('super', dataname, qualVars[j].data)
						
					}
					
					//quantitative variable import
					else if(j!='numUsed')
					{console.log(j)
						addData('var', dataname, importedData[j])
						varUsage.names.push(dataname)
						varUsage.amounts.push(0);
						varUsage.dataIn.push(true);
						varUsage.dimensions.push({});
						varUsage.sources.push(fileSourceName)
						varUsage.bounds.push(boundsData[j]);
						sourceDropDown[sourceDropDown.length-1].subitems.push({name:j.split("_").join(' ').toProperCase() ,type:'quant',value:dataname })
						
					}
				}
			}
		}
		cursorRequest.onerror = function (event) {
		  console.log("Database error: " + event.target.errorCode);
		}
	}
}


//Adds qualitative variables (Custom Boxes) to dataset
function addQual(index)
{
	if(index==numBoxes)
	{
		$('#sortvariablesbox').modal('hide');
		$('#redips-drag').empty();
		numBoxes = 0;
		return;
	}
	
	var databaseName = "DataStorage";
	var databaseTable = "DataTable";
	var importedData={numUsed:{}};
	var datasetNames=[];
	var variableName=$('#boxname'+index).val();
	//obtains list of subvariables
	$('.newbox'+index+' div').each(function(){
		datasetNames.push($(this).text())
	})
	
	//checks empty box
	if(datasetNames.length==0)
	{
		addQual(index+1)
		return
	}
	
		importedData.data={};
	
	var request = indexedDB.open(databaseName);
	var dataTypes;
	request.onerror = function(event) {
		console.log("Database error: " + event.target.errorCode);
	};
	request.onsuccess = function(event){
		headerused=true;
		var db = event.target.result;
		var objStore = db.transaction(databaseTable).objectStore(databaseTable);
		var cursorRequest = objStore.openCursor();
		cursorRequest.onsuccess = function (event) {
			var curCursor = event.target.result;
			if (curCursor) 
			{
				//header row
				if(headerused)
				{
					headerused=false;
					dataTypes=curCursor.value;
					curCursor.continue();
				}
				
				//non-header rows
				else
				{
					var value = curCursor.value;
					var fipnum='fip'+((value[cohortName]-minCohort)/cohortWidth);
					
					
					
					//if fip already previously accessed
					if(importedData.numUsed[fipnum])
					{
						for(var j in datasetNames)
						{
							importedData.data[fipnum][j]+=value[datasetNames[j]];
						}
						importedData.numUsed[fipnum]++;
					}
					
					//previously unaccessed fip
					else
					{
						importedData.data[fipnum]=[];
						for(var j in datasetNames)
						{
							importedData.data[fipnum].push(value[datasetNames[j]])
						}
						importedData.numUsed[fipnum]=1;
					}
					curCursor.continue();
				}
			}
			else
			{
				var dataname=variableName;
				while(findVariable('super', dataname)>-1 || findVariable('var', dataname)>-1 )
				{
					dataname+='\0'
				}
				for(var j in importedData.data)
				{
					var sumArray=0;
					for(var k=0;k<importedData.data[j].length;k++)
						sumArray+=importedData.data[j][k];
					for(var k=0;k<importedData.data[j].length;k++)
					{
						importedData.data[j][k]/=sumArray;
						if(k>0)
						importedData.data[j][k]+=importedData.data[j][k-1];
					}
				}
				superUsage.names.push(dataname)
				superUsage.amounts.push(0);
				superUsage.dataIn.push(true);
				superUsage.dimensions.push({});
				superUsage.dependancies.push(datasetNames);
				superUsage.sources.push(sourceName);
				sourceDropDown[sourceDropDown.length-1].subitems.push({name:variableName.split("_").join(' ').toProperCase() ,type:'qual',value:dataname })
				addData('super', dataname, importedData.data)
				
				addQual(index+1)
			}
		}
		cursorRequest.onerror = function (event) {
		  console.log("Database error: " + event.target.errorCode);
		}
	}
}
function getVariablesList(fileIndex, curFileName, nFiles)
{
	numFiles = nFiles;
	var databaseName = "DataStorage";
	var databaseTable = "DataTable"+fileIndex;
	var request = indexedDB.open(databaseName);
	request.onerror = function(event) {
		console.log("Database error: " + event.target.errorCode);
	};
	request.onsuccess = function(event){
		headerused=true;
		var db = event.target.result;
		var objStore = db.transaction(databaseTable).objectStore(databaseTable);
		var cursorRequest = objStore.openCursor();
		cursorRequest.onsuccess = function(index, fileName){return function (event) {
			var curCursor = event.target.result;
			if (curCursor) 
			{
				//header row				
				var dataTypes=curCursor.value;	
				//extracts all column headers
				var headerList=[]
				for(var k in dataTypes)
				{
					headerList.push(k)
				}
				
				organizeVariables(headerList, index, fileName);
			}
		}}(fileIndex, curFileName)
		cursorRequest.onerror = function (event) {
		  console.log("Database error: " + event.target.errorCode);
		}
	}
}