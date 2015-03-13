
// Uploading file and Parse 
function handleFileSelect() {


  //open and create database and table
  var indexedDBname = "DataStorage";
  var indexedDBtable = "DataTable";

  createDBandTable(indexedDBname, indexedDBtable);
  var t0 = performance.now();

  var variablesCheck = true;
  var listOfVar = ["source", "category", "variable", "type", "fips", "data"];
  
  var blockCount = 0;
  var textObj = {data:[], firstStatement: true, multiple: false};


  var fileInput = document.getElementById("fileElem");

  var results = Papa.parse(fileInput.files[0], {
    header: true,
    dynamicTyping: true,
    chunk: function(block){

      if (variablesCheck){
        if (checkSpelling(block, listOfVar)){
          return;
        }
        variablesCheck = false;
      }

      // console.log(block.data.length);

      for (i=0; i < block.data.length; i++){
        if (block.data[i].source != textObj.source || block.data[i].category != textObj.category || block.data[i].variable != textObj.variable){
          if (typeof textObj.text != 'undefined'){
            textObj.text = textObj.text + '}}';
            // console.log(textObj.text);
            var jsonObj = JSON.parse(textObj.text);
            writeDataToDB(jsonObj, indexedDBname, indexedDBtable);
            textObj.text = undefined;
            textObj.data = [];
            textObj.firstStatement = true;
            textObj.multiple = false;
            // console.log('A');
          }
          if (i != block.data.length - 1){
            if (block.data[i].fips == block.data[i+1].fips){
              textObj.multiple = true;
              textObj.source = block.data[i].source;
              textObj.category = block.data[i].category;
              textObj.variable = block.data[i].variable;
              textObj.type = block.data[i].type;
              textObj.fips = block.data[i].fips;
              textObj.data.push(block.data[i].data);
              // console.log('B');
            } else if (textObj.firstStatement && !textObj.multiple && typeof textObj.text == 'undefined'){
              textObj.source = block.data[i].source;
              textObj.category = block.data[i].category;
              textObj.variable = block.data[i].variable;
              textObj.type = block.data[i].type;
              textObj.fips = block.data[i].fips;
              textObj.data.push(block.data[i].data);
              textObj.text = '{"source":"' + textObj.source + '", "variable":"' + textObj.variable + '", "category":"' 
                + textObj.category + '", "type":"' + textObj.type + '", "data":{"' + textObj.fips + '":' + textObj.data[0];
              textObj.data = [];
              textObj.firstStatement = false;
              // console.log('C');
            }
          } else if (textObj.firstStatement && !textObj.multiple && typeof textObj.text == 'undefined') { // last line of something different
              textObj.source = block.data[i].source;
              textObj.category = block.data[i].category;
              textObj.variable = block.data[i].variable;
              textObj.type = block.data[i].type;
              textObj.fips = block.data[i].fips;
              textObj.data.push(block.data[i].data);
              textObj.text = '{"source":"' + textObj.source + '", "variable":"' + textObj.variable + '", "category":"' 
                + textObj.category + '", "type":"' + textObj.type + '", "data":{"' + textObj.fips + '":' + textObj.data[0];
              textObj.data = [];
              textObj.firstStatement = false;
              blockCount = blockCount + 1;
              // console.log('I');
          }


        } else {
          if (i != block.data.length - 1){
            if (block.data[i].fips == block.data[i+1].fips){
              textObj.multiple = true;
              textObj.source = block.data[i].source;
              textObj.category = block.data[i].category;
              textObj.variable = block.data[i].variable;
              textObj.type = block.data[i].type;
              textObj.fips = block.data[i].fips;
              textObj.data.push(block.data[i].data);
              // console.log('D');
            } else {
              if (textObj.multiple && textObj.firstStatement && typeof textObj.text == 'undefined'){
                textObj.data.push(block.data[i].data);
                textObj.text = '{"source":"' + textObj.source + '", "variable":"' + textObj.variable + '", "category":"' 
                + textObj.category + '", "type":"' + textObj.type + '", "data":{"' + textObj.fips + '":' + textObj.data.reduce(function(a,b) {return a+b;})/textObj.data.length;
                textObj.multiple = false;
                textObj.firstStatement = false;
                textObj.source = block.data[i].source;
                textObj.category = block.data[i].category;
                textObj.variable = block.data[i].variable;
                textObj.fips = block.data[i].fips;
                textObj.data = [];
                // console.log('E');
              } else if (!textObj.multiple && !textObj.firstStatement && typeof textObj.text != 'undefined'){
                textObj.source = block.data[i].source;
                textObj.category = block.data[i].category;
                textObj.variable = block.data[i].variable;
                textObj.type = block.data[i].type;
                textObj.fips = block.data[i].fips;
                textObj.data.push(block.data[i].data);
                textObj.text = textObj.text + ', "' + textObj.fips + '":' + textObj.data[0];
                textObj.data = [];
                // console.log('H');
              } else if (textObj.multiple && !textObj.firstStatement && typeof textObj.text != 'undefined'){
                textObj.source = block.data[i].source;
                textObj.category = block.data[i].category;
                textObj.variable = block.data[i].variable;
                textObj.type = block.data[i].type;
                textObj.fips = block.data[i].fips;
                textObj.data.push(block.data[i].data);
                textObj.text = textObj.text + ', "' + textObj.fips + '":' + textObj.data.reduce(function(a,b) {return a+b;})/textObj.data.length;
                textObj.multiple = false;
                textObj.data = [];
                // console.log('J');
              }
            }

          } else { //last line 
            if (textObj.multiple && !textObj.firstStatement && typeof textObj.text != 'undefined'){
              textObj.data.push(block.data[i].data);
              blockCount = blockCount + 1;
              // console.log('F');
              // console.log(blockCount);
            } else if (!textObj.multiple && !textObj.firstStatement && typeof textObj.text != 'undefined'){
              textObj.source = block.data[i].source;
              textObj.category = block.data[i].category;
              textObj.variable = block.data[i].variable;
              textObj.type = block.data[i].type;
              textObj.fips = block.data[i].fips;
              textObj.data.push(block.data[i].data);
              textObj.text = textObj.text + ', "' + textObj.fips + '":' + textObj.data[0];
              textObj.data = [];
              blockCount = blockCount + 1;
              // console.log(blockCount);
              // console.log('G');

            } else if (textObj.multiple && textObj.firstStatement && typeof textObj.text == 'undefined'){
              textObj.source = block.data[i].source;
              textObj.category = block.data[i].category;
              textObj.variable = block.data[i].variable;
              textObj.type = block.data[i].type;
              textObj.fips = block.data[i].fips;
              textObj.data.push(block.data[i].data); 
              textObj.text = '{"source":"' + textObj.source + '", "variable":"' + textObj.variable + '", "category":"' 
                + textObj.category + '", "type":"' + textObj.type + '", "data":{"' + textObj.fips + '":' + textObj.data.reduce(function(a,b) {return a+b;})/textObj.data.length;
              textObj.data = [];
              textObj.firstStatement = false;
              textObj.multiple = false;
              blockCount = blockCount + 1;
              // console.log('K');
            }
          }
        }


      }
      


    },
    complete: function() {
      if (variablesCheck){
        return;
      }

      if (blockCount == 1 && textObj.multiple && !textObj.firstStatement){
        textObj.text = textObj.text + ', "' + textObj.fips + '":' + textObj.data.reduce(function(a,b) {return a+b;})/textObj.data.length + '}}';
        // console.log('END');
        // console.log(textObj.text);
        var jsonObj = JSON.parse(textObj.text);
        writeDataToDB(jsonObj, indexedDBname, indexedDBtable); 
      } else if (!textObj.multiple && !textObj.firstStatement && textObj.source != ""){
        textObj.text = textObj.text + '}}';
        // console.log('End 2');
        // console.log(textObj.text);
        var jsonObj = JSON.parse(textObj.text);
        writeDataToDB(jsonObj, indexedDBname, indexedDBtable);
      } else if (textObj.multiple && textObj.firstStatement) { //for a block with all same fips
        textObj.text = '{"source":"' + textObj.source + '", "variable":"' + textObj.variable + '", "category":"' 
                + textObj.category + '", "type":"' + textObj.type + '", "data":{"' + textObj.fips + '":' + textObj.data.reduce(function(a,b) {return a+b;})/textObj.data.length + '}}';
        // console.log(textObj.text);
        // console.log('End 3');
        var jsonObj = JSON.parse(textObj.text);
        writeDataToDB(jsonObj, indexedDBname, indexedDBtable);
      } 

      var t1 = performance.now();
      console.log("CSV objects: " + (t1-t0) + " milliseconds.");

      // getValue(indexedDBname, indexedDBtable);
    }
  })
};




function checkSpelling(dataObj, varList){
  for (i=0; i < dataObj.meta.fields.length; i++){
    if (varList.indexOf(dataObj.meta.fields[i]) < 0){
      alert("One or more of the header fields are incorrectly spelled. Correct spellings should be: source, category, variable, type, fips, data. Please refresh page and try again.");
      return true;
    }
  }
}

function writeDataToDB(dataObj, databaseName, databaseTable){
  var request = indexedDB.open(databaseName);
  request.onerror = function(event) {
    alert("Database error: " + event.target.errorCode);
  };
  request.onsuccess = function(event){
    var db = event.target.result;
    var transaction = db.transaction([databaseTable], "readwrite");
    var objStore = transaction.objectStore(databaseTable);
    objStore.add(dataObj); 
  };
}

function createDBandTable(databaseName, databaseTable) {
  // IndexedDB
  if (!window.indexedDB) {
      window.alert("Your browser doesn't support a stable version of IndexedDB. Parsing and Storage feature will not be available.");
  } else {
      var request = indexedDB.open(databaseName);
      request.onerror = function(event) {
        alert("Database error: " + event.target.errorCode);
      };
      request.onupgradeneeded = function(event) {
        var db = event.target.result;
        // Create another object store called "DataTable" with the autoIncrement flag set as true.    
        var objStore = db.createObjectStore(databaseTable, { autoIncrement : true });
      };
  };
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
        var value = curCursor.value.variable;
        alert(value);
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









