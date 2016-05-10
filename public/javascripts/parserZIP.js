
function preparseZIP(file, array)
{
	console.log('preParseZIP', file)
	zip.createReader(new zip.BlobReader(file), function(zipReader) {
					zipReader.getEntries(function(a){console.log(a)});
				}, function(error){console.error(error)});
}