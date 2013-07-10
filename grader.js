#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var cheerioUrl = function(strText) {
    return cheerio.load(strText);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

/*
Given a text string, check if it has the elements specified in the checksfile file
strText: a text string in html format
checksfile: a file in json format with a list of html elements to check for
return: json object with an array of elements specified in checksfile, and whether they are present in strText
*/
var checkUrl = function(strText, checksfile) {
	
	//use cheerio to load the text? 
    $ = cheerioUrl(strText);
	
	//parse the contents of checksfile into a json object
    var checks = loadChecks(checksfile).sort();
	
	//Check if each object in the checks is present in the & thing
	var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
		.option('-u, --url [url]', 'Path to internets file')
        .parse(process.argv);
		
		//Were we given a url to check, or a file?
		if (program.url)
		{
			//Get the file using restler
			rest.get(program.url).on('complete', function(fileContents) 
			{			
				//TODO: do some error checking?
				
				//get a json object of whatever is available
				var checkJson = checkUrl(fileContents, program.checks);
				
				//parse that json object into a string and write it out to the console
				var outJson = JSON.stringify(checkJson, null, 4);
				console.log(checkJson);
				
				//write the results out to a file for submission
				fs.writeFileSync("results.txt", outJson);
			}
			);
		}
		else
		{
			//we have an html file
			var checkJson = checkHtmlFile(program.file, program.checks);
			var outJson = JSON.stringify(checkJson, null, 4);
			console.log(outJson);
		}
} else {
    exports.checkHtmlFile = checkHtmlFile;
}