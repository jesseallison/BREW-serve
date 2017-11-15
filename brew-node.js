// ************************************************

//	BREW Server for the Baton Rouge Entrepreneurship Week 2017
//
// based on NEXUS Hub Node Server
//				Jesse Allison (2017)
//
//	To Launch:
//		NODE_ENV=production sudo node nexus-server.js
//		(sudo is required to launch on port 80.)

// ************************************************


/*

 This app serves a page to each phone (and iPad)
	- communicates to the device 
		- what quote to display by number
		- sound file to play back
		- color to flash
	- receives from the device
		- occasional pings to know that it is still connected and can be controlled
		- touches for which quote is displaying? 
- A controller (the image tracker) generates when and what to send to the various devices.
	- alternatively, this app could do that control
- Sends data to an image tracker upon triggering
	- Could be a web page hosted from here (or a communication portal hosted from here but loaded in max)
	- hsl & quote number (perhaps this should all be done in Max and passed up to the server to be sent along to trigger. Yes.)
- image tracker passes on to a visualizer
	- center x,y  (normalized)
	- hsl  [0.-360., 0.-100.,0.-100.]
	- quote #  [1-114]
- Visualizers
	- Projection on people
		- once tracked, it splashes the location of the person with color
	- Wall 
		- Projects quote, & possible splashes
		- When new quote is selected to distribute, it is sent to the wall
	- Floor
		- 'detectedDevice', {x: x, y: y, quoteNumber: quoteNumber, quotePhrase: quotePhrase, h: color[0], s: color[1], l: color[2]}
		-

*/


var _ = require('lodash');

var maxActiveDelayTime = 15;		// 15 second delay time before thinking the user is disconnected

	// Testing Variables [set to 0 to disable, otherwise, set in ms]
var testTriggerPhraseDuration = 15000;
var testClientDetectedDuration = 20000;
var testPrimaryQuoteDuration = 18000;

var colorPalette = [
	[0., 0., 0.],
	[1., 1., 1.]
];

var SERVER_PORT = 3000;


// Setup web app - using express to serve pages
var express = require('express'),
		sio = require('socket.io'),
		http = require('http');

var serverPort = process.env.PORT || SERVER_PORT;

var app = express();
	app.use(express.static(__dirname + '/public'));

	// server is the node server (web app via express)
		// this code can launch the server on port 80 and switch the user id away from sudo
		// apparently this makes it more secure - if something goes awry it isn't running under the superuser.
var server = http.createServer(app)
	.listen(serverPort, function(err) {
		if (err) return cb(err);

		var uid = parseInt(process.env.SUDO_UID);	// Find out which user used sudo through the environment variable
		if (uid) process.setuid(uid);			// Set our server's uid to that user
		console.log('Server\'s UID is now ' + process.getuid());
	});

	// start socket.io listening on the server
var io = sio.listen(server);


	//***	OSC Setup for sending (and receiving) OSC (to Max) ***//

		// var osc = require('node-osc');
				// oscServer is used for receiving osc messages (from Max)
		// var oscServer = new osc.Server(7746, '167.96.127.8');
		// oscServer.on("message", function (msg, rinfo) {
		// 			// console.log("OSC message:");
		// 			// console.log(msg);
		// 					// Setup messages to receive here //
		// 	if(msg[0] = "/goToSection") {
		// 		currentSection = msg[1];
		// 		shareSection(currentSection);
		// 	}
		// });

				//***  oscClient is used to send osc messages (to Max) ***//
		// var oscClient = new osc.Client('167.96.127.8', 7745);



// *********************
	// Global Variables!

var ioClients = [];		// list of clients who have logged in.
var currentSection = 0;		// current section.
		// Specific clients who we only want one of.
var vizID,
		floorVizID,
		conrollerID,
		imageTrackerID;

// *********************



// TESTING - GENERATE FAKE calls. *********
	console.log("Testing Setup");

	if(testTriggerPhraseDuration) {
		setInterval(function() { 
	    io.sockets.emit('triggerPhrase', {x:getRandomInt(0, 1024), y:getRandomInt(0, 768), quoteNumber:getRandomInt(0, 113), h:getRandomInt(0, 360), s:getRandomInt(0, 100), l:getRandomInt(0, 100)});
			console.log("Testing triggerPhrase");
	  }, testTriggerPhraseDuration);
	console.log("Testing triggerPhraseDuration: ", testTriggerPhraseDuration);
	}

	if(testPrimaryQuoteDuration) {
		console.log("Testing testPrimaryQuoteDuration: ", testPrimaryQuoteDuration);
		setInterval(function() { 
			if(vizID) {
					data = {quoteNumber: getRandomInt(0, 113)};
					io.to(vizID).emit("primaryQuote",  data, 1);
					console.log("Testing primaryQuote: ", data.quoteNumber);
	    } 
	  }, testPrimaryQuoteDuration);
	}
	
	if(testClientDetectedDuration) {
		console.log("Testing testClientDetectedDuration: ", testClientDetectedDuration);
		setInterval(function() { 
	    if(floorVizID) {
				data = {x:getRandomInt(0, 1024), y:getRandomInt(0, 768), quoteNumber:getRandomInt(0, 113), h:getRandomInt(0, 360), s:getRandomInt(0, 100), l:getRandomInt(0, 100)}
					io.to(floorVizID).emit('clientDetected', data, 1);
					//console.log("Testing clientDetected: ", data);
		  }
	  }, testTriggerPhraseDuration);
	}
	
// END TESTING - *************************


	// Respond to web sockets with socket.on
io.sockets.on('connection', function (socket) {
	var ioClientCounter = 0;		// Can I move this outside into global vars?

	socket.on('addme', function(data) {
		username = data.name;
		var userColor = data.color;
		var userNote = data.note;
		var userLocation = data.location;
		var userActive = new Date();

		if(username == "viz"){
			vizID = socket.id;
			console.log("Hello viz: " + vizID);
		}
		
		if(username == "floorViz"){
			floorVizID = socket.id;
			console.log("Hello floorViz: " + floorVizID);
		}
		

		if(username == "controller"){
			controllerID = socket.id;
			console.log("Hello Controller: " + controllerID);
		}

		if(username == "image_tracker"){
			imageTrackerID = socket.id;
			console.log("Hello image tracker: " + imageTrackerID);
		}

		if(username == "a_user") {
			ioClients.push(socket.id);
		}

		socket.username = username;  // allows the username to be retrieved anytime the socket is used
		// Can add any other pertinent details to the socket to be retrieved later
		// socket.userLocation = userLocation;
		// socket.userColor = userColor;
		// socket.userNote = userNote;
		socket.userActive = userActive;
		
		console.log(socket.userActive.getTime());
		// .emit to send message back to caller.
		socket.emit('chat', 'SERVER: You have connected. Hello: ' + username + " " + socket.id + 'Color: ' + socket.userColor);
		// .broadcast to send message to all sockets.
		//socket.broadcast.emit('chat', 'SERVER: A new user has connected: ' + username + " " + socket.id + 'Color: ' + socket.userColor);
		// socket.emit('bump', socket.username, "::dude::");
		var title = getSection(currentSection);

		if(username == "a_user") {
			//console.log("Hello:", socket.username, "currentSection:", currentSection, "id:", socket.id, "userColor:", socket.userColor, "userLocation:", socket.userLocation, "userNote:", socket.userNote);
		}

		socket.emit('setSection', {sect: currentSection, title: title});
		// io.sockets.emit('setSection', {sect: sect, title: title});
		if(username == "a_user") {
			// oscClient.send('/causeway/registerUser', socket.id, socket.userColor, socket.userLocation[0],socket.userLocation[1], socket.userNote);
			if(imageTrackerID) {
					// io.to(imageTrackerID).emit('/causeway/registerUser', {id: socket.id, color: socket.userColor, locationX: socket.userLocation[0], locationY: socket.userLocation[1], note: socket.userNote}, 1);
				// console.log("Added New User", {id: socket.id, color: socket.userColor, locationX: socket.userLocation[0], locationY: socket.userLocation[1], note: socket.userNote});
	    }
		}
	});


		// ***************  Utility Functions **************
	
	
	 socket.on('disconnect', function() {
		// ioClients.remove(socket.id);	// FIXME: Remove client if they leave
		io.sockets.emit('chat', 'SERVER: ' + socket.id + ' has retired');
	 });


			// Constant contact Is the user still connected?  Update to new checkIn time
	socket.on('checkIn', function (data) {
		if(socket.userActive){
			timeLapse = (Date.now() - socket.userActive.getTime())/1000. ;
			// console.log("Now: "+ Date.now() + " - last time: " + socket.userActive.getTime() + " = " + timeLapse + " Seconds");
		}
		socket.userActive = new Date();
	});
	
	isStillActive = function(lastActive) {
		var timeLapse = (Date.now() - lastActive.getTime())/1000. ;
		// console.log(timeLapse + " Seconds");
		if(timeLapse < maxActiveDelayTime) {
			return 1;
		} else {
			return 0;
		}
	}
	
	getListOfUsers = function(){
		var userList = _(io.sockets.connected).map(function(e) {
			if(e.userActive) {
				if(isStillActive(e.userActive)) {
					// console.log("active ID: " + e.id);
			    return e.id;
				}
			}
		});
		console.log("Current Users: " + _.size(userList) + userList);
			// Return the user ID list as an array.
		var userArray = _.toArray(userList);
		console.log("Current UserArray: " + userArray.length + userArray);
		// var noULDuplicates = _.uniqBy(userList, "id");
		// console.log("Current noULDuplicates: " + _.size(noULDuplicates) + noULDuplicates);
		return userArray;
	}
	

	
	
	// ********** Client Devices - people's phones ********
	
			// Testing a Random Emission //
	socket.on('testRandomEmitter', function(data) {
		user = socket.id;
		console.log('user: ' + user);
		var color = [360., 100., 100.];
		var quotePhrase = "Hey There Bob Howdy";
		var quoteNumber = "5";
		
		io.to(user).emit('triggerPhrase', {quoteNumber: quoteNumber, quotePhrase: quotePhrase, color: color}, 1);
	});
	
	
			// Trigger a phrase on x simultaneous devices. //
	socket.on('triggerPhrase', function (data) {
				// data.quoteNumber, .quotePhrase, .color, .simultaneousNumber
			console.log("triggerPhrase " + data.quotePhrase );
		var color = data.color;		// as hsl values
		var quotePhrase = data.quotePhrase;
		var quoteNumber = data.quoteNumber;

		//socket.emit("triggerPhrase",  {quoteNumber: quoteNum, quotePhrase: quotePhrase, color: color, simultaneousNumber: simultaneousNumber});
		
		var users = getListOfUsers();
		console.log("Current Users: " + users.length + users);
		if(users.length >= data.simultaneousNumber) {								
			var randomUsers =  _.castArray(_.sample(users, data.simultaneousNumber));
			console.log("Random Users Selected: " + randomUsers);
			_.each(randomUsers, function(randomUser){
				// var color = [360., 100., 100.];
				// var quotePhrase = "Hey There Bob Howdy";
				// var quoteNumber = "5";
				if(randomUser) {
					console.log("Random User Selected: " + randomUser);
					//console.log("triggerPhrase " + quotePhrase );
					io.to(randomUser).emit('triggerPhrase', {quoteNumber: quoteNumber, quotePhrase: quotePhrase, h: color[0], s: color[1], l: color[2]}, 1);
				}
				
						// Use this if you want to send back to the installation (may be used to help synchronize timing...)
						// Also will notify of the user number that was triggered.
				//if(imageTrackerID) {
				//	io.to(imageTrackerID).emit('triggerPhrase', {user: randomUser, quoteNumber: quoteNumber, quotePhrase: quotePhrase, color: color}, 1);
				//		// console.log("Item", data);
			  //}
			});
		}
	});
	

	// ********** Floor Projection ********



	socket.on('clientDetected', function(data) {
		if(floorVizID) {
				io.to(floorVizID).emit('clientDetected', data, 1);
				console.log("clientDetected: ", data);
				// socket.emit('triggerPhrase', {x:getRandomInt(0, 1024), y:getRandomInt(0, 768), quoteNumber:getRandomInt(0, 113), h:getRandomInt(0, 360), s:getRandomInt(0, 100), l:getRandomInt(0, 100)}) 
	  }
	});


		// io.to(randomUser).emit('detectedDevice', {x: x, y: y, quoteNumber: quoteNumber, quotePhrase: quotePhrase, h: color[0], s: color[1], l: color[2]}, 1);


	// ********** Wall Projection ********

			// Pass along the current quote for reading.  This will change periodically, but not as often as triggerPhrase
	socket.on('primaryQuote', function(data) {
		if(vizID) {
				io.to(vizID).emit('primaryQuote', data, 1);
				// console.log("primaryQuote: ", data.quoteNumber);
    }
	});





	socket.on('section', function(data) {
		console.log("Section is now: "+ data);
		currentSection = data;
		sendSection(currentSection);
	})

	// *********************
			// Functions for handling stuff

			// **** SECTIONS ****
	var sectionTitles = ["Welcome", "Preface", "Section 1", "Section 2", "Section 3",
		"Section 4", "Section 5", "Section 6", "Section 7", "Section 8", "Section 9",
		"Section 10", "Section 11", "Section 12", "Section 13", "Section 14", "Section 15",
		"Section 16", "Section 17", "Section 18", "Section 19", "Section 20", "Section 21",
		"Section 22", "Section 23", "Section 24", "Section 25", "Section 26", "Section 27",
		"Section 28", "Section 29", "Section 30", "Section 31", "Section 32", "Section 33",
		"End"];

	// Todo: Add sections to correspond to organ interactions
	// sendSection(currentSection);	 // Sets everyone's section
	sendSection = function (sect) {
		var title = getSection(sect);
		io.sockets.emit('setSection', {sect: sect, title: title});
		if(imageTrackerID) {
				io.to(imageTrackerID).emit('/causeway/currentSection', {section: sect, title: title}, 1);
				// console.log("Section sent", sect);
    }
	};

		// Section shared from Max to UIs
	shareSection = function(sect) {
		var title = getSection(sect);
		io.sockets.emit('setSection', sect, title);
	};

	getSection = function(sect) {
		var title = "none";

		if(sect == 'w'){
			title = sectionTitles[0];
		}

		if(sect == 'e'){
			title = sectionTitles[35];
		}

		if(sect !== 'e' && sect !== 'w') {
			sect++;
			title = sectionTitles[sect];
		}

		return title;
	};

	// pick a random user from those still connected and return the user
	getRandomUser = function() {
		var randomUser = Math.floor(Math.random() * ioClients.length);
		var user = io.sockets.socket(ioClients[randomUser]);
		return user;
	};

	getNextUser = function() {
		// console.log("ioClients Length: ", ioClients.length);
		// console.log("io.sockets.socket length: ", io.sockets.socket.length);
		var user = io.sockets.socket(ioClients[ioClientCounter]);
		ioClientCounter = ioClientCounter + 1;
		if (ioClientCounter >= ioClients.length) {
			ioClientCounter = 0;
		}
		// console.log("Username ", user.username);

		return user;
	};

});


function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}


function getRandomColor() {
	var letters = '0123456789ABCDEF'.split('');
	var color = '#';
	for (var i = 0; i < 6; i++ ) {
	    color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}
