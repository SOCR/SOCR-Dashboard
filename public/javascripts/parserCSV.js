function preparseCSV(file, array)
{
	console.log('preParseCSV')
	array.push(file);
}

function parseCSV(file, indexedDBtable, callback, indexedDBname)
{
	  
		console.log(indexedDBtable, file.name)
		Papa.parse(file, {
		  header: true,
		  dynamicTyping: true,
		  chunk: function(block){
			  //open transaction for writing
			  var openRequest = indexedDB.open(indexedDBname);
			  
			  //error opening transaction
			  openRequest.onerror = function(event) {
				alert("Database error: " + event.target.errorCode);
			  };
			  
			  openRequest.onsuccess = function(event){
			  
				//open and clear correct table
				var db = event.target.result;
				var transaction = db.transaction([indexedDBtable], "readwrite");
				var objStoreTable = transaction.objectStore(indexedDBtable);
				objStoreTable.clear();

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
			  }
		  },
		  complete: function() {
			console.log("All done");
			//getVariablesList();
			callback();

		  }
		});
	  
}