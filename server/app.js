var express = require('express');
var async = require('async');
var Datastore = require('nedb');
var moment = require('moment');
var db = {};
var schedule = require('node-schedule');
var request = require('request');
var Keen = require('keen.io');
var _ = require('underscore');

var config = require('./config');

var client = Keen.configure({
    projectId: config.keen.projectId,
    writeKey: config.keen.writeKey
});

var app = express();
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

// Connect to an NeDB database
db.points = new Datastore({ filename: 'db/points', autoload: true });
db.routes = new Datastore({ filename: 'db/routes', autoload: true });
db.prices = new Datastore({ filename: 'db/prices', autoload: true });

//index on slugs on points
// db.points.ensureIndex({ fieldName: 'slug', unique: true }, function (err) {
// 	console.log("aahahha");
// });

app.all('*', function(req, res, next){
  if (!req.get('Origin')) return next();
  // use "*" here to accept any origin
  res.set('Access-Control-Allow-Origin', '*');
  // res.set('Access-Control-Allow-Max-Age', 3600);
  next();
});

var routes =[{start:"dtla", end:"smon"},{start:"smon", end:"dtla"},
			 {start:"dtla", end:"hlwd"},{start:"hlwd", end:"dtla"},
			 {start:"smon", end:"hlwd"},{start:"hlwd", end:"smon"},
			 {start:"grct", end:"upma"},{start:"upma", end:"grct"},
			 {start:"grct", end:"brok"},{start:"brok", end:"grct"},
			 {start:"upma", end:"brok"},{start:"brok", end:"upma"},
			 {start:"gogp", end:"pwll"},{start:"pwll", end:"gogp"},
			 {start:"gogp", end:"warf"},{start:"warf", end:"gogp"},
			 {start:"pwll", end:"warf"},{start:"warf", end:"pwll"}];

var POINTS = [
		{name:"Downtown LA (Walt Disney Concert Hall)",slug:"dtla",lat:"34.055515",lon:"-118.250039"},
		{name:"Santa Monica (Third Street Promenade)",slug:"smon",lat:"34.016243",lon:"-118.496159"},
		{name:"Hollywood (Mann Theatres)",slug:"hlwd",	lat:"34.102298",lon:"-118.340992"},
		{name:"Manhattan (Grand Central Terminal)",slug:"grct",lat:"40.752466",lon:"-73.976886"},
		{name:"Upper Manhattan (American Academy of Arts and Letters)",slug:"upma",lat:"40.833721",lon:"-73.947461"},
		{name:"Brooklyn (Barclays Center)",slug:"brok",lat:"40.682907",lon:"-73.975255"},
		{name:"Golden Gate Park (California Academy of Sciences)",slug:"gogp",lat:"37.770094",lon:"-122.466031"},
		{name:"Downtown SF (Powell & Market)",slug:"pwll",lat:"37.785114",lon:"-122.406677"},
		{name:"Fishermans Warf (Pier 39)",slug:"warf",lat:"37.808119",lon:"-122.40911"}]

app.get('/',function(req, res){
  res.render('index');  
});

//Seed database
// app.get('/points/seed',function(req,res){
// 	db.points.insert([{name:"LAX (Los Angeles International Airport)",slug:"lax",lat:"33.945452",lon:"-118.399974"},
// 		{name:"Downtown LA (Walt Disney Concert Hall)",slug:"dtla",lat:"34.055515",lon:"-118.250039"},
// 		{name:"Santa Monica (Third Street Promenade)",slug:"smon",lat:"34.016243",lon:"-118.496159"},
// 		{name:"Hollywood (Mann Theatres)",slug:"hlwd",	lat:"34.102298",lon:"-118.340992"},
// 		{name:"JFK (John F. Kennedy International Airport)",slug:"jfk",lat:"40.655839",lon:"-73.807594"},
// 		{name:"Manhattan (Grand Central Terminal)",slug:"grct",lat:"40.752466",lon:"-73.976886"},
// 		{name:"Upper Manhattan (American Academy of Arts and Letters)",slug:"upma",lat:"40.833721",lon:"-73.947461"},
// 		{name:"Brooklyn (Barclays Center)",slug:"brok",lat:"40.682907",lon:"-73.975255"},
// 		{name:"SFO (San Francisco International Airport)",slug:"sfo",lat:"37.625732",lon:"-122.377807"},
// 		{name:"Golden Gate Park (California Academy of Sciences)",slug:"gogp",lat:"37.770094",lon:"-122.466031"},
// 		{name:"Downtown SF (Powell & Market)",slug:"pwll",lat:"37.785114",lon:"-122.406677"},
// 		{name:"Fishermans Warf (Pier 39)",slug:"warf",lat:"37.808119",lon:"-122.40911"}],function(err){
// 			if(err)
// 			  res.json("Errror on seeding",err);
// 			else
// 			  res.json("Database seeded");

// 			res.end();
// 		})
// });

app.get('/points/delete',function(req,res){
	db.points.remove({}, { multi: true },function(err,doc){
		res.json(doc);
	})
});

app.get('/points/all',function(req,res){
	db.points.find({},function(err,doc){
		res.json(doc);
	})
});

//Launch crawler
app.get('/launch',function(req,res){
	var rule = new schedule.RecurrenceRule();
	rule.minute = new schedule.Range(0, 60, 10);

	var j = schedule.scheduleJob(rule, function () {
	  // Do something
	  getDataFromUber();
	});
	res.json('launched');
	res.end();
});

app.get('/point/:slug',function(req,res){
	// db.points.find({slug:req.params.slug},function(err,doc){
	// 	res.json(doc);
	// })

	var p = _.findWhere(POINTS,{slug:req.params.slug})
	console.log(p)
	res.json(p);
});

app.get('/prices/delete',function(req,res){
	db.prices.remove({}, { multi: true },function(err,doc){
		res.json(doc);
	})
});

app.get('/prices/all',function(req,res){
	res.set('Access-Control-Allow-Origin', '*	');
	db.prices.find({},function(err,doc){
		res.json(doc);
	})
});

app.get('/prices/:start/:end',function(req,res){
	db.prices.find({start:req.params.start,end:req.params.end},function(err,doc){
		res.json(doc);
	})
});

function getDataFromUber(){
	console.log('called',Date.now());

	async.each(routes,function(item){
		console.log(item.start, item.end);
		var data_points=[];
		var url =  "https://api.uber.com/v1/estimates/price"
		url += "?"
		async.series({
		    startPoint: function(callback){
		    	var doc = _.findWhere(POINTS,{slug:item.start})
		    	console.log("startPoint",doc,item.start)
		    	callback(null,doc);
		  //       db.points.findOne({ slug: item.start },function(err,doc){
		  //       	console.log("startPOint",item.start,doc);
				// 	callback(null,doc);
				// });
		    },
		    endPoint: function(callback){
		    	var doc = _.findWhere(POINTS,{slug:item.end})
		    	callback(null,doc);
		  //       db.points.findOne({ slug: item.end },function(err,doc){
		  //       	console.log("endPOint",item.end,doc);
				// 	callback(null,doc);
				// });
		    }
		},
		function(err, results) {
		    // results is now equal to: {startPoint: 1, endPoint: 2}
		    if(results){
		    	url += "start_latitude="
			  	url += results.startPoint.lat;
			  	url += "&start_longitude="+results.startPoint.lon
			  	url += "&end_latitude="
			  	url += results.startPoint.lat;
			  	url += "&end_longitude="+results.endPoint.lon
			  	url += "&server_token="+config.uber.server_token
			  	callUberAPI(url,item.start,item.end);
			  	console.log(url);
			}else if(err){
			    console.log("ERROR",err);
			}
		});


		// findPointInfo(item.start,function(res){
		// 	console.log(res)
		// 	url += "start_latitude="
		//   	url += res.lat;
		//   	url += "&start_longitude="+res.lon
		//   	findPointInfo(item.end,function(res){
		// 	  	url += "&end_latitude="
		// 	  	url += res.lat;
		// 	  	url += "&end_longitude="+res.lon
		// 	  	url += "&server_token="+config.uber.server_token
		// 	  	console.log("last",url);
		// 	  	callUberAPI(url,item.start,item.end)
		// 	})

			
		// })

		
		// console.log("point",findPointInfo(item.start));
		
		// request.get('')
	})
	
}

function callUberAPI(url,start,end){
	console.log("called",start,end,moment.utc().format());
	var result;
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    console.log(body) // Print the google web page
	    var prices = JSON.parse(body).prices;
	    db.prices.insert({start:start,end:end,date:moment.utc().format(),prices:prices})
	    
	    _.each(prices,function(item){
	    	// console.log(item)
	    	var ev = {
	    		start:start,
	    		end:end,
	    		date:moment.utc().format(),
	    		localized_display_name:item.localized_display_name,
	    		display_name:item.display_name,
	    		high_estimate: parseInt(item.high_estimate),
                low_estimate: parseInt(item.low_estimate),
	            surge_multiplier: item.surge_multiplier,
	            estimate: parseInt(item.estimate.replace("$",'')),
	            currency_code: item.currency_code,
	            duration: item.duration,
			    distance: item.distance
	        }
	        if(item.display_name != "uberTAXI"){
		        // console.log(ev);
			    client.addEvent("newPricesCollection", ev, function(err, res) {
				    if (err) {
				        console.log("Oh no, an error!",err);
				    } else {
				        console.log("Hooray, it worked!");
				    }
				});
	        }
	    })
	    
	  }
	})
}

function findPointInfo(slug,callback){
	var result;
	console.log("findPointInfo called")
	db.points.findOne({ slug: slug },function(err,doc){
		console.log("DOC",doc)
		callback(doc);
	});
}

var port = process.env.PORT || 3000;
app.listen(port, function(req,res) {
  console.log("Listening on " + port);

  // var points =[]
  // db.points.findOne({ slug: "sf_airport" }, function(err,doc){
  // 	console.log(doc)
  // 	console.log(err);
  // 	point.push(doc)
  // 	// return doc;
  // })
  // console.log(points)

  // findPointInfo("sf_airport",function(res){
  // 	points.push(res);
  // 	console.log(points);
  // })
  // launchSchedule()

  var rule = new schedule.RecurrenceRule();
	rule.minute = new schedule.Range(0, 60, 10);

	var j = schedule.scheduleJob(rule, function () {
	  // Do something
	  getDataFromUber();
	});
});
