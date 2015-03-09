
// Uploading file and Parse 
function handleFileSelect() {
  //open and create database and table
  var indexedDBname = "DataStorage";
  var indexedDBtable = "DataTable";

  createDBandTable(indexedDBname, indexedDBtable);
  var t0 = performance.now();

  var variablesCheck = true;
  var listOfVar = ["source", "category", "variable", "type", "fips", "data"];
  
  var text;
  var source;
  var variable;
  var category;

  var fileInput = document.getElementById("fileElem");

  var results = Papa.parse(fileInput.files[0], {
    header: true,
    dynamicTyping: true,
    // step: function(row){
    //   console.log("Row:", row);
    // },
    chunk: function(block){

      if (variablesCheck){
        if (checkSpelling(block, listOfVar)){
          return;
        }
        variablesCheck = false;
      }


      if (text == undefined){
        for (i=0; i < block.data.length; i++) {
          if (block.data[i].source != source || block.data[i].category != category || block.data[i].variable != variable) {
            if (text){
              text = text.concat('}}');
              var jsonObj = JSON.parse(text);
              writeDataToDB(jsonObj, indexedDBname, indexedDBtable);
              text = undefined;
              text = '{"source":"' + block.data[i].source + '", "variable":"' + block.data[i].variable + '", "category":"' 
              + block.data[i].category + '", "type":"' + block.data[i].type + '", "data":{"' + block.data[i].fips + '":' 
              + block.data[i].data;
              source = block.data[i].source;
              category = block.data[i].category;
              variable = block.data[i].variable;
              continue;
            }
            text = '{"source":"' + block.data[i].source + '", "variable":"' + block.data[i].variable + '", "category":"' 
              + block.data[i].category + '", "type":"' + block.data[i].type + '", "data":{"' + block.data[i].fips + '":' 
              + block.data[i].data;
            source = block.data[i].source;
            category = block.data[i].category;
            variable = block.data[i].variable;
          } else {
            text = text.concat(', "' + block.data[i].fips + '":' + block.data[i].data);
          }
        }
      } else {
        for (i=0; i < block.data.length; i++) {
          if (block.data[i].source == source && block.data[i].category == category && block.data[i].variable == variable) {
            text = text.concat(', "' + block.data[i].fips + '":' + block.data[i].data);
          } else {
            // pass text to indexeddb 
            text = text.concat('}}');
            var jsonObj = JSON.parse(text);
            writeDataToDB(jsonObj, indexedDBname, indexedDBtable);
            text = undefined;
            text = '{"source":"' + block.data[i].source + '", "variable":"' + block.data[i].variable + '", "category":"' 
              + block.data[i].category + '", "type":"' + block.data[i].type + '", "data":{"' + block.data[i].fips + '":' 
              + block.data[i].data;
            source = block.data[i].source;
            category = block.data[i].category;
            variable = block.data[i].variable;
          }
        }
      }
    },
    complete: function() {
      if (variablesCheck){
        return;
      }

      if (text.indexOf("undefined") < 0){
        text = text.concat('}}');
        var jsonObj = JSON.parse(text);
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









