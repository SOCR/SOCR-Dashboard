function preparseCSV(file, array)
{
	console.log('preParseCSV')
	array.push(file);
}

function parseCSV(file, table, callback)
{
	  Papa.parse(file, {
	  header: true,
	  dynamicTyping: true,
	  chunk: function(block){

		//write header and datatype to db
		var header = {};
		for (i=0; i < block.meta.fields.length; i++){
		  header[block.meta.fields[i]] = typeof block.data[0][block.meta.fields[i]];
		}
		// console.log(header);
		table.add(header);

		//write each data object to db
		for (i=0; i < block.data.length; i++){
		  table.add(block.data[i]);
		}
	  },
	  complete: function() {
		console.log("All done");
		//getVariablesList();
		callback();

	  }
	});
}