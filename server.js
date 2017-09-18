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

app.use(session({
	secret: 'super secret', 
	resave: false, 
	saveUninitialized: true
}));



app.use(device.capture());


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

// GoT Season 7
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



app.listen(80, function() {
  console.log('Server started on port 80');
});