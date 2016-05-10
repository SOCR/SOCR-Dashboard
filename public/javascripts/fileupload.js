
//returns extension of a given filename
var getExtension = function(fileName)
{
	var re = /(?:\.([^.]+))?$/;
	var ext = re.exec(fileName)[1];
	return ext;
}

// Uploading file and Parse 
function handleFileSelect(fileList) {

  // var t0 = performance.now();


  var toParse = [];
  preParseHelper(0, toParse, fileList)
}
function preParseHelper(j, toParse, fileList)
{
	if(j>=fileList.length)
	{
		resumeFileSelect(fileList, toParse)
	}
	else
	{
		var extension=getExtension(fileList[j].name)
		var functionString = "preparse"+extension.toUpperCase();
		if (typeof window[functionString] === "function") {
			window[functionString](fileList[j], toParse, fileList, function(){preParseHelper(j+1, toParse, fileList)});
		}
		else preParseHelper(j+1, toParse, fileList)
	}
}
function resumeFileSelect(fileList, toParse) {

  //open and create database and table
  var indexedDBname = "DataStorage";
  var indexedDBtable = "DataTable";
  var curDBVersion = 2;
  
  //check for indexedDB support
  if (!window.indexedDB) {
      window.alert("Your browser doesn't support a stable version of IndexedDB. Parsing and Storage feature will not be available.");
	  return;
  } 
  indexedDB.deleteDatabase(indexedDBname);
  console.log(toParse);
   
  //initialize dataTables
  var request = indexedDB.open(indexedDBname,3);
  request.onerror = function(event) 
  {
	alert("Database error: " + event.target.errorCode);
  };
  request.onupgradeneeded = function(event) 
  {
	var db = event.target.result;
	console.log('creating object store')
	for(var j in toParse)
	{
		indexedDBtable = "DataTable"+j;
		// Create another object store called "DataTable" with the autoIncrement flag set as true.    
		var objStore = db.createObjectStore(indexedDBtable, { autoIncrement : true });
	}
  };  
   
  for(var j in toParse)
  {
	  indexedDBtable = "DataTable"+j;
	  
	  //open transaction for writing
	  var openRequest = indexedDB.open(indexedDBname);
	  
	  //error opening transaction
	  openRequest.onerror = function(event) {
		alert("Database error: " + event.target.errorCode);
		};
		
	  //begin parsing frame
	  openRequest.onsuccess = function(k, indexedDBtableNew){ return function(event){
	  
		//open and clear correct table
		var db = event.target.result;
		var transaction = db.transaction([indexedDBtableNew], "readwrite");
		var objStoreTable = transaction.objectStore(indexedDBtableNew);
		objStoreTable.clear();
		
	    //select appropriate parser
		var extension=getExtension(toParse[k].name)
		var functionString = "parse"+extension.toUpperCase();
		var callback = function(curTable, curFileName, numFiles){
			return function(){
			getVariablesList(curTable, curFileName, numFiles);
			}
		}(k, toParse[k].name, toParse.length);
		console.log(toParse[k].name)
		if (typeof window[functionString] === "function") {
			window[functionString](toParse[k], indexedDBtableNew, callback, indexedDBname);
		}
	  }}(j, indexedDBtable);
  }
};


function getOneValue(databaseName, databaseTable, keyID){
  var openRequest = indexedDB.open(databaseName);
  openRequest.onsuccess = function(event){
  var db = event.target.result;
  var transaction = db.transaction([databaseTable], "readonly");
  var objStoreTable = transaction.objectStore(databaseTable);
  var request = objStoreTable.get(keyID);
  request.onerror = function(event){
    console.log(event);
  }
  request.onsuccess = function(event){
    alert(request.result.fips);
  }
}
}


function getValue(databaseName, databaseTable){
  var request = indexedDB.open(databaseName);
  request.onerror = function(event) {
        alert("Database error: " + event.target.errorCode);
      };
  request.onsuccess = function(event){
    var db = event.target.result;
    var objStore = db.transaction(databaseTable).objectStore(databaseTable);
    var cursorRequest = objStore.openCursor();
    cursorRequest.onsuccess = function (event) {
      var curCursor = event.target.result;
      if (curCursor) {
        var value = curCursor.value;
        console.log(value);
		console.log(123);
        curCursor.continue();
      }
    }
    cursorRequest.onerror = function (event) {
      alert("Database error: " + event.target.errorCode);
    }
  }
}                

// // Delete Database 
// window.indexedDB.deleteDatabase("DataStorage");
