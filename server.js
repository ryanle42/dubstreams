var express = require('express');
var app = express();
var sassMiddleware = require('node-sass-middleware');
var path = require('path');
var session = require('express-session');
var bodyParser = require('body-parser');
var spawn = require("child_process").spawn;

app.use(session({
	secret: 'super secret', 
	resave: false, 
	saveUninitialized: true
}));

app.use(function(req, res, next) {
	spawn('python',["./python/trackIp.py", req.ip, req.path]);
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
	res.render('index');
});

// GoT Season 7
app.get('/gameofthrones/*', function(req,res) {
	res.render(req.path.slice(1));
});

app.get('/rickandmorty/*', function(req,res) {
	res.render(req.path.slice(1));
});



app.listen(80, function() {
  console.log('Server started on port 80');
});