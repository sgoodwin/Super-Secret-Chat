
/**
 * Module dependencies.
 */

var express = require('express'),
    io = require('socket.io'),
		sys = require('sys');
		app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyDecoder());
  app.use(express.methodOverride());
  app.use(express.compiler({ src: __dirname + '/public', enable: ['sass'] }));
  app.use(app.router);
  app.use(express.staticProvider(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
  res.render('index', {
    locals: {
      title: 'Super Secret Chat!'
    }
  });
});

app.get('/chat', function(req, res){
	var handle = req.param('handle');
	res.render('chat', {
		locals: {
			title: 'Super Secret Chat!',
			handle: handle
		}
	});
});

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(process.env.PORT || 8000);
  console.log("Express server listening on port %d", app.address().port);
}

// socket.io 
var socket = io.listen(app),
		handles = {};
socket.on('connection', function(client){
	console.log('New Connection!');
	client.send({message: 'welcome!'});
	
	client.on('message', function(obj){
		if(obj.handle){
			handles[obj.handle] = client;
			console.log('Added handle: ' + obj.handle);
		}
		
		if(obj.target && obj.message){
			console.log('message for ' + obj.target + ': ' + obj.message);
		}
	});
	
	client.on('disconnect', function(){
		console.log('disconnected!');
	});
});