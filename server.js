var express = require('express');
var app = express();
var sassMiddleware = require('node-sass-middleware');
var path = require('path');
var session = require('express-session');
var bodyParser = require('body-parser');
var spawn = require("child_process").spawn;
var device = require('express-device');
var http = require('http');
var lineReader = require('line-reader');
var fs = require('fs');
var movies = require('./movies.json');
var json = require('json-update')
var movieQueue;
var isLiveStreamOn = false;
var queue = [];

app.use(session({
	secret: 'super secret', 
	resave: false, 
	saveUninitialized: true
}));

app.use(device.capture());

app.use("/public", express.static('public'));
app.use('/scripts', express.static(__dirname + '/node_modules/'));

// Track request and ban ip that makes a db request


// Check Blacklist
app.use(function (req, res, next) {
	var banned = false;
    var request_ip = req.ip 
            || req.connection.remoteAddress 
            || req.socket.remoteAddress 
            || req.connection.socket.remoteAddress;
    if (request_ip.substr(0, 7) == "::ffff:") {
	  request_ip = request_ip.substr(7)
	}
	if (fs.existsSync('blacklist.txt')) {
		lineReader.eachLine('blacklist.txt', function(ip, last_ip) {
			if (ip == request_ip) {
				banned = true;
				res.status(403).end('forbidden');
			} 
			if (last_ip && (banned == false)) {
				next();
			}
		});
	} else {
		next();
	}
});

app.use(function(req, res, next) {
	var request_ip = req.ip;
	if (request_ip.substr(0, 7) == "::ffff:") {
	  request_ip = request_ip.substr(7)
	}
	spawn('python',["./python/trackIp.py", request_ip, req.path]);
	next();
});

app.use(sassMiddleware({
  src: '/stylesheets',
  force: true
}));

app.use(express.static(path.join(__dirname, 'public')));
app.locals.basedir = path.join(__dirname, 'views');

// Middleware for bodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// View Engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.get('/', function(req, res) {
	if (req.device.type != 'desktop') {
		res.render('error/device-not-supported');
	}
	else {
		res.render('index');
	}
});

app.get('/gameofthrones/*', function(req,res) {
	if (req.device.type != 'desktop') {
		res.render('error/device-not-supported');
	} else {
		res.render(req.path.slice(1));
	}
});

app.get('/rickandmorty/*', function(req,res) {
	if (req.device.type != 'desktop') {
		res.render('error/device-not-supported');
	} else {
		res.render(req.path.slice(1));
	}
});

function convertDate(month, day, hour, minute) {
	var date = new Date(2017, month - 1, day, hour, minute, 0);
	var utcDate = new Date(date.toUTCString());
	return (Math.floor(utcDate.getTime()/1000) + 25200);
};

app.post('/getNextMovie', function(req, res) {
	var now = Math.floor((new Date).getTime()/1000);
	// Update queries to see if movie is over
	// Pretty inefficient atm
	for (i = 0; i < queue.length; i++) {
		if (queue[i]['end'] < now) {
			if (i > -1) {
				console.log(now);
			    queue.splice(i, 1);
			    i = 0;
			}
		}
	}
	if (queue.length > 0) {
		res.end(JSON.stringify(queue[0]));
	} else {
		res.end('null');
	}
});

app.post('/isLiveStreamOn', function(req, res) {
	if (isLiveStreamOn == true) {
		res.end('true');
	} else {
		res.end('false');
	}
});

function compareDate(a, b) {
	if (a['start'] < b['start']) {
		return -1;
	} else {
		return 1;
	}
}

function checkTimeConflict(tmp) {
	for (i = 0; i < queue.length; i++) {
		if (queue[i]['start'] <= tmp['start'] 
				&& queue[i]['end'] > tmp['start']) {
			return (-1);
		} 
		if (queue[i]['start'] >= tmp['start'] 
				&& queue[i]['start'] < tmp['end']) {
			return (-1);
		}
	}
	return (0);
}

app.post('/addMovieToQueue', function(req, res) {
	let movie = req.body;

	// movie['month'] = parseInt(movie['month']);
	// movie['day'] = parseInt(movie['day']);
	// movie['hour'] = parseInt(movie['hour']);
	// movie['minute'] = parseInt(movie['minute']);
	// movie['start'] = convertDate(movie['month'], movie['day'], movie['hour'], movie['minute']);
	movie['start'] = parseInt(movie['start']);
	movie['length'] = movies[movie['name']]['length'];
	movie['end'] = movie['start'] + movie['length'];
	movie['fileType'] = movies[movie['name']]['fileType'];
	if (checkTimeConflict(movie) == 0) {
		queue.push(movie);
		queue.sort(compareDate);
		res.end('ok');
	} else {
		res.end('conflict');
	}
});

app.post('/getMovieList', function(req, res) {
	json.load('./movies.json', function(err, obj) {
		movies = obj;
		res.end(JSON.stringify(movies));
	});
});

app.post('/getQueue', function(req, res) {
	var now = Math.floor((new Date).getTime()/1000);
	// Update queries to see if movie is over
	// Pretty inefficient atm
	for (i = 0; i < queue.length; i++) {
		if (queue[i]['end'] < now) {
			if (i > -1) {
				console.log(now);
			    queue.splice(i, 1);
			    i = 0;
			}
		}
	}
	res.end(JSON.stringify(queue));
});

app.post('/clearQueue', function(req, res) {
	queue = [];
	res.end();
});

app.post('/removeFromQueue', function(req, res) {
	let start = req.body['start'];

	for (i = 0; i < queue.length; i++) {
		if (queue[i]['start'] == start) {
		    queue.splice(i, 1);
		}
	}
	res.end();
});

app.post('/updateLiveStreamStatus', function(req, res) {
	console.log(req.body);
	if (req.body['response'] == 'streamOn') {
		isLiveStreamOn = true;
		res.end();
	} else if (req.body['response'] == 'streamOff') {
		isLiveStreamOn = false;
		res.end();
	}
});

app.listen(81, function() {
  console.log('Server started on port 80');
});