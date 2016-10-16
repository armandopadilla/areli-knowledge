var express = require('express');
var app = express();

var APPID = "5HW2GQ-AQ3U8978VQ";
var wolfram = require('wolfram-alpha').createClient(APPID);

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json

app.post('/v1/areli-knowledge', function(req, res){
  
  var jsonPayload = req.body;
  var action = jsonPayload.result.action;

  if (action === 'get.city.time') {
	var city = jsonPayload.result.parameters.city;
	getTime(city, function(err, time){

		var response = {
        	"speech": "It's currently "+time+" in "+city,
        	"displayText": "It's currently "+time+" in "+city,
        	"data": "It's currently "+time+" in "+city,
        	"contextOut": [],
        	"source": "Areli"
  		}	

	
		res.json(response);

	});
  }
  else {
    //do something
  }


});

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
app.get('/v1/areli-knowledge', function(req, res){

  var city = req.query.city;
  var time = getTime(city, function(err, time){
    res.send(time);
  });

});


app.listen(3001, function(){
  console.log("Listening on 3001...");
})
