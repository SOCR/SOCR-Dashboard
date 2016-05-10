function preparseZIP(file, array)
{
	console.log('preParseZIP')
	zip.createReader(new zip.BlobReader(file), function(zipReader) {
					zipReader.getEntries(function(a){console.log(a)});
				}, onerror);
}