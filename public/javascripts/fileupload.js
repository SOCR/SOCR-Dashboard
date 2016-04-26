
// Uploading file and Parse 
function handleFileSelect() {

  // var t0 = performance.now();

  //open and create database and table
  var indexedDBname = "DataStorage";
  var indexedDBtable = "DataTable";

  if (!window.indexedDB) {
      window.alert("Your browser doesn't support a stable version of IndexedDB. Parsing and Storage feature will not be available.");
  } else {
      var request = indexedDB.open(indexedDBname);
      request.onerror = function(event) {
        alert("Database error: " + event.target.errorCode);
      };
      request.onupgradeneeded = function(event) {
        var db = event.target.result;
        // Create another object store called "DataTable" with the autoIncrement flag set as true.    
        var objStore = db.createObjectStore(indexedDBtable, { autoIncrement : true });
      };  
  };

  //open transaction and write data to indexedDB
  var openRequest = indexedDB.open(indexedDBname);
  openRequest.onerror = function(event) {
    alert("Database error: " + event.target.errorCode);
    };
  openRequest.onsuccess = function(event){
    
    var fileInput = document.getElementById("fileElem");

    var results = Papa.parse(fileInput.files[0], {
      header: true,
      dynamicTyping: true,
      chunk: function(block){

        var db = event.target.result;
        var transaction = db.transaction([indexedDBtable], "readwrite");
        var objStoreTable = transaction.objectStore(indexedDBtable);

        // console.log(block);

        //write header and datatype to db
        var header = {};
        for (i=0; i < block.meta.fields.length; i++){
          header[block.meta.fields[i]] = typeof block.data[0][block.meta.fields[i]];
        }
        // console.log(header);
        objStoreTable.add(header);

        //write each data object to db
        for (i=0; i < block.data.length; i++){
          objStoreTable.add(block.data[i]);
        }
      },
      complete: function() {
        console.log("All done");
        // getOneValue(indexedDBname, indexedDBtable, 8);

        // var t1 = performance.now();
        // console.log((t1-t0) + " ms" );

      }
    });
  };
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









