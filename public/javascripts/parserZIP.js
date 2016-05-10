var callBack 

var getExtension = function(fileName)
{
	var re = /(?:\.([^.]+))?$/;
	var ext = re.exec(fileName)[1];
	return ext;
}

var ZIPParseHelper = function(j, entries, fileList)
{
	if(j==entries.length)
		callBack();
	else
	{
		entries[j].getData(new zip.BlobWriter(), function(fileIndex){return function(blob) {
			var fileName = entries[fileIndex].filename;
			fileName = fileName.split('/');
			fileName = fileName[fileName.length-1]
			var extension = getExtension(fileName)
			if(typeof extension !='undefined')
			{
				var extractedFile = new File([blob],fileName )
				console.log(fileList);
				fileList.push(extractedFile);
			}
			ZIPParseHelper(j+1, entries, fileList)
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
						ZIPParseHelper(0, entry, fileList);
					});
				}, function(error){console.error(error)});
}