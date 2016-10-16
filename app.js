var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json


// Wolfram Alpha
var APPID = "5HW2GQ-AQ3U8978VQ";
var wolfram = require('wolfram-alpha').createClient(APPID);

var request = require('request');

app.post('/v1/areli-knowledge', function(req, res){
  
  var jsonPayload = req.body;
  var action = jsonPayload.result.action;

  if (action === 'get.city.time') {

    var city = jsonPayload.result.parameters.city;
    getTime(city, function(err, time) {

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
 * Get info on a specific person in history.
 * Or that
 */
function getPeopleInfo(person, cb) {

  if (person == '') return cb('Could not find info.');

  //Clean the name.  Set to lower case then capitalizethe worlds
  var cleanedName = '';
  person = person.toLowerCase();
  var personWords = person.split(" ");
  personWords.forEach(function(word){
    cleanedName += word.charAt(0).toUpperCase() + word.slice(1, word.length)+" ";
  });

  var API_URL = 'http://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&exintro=&explaintext=&&titles='+encodeURI(cleanedName);
  request(API_URL, function(err, response, data){

    if (err) return cb(err);
    if (data) {
      var json = JSON.parse(data);
      var pages = json.query.pages;
      var summary = '';
      Object.keys(pages).forEach(function(key) {
        summary = pages[key].extract;
      });

      return cb(null, summary);
    }

  });

}


/**
 * Fetch the time for a specific city.
 *
 * @param city
 */
function getTime(city, cb) {

  var query = "What time is it in "+city;
  wolfram.query(query, function (err, result) {
    if (err) throw err;

    //Parse out the time data.
    var responseData = '';
    result.forEach(function(item) {
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

  var city = req.query.city;
  getTime(city, function(err, time){
    res.send(time);
  });

});

app.get('/v1/areli-knowledge/people', function(req, res){

  var person = req.query.person;
  getPeopleInfo(person, function(err, summary){
    res.send(summary);
  });

});



app.listen(3001, function(){
  console.log("Listening on 3001...");
})
