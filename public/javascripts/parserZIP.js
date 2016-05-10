var callBack 

var ZIPParseHelper = function(j, entries)
{
	if(j==entries.length)
		callBack();
	else
	{
		entries[j].getData(new zip.BlobWriter(), function(fileIndex){return function(blob) {
			console.log(new File([blob],entries[fileIndex].filename ))
			ZIPParseHelper(j+1, entries)
		}}(j))
	}
}

function preparseZIP(file, array, fileList, callback)
{
	callBack = callback;
	console.log('preParseZIP', file)
	zip.createReader(new zip.BlobReader(file), function(zipReader) {
					zipReader.getEntries(function(entry){
					console.log(entry)
						ZIPParseHelper(0, entry);
					});
				}, function(error){console.error(error)});
}