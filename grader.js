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
var sys = require('util');
var fs = require('fs');
var rest = require('restler');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var TEMPFILE_DEFAULT = "";
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

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var geturl = function(data) {
    console.log('data:'+data);
    rest.get(data).on('complete', function(result) {
	if (result instanceof Error) {
	    sys.puts('Error: ' + result.message);
	    this.retry(5000); // try again after 5 sec
	} else {
	    // http://stackoverflow.com/questions/2496710/nodejs-write-to-file
	    sys.puts(result);
	    TEMPFILE_DEFAULT = "index1.html";
	    fs.writeFile("index1.html", result, function(err) {
		if(err) {
		    console.log(err);
		} else {
		    console.log("The file was saved!");
		}
	    });
	}
    });
    return "index1.html";
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
	.option('-u, --url <url>', 'Resource url')
        .parse(process.argv);
    console.log(program.url);
    
    if (!program.url) {
	console.log('case 1');
	console.log('Taking default fille :'+ program.file);
	var checkJson = checkHtmlFile(program.file, program.checks);
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
    } else {
	console.log('case 3');
	console.log('Taking new file');
	rest.get(''+program.url).on('complete', function(result) {
	    if (result instanceof Error) {
		sys.puts('Error: ' + result.message);
		this.retry(5000); // try again after 5 sec
	    } else {
		// http://stackoverflow.com/questions/2496710/nodejs-write-to-file
		sys.puts(result);
		TEMPFILE_DEFAULT = "index1.html";
		fs.writeFile("index1.html", result, function(err) {
		    if(err) {
			console.log(err);
		    } else {
			console.log("The file was saved!");
			var checkJson = checkHtmlFile("index1.html", program.checks);
			var outJson = JSON.stringify(checkJson, null, 4);	
			console.log(outJson);
		    }
		    
		});
		//		return "index1.html"

	    }
	});
	
    }
    
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
