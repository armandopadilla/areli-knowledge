/**
 * Glue that combines the input sent in from API.ai
 * and the knowledge.  The "knowledge" is the site that contains
 * the algos that provide what the user has requested.  For example,
 * if we want to know about the weather, we go to weather.com since that is the
 * neuron that contains the knowledge. Get it?
 *
 *
 * @type {*|exports|module.exports}
 */
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');

app.use(bodyParser.json());

// Wolfram Alpha
var APPID = "5HW2GQ-AQ3U8978VQ";
var wolfram = require('wolfram-alpha').createClient(APPID);


/**
 * Listens for incoming request from the API.ai platform.
 * This is called once API.ai has parsed the request from the user.
 *
 * Strategy.
 *
 */
app.post('/v1/areli-knowledge', function(req, res){
  
  // Handles HTTP POST requests to a specified endpoint.
  var jsonPayload = req.body;
  var action = jsonPayload.result.action;

  if (action === 'get.city.time') {

    var city = jsonPayload.result.parameters.city;
    getTime(city, function(err, time) {

      // Gets current time for a specific city.
      var response = {
        	"speech": "It's currently "+time+" in "+city,
        	"displayText": "It's currently "+time+" in "+city,
        	"data": "It's currently "+time+" in "+city,
        	"contextOut": [],
        	"source": "Areli"
  		};

		  res.json(response);

    });
  } else if(action === 'get.people.info') {

    var person = jsonPayload.result.parameters.person;
    getPeopleInfo(person, function(err, summary) {

      // Gets information about a person.
      var response = {
        "speech": summary,
        "displayText": summary,
        "data": summary,
        "contextOut": [],
        "source": "Areli"
      };

      res.json(response);

    });

  }

});

/**
 * @description Fetches a person's Wikipedia summary, cleans their name to title case,
 * and returns the first paragraph of the summary.
 *
 * @param {string | number | object | undefined | null} person - Used to specify the
 * name of a person to retrieve information about.
 *
 * @param {(error | string)} cb - A callback function used to return results or error
 * messages to the caller.
 *
 * @returns {string | (string[]) | null} The first paragraph of a Wikipedia article
 * summary.
 */
function getPeopleInfo(person, cb) {

  if (person == '') return cb('Could not find info.');

  //Clean the name.  Set to lower case then capitalizethe worlds
  var cleanedName = '';
  person = person.toLowerCase();
  var personWords = person.split(" ");
  personWords.forEach(function(word){
    // Capitalizes the first letter of each word in the cleanedName string.
    cleanedName += word.charAt(0).toUpperCase() + word.slice(1, word.length)+" ";
  });

  var API_URL = 'http://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&exintro=&explaintext=&titles='+encodeURI(cleanedName);
  request(API_URL, function(err, response, data){

    // Parses Wikipedia API response.
    if (err) return cb(err);
    if (data) {

      var json = JSON.parse(data);
      var pages = json.query.pages;
      var summary = '';
      Object.keys(pages).forEach(function(key) {
        // Executes for each key in the pages object.
        summary = pages[key].extract;
      });

      var parags = (summary.split("\n"));

      return cb(null, parags[0]);
    }

  });

}


/**
 * @description Queries the Wolfram Alpha API to retrieve the current time in a
 * specified city, parses the response to extract the time data, and returns it as a
 * string to the callback function.
 *
 * @param {string} city - Represented as the location for which the current time is
 * to be retrieved.
 *
 * @param {(error, result) => void} cb - Invoked when the function has completed
 * execution, passing the result as an argument.
 *
 * @returns {string} The current time in the specified city.
 */
function getTime(city, cb) {

  var query = "What time is it in "+city;
  wolfram.query(query, function (err, result) {
    // Executes a Wolfram Alpha query.
    if (err) throw err;

    //Parse out the time data.
    var responseData = '';
    result.forEach(function(item) {
      // Iterates through an array of items,
      if (item.title == 'Result') {
        var data = item.subpods[0].text;
        var timeElem = data.split("|");
        var time = timeElem[0];
        responseData = time;
      }
    });

   return cb(null, responseData);

  });

}

/**
 * used for testing...
 */
app.get('/v1/areli-knowledge/time', function(req, res){

  // Handles HTTP GET requests to retrieve time information for a specified city.
  var city = req.query.city;
  getTime(city, function(err, time){
    // Calls a callback with error and result.
    res.send(time);
  });

});

app.get('/v1/areli-knowledge/people', function(req, res){

  // Handles HTTP GET requests to the '/v1/areli-knowledge/people' endpoint.
  var person = req.query.person;
  getPeopleInfo(person, function(err, summary){
    // Calls a callback with two parameters: an error and a summary.
    res.send(summary);
  });

});

app.listen(3001, function(){
  // Listens for incoming connections on port 3001.
  console.log("Listening on 3001...");
})
