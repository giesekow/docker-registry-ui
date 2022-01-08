var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var compression = require('compression');
var helmet = require('helmet');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const registriesRouter = require('./routes/registries');
const reposRouter = require('./routes/repos');
var auth = require('./authentication');
var dbConfig = require('./db');

var app = express();

app.use(helmet());
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const showLogs = process.env.LOGS || 'on'
if (showLogs === 'on') {
  app.use(logger('dev'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));

dbConfig(app);
auth.configure(app);

app.use(auth.middleware);
app.use('/', auth.restrict, indexRouter);
app.use('/users', auth.restrict, usersRouter);
app.use('/registries', auth.restrict, registriesRouter);
app.use('/repos', auth.restrict, reposRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
