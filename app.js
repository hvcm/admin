const globs = require('./globs');
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const couchbase = require('./middleware/couchbase');
const api = require('./routes/basic-api');

const app = express();

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bower_components', express.static(path.join(__dirname, '/bower_components')));
app.use(couchbase);

app.get('/:namespace/*', function(req, res) {
	res.sendfile('index.html', {root: './public'});
});

app.get('/login', function(req, res) {
	res.sendfile('login.html', {root: './public'});
});

api(app);

module.exports = app;
