/*
// IndexedDB
if (!window.indexedDB) {
    window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
}
 

/*var db;
var request = indexedDB.open("MyTestDatabase");
request.onerror = function(event) {
  alert("Database error: " + event.target.errorCode);
};
request.onsuccess = function(event) {
  db = event.target.result;
};

// This event is only implemented in recent browsers
request.onupgradeneeded = function(event) { 
  var db = event.target.result;

  // Create an objectStore for this database
  var objectStore = db.createObjectStore("name", { keyPath: "myKey" });
};
*/

// ---------------------
/*// This is what our customer data looks like.
const customerData = [
  { ssn: "444-44-4444", name: "Bill", age: 35, email: "bill@company.com" },
  { ssn: "555-55-5555", name: "Donna", age: 32, email: "donna@home.org" }
];*/
/*
const dbName = "the_name";

// Open the indexedDB.
var request = indexedDB.open(dbName, 3);

request.onupgradeneeded = function (event) {

    var db = event.target.result;

    // Create another object store called "names" with the autoIncrement flag set as true.    
    var objStore = db.createObjectStore("names", { autoIncrement : true });

    // Because the "names" object store has the key generator, the key for the name value is generated automatically.
    // The added records would be like:
    // key : 1 => value : "Bill"
    // key : 2 => value : "Donna"
    for (var i in customerData) {
        objStore.add(customerData[i].name);
    }
}*/

// ---------------------

/*
request.onerror = function(event) {
  // Handle errors!
};
request.onsuccess = function(event) {
  var db = event.target.result;
  var transaction = db.transaction(["customers"]);
  var objectStore = transaction.objectStore("customers");
  var request = objectStore.get("555-55-5555");
  request.onerror = function(event) {
  // Handle errors!
};
  request.onsuccess = function(event) {
  // Do something with the request.result!
  alert("Name for SSN 555-55-5555 is " + request.result.name);
  
};
};*/
/*var request = db.transaction(["customers"], "readwrite")
                .objectStore("customers")
                .delete("444-44-4444");
request.onsuccess = function(event) {
  // It's gone!
  alert("It's gone!");
};*/

// Uploading file and Parse 
function handleFileSelect() {
  var fileInput = document.getElementById("fileElem");

  var results = Papa.parse(fileInput.files[0], {
    header: true,
    dynamicTyping: true,
    complete: function(results) {
      console.log(results);

      passDataToIndexedDB(results);
    }
  })
};


function passDataToIndexedDB(dataObj) {
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
        //check dataObj data length
        //go thru each row and add to string
        //if new name or super is different then complete old one and insert into table
        //then start new string
        //repeat
        var source = "";
        var variable = "";
        var category = "";

        for (i=0; i < dataObj.data.length; i++) {
          if (dataObj.data[i].source != source || dataObj.data[i].category != category || dataObj.data[i].variable != variable) {
            if (text != undefined){
              var text = text.concat('}}');
              var jsonObj = JSON.parse(text);
              objStore.add(jsonObj);
            }
            var text = '{"source":"' + dataObj.data[i].source + '", "variable":"' + dataObj.data[i].variable + '", "category":"' 
            + dataObj.data[i].category + '", "type":"' + dataObj.data[i].type + '", "data":{"' + dataObj.data[i].fips + '":' 
            + dataObj.data[i].data;

            var source = dataObj.data[i].source;
            var category = dataObj.data[i].category;
            var variable = dataObj.data[i].variable;

            continue;

          } else {
            var text = text.concat(', "' + dataObj.data[i].fips + '":' + dataObj.data[i].data);
              if (i == dataObj.data.length-1) {
                var text = text.concat('}}');
                var jsonObj = JSON.parse(text);
                objStore.add(jsonObj);
              }

          }
        } 
      };
  };
}


// // Delete Database 
// window.indexedDB.deleteDatabase("DataStorage");









