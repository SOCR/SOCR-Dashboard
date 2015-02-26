
// Uploading file and Parse 
function handleFileSelect() {
  //open and create database and table
  createDBandTable();
  var t0 = performance.now();
  
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
      if (text == undefined){
        for (i=0; i < block.data.length; i++) {
          if (block.data[i].source != source || block.data[i].category != category || block.data[i].variable != variable) {
            if (text){
              text = text.concat('}}');
              var jsonObj = JSON.parse(text);
              writeDataToDB(jsonObj);
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
            writeDataToDB(jsonObj);
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
      if (text.indexOf("undefined") < 0){
        text = text.concat('}}');
        var jsonObj = JSON.parse(text);
        writeDataToDB(jsonObj);
      }

      var t1 = performance.now();
      console.log("CSV objects: " + (t1-t0) + " milliseconds.");

      // getValue();
    }
  })
};

function writeDataToDB(dataObj){
  var request = indexedDB.open("DataStorage");
  request.onerror = function(event) {
    alert("Database error: " + event.target.errorCode);
  };
  request.onsuccess = function(event){
    var db = event.target.result;
    var transaction = db.transaction(["DataTable"], "readwrite");
    var objStore = transaction.objectStore("DataTable");
    objStore.add(dataObj); 
  };
}

function createDBandTable() {
  // IndexedDB
  if (!window.indexedDB) {
      window.alert("Your browser doesn't support a stable version of IndexedDB. Parsing and Storage feature will not be available.");
  } else {
      var request = indexedDB.open("DataStorage");
      request.onerror = function(event) {
        alert("Database error: " + event.target.errorCode);
      };
      request.onupgradeneeded = function(event) {
        var db = event.target.result;
        // Create another object store called "DataTable" with the autoIncrement flag set as true.    
        var objStore = db.createObjectStore("DataTable", { autoIncrement : true });
      };
  };
}


function getValue(){
  var request = indexedDB.open("DataStorage");
  request.onerror = function(event) {
        alert("Database error: " + event.target.errorCode);
      };
  request.onsuccess = function(event){
    var db = event.target.result;
    var objStore = db.transaction("DataTable").objectStore("DataTable");
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









