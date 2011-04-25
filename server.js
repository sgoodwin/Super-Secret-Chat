
/**
 * Module dependencies.
 */

var express = require('express'),
    io = require('socket.io'),
		sys = require('sys'),
		async = require('async'),
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

// I made some changes.
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
		handles = {},
		messageQueue = {};
socket.on('connection', function(client){
	console.log('New Connection!');
	client.send({handle: 'server', message: 'welcome!'});
	
	client.on('message', function(obj){
		if(obj.handle !== undefined){
			handles[obj.handle] = client;
			console.log('Added handle ' + obj.handle);
			if(messageQueue[obj.handle]){
				console.log('messages in the queue for this guy!');
				var i = 0;
				var max = messageQueue[obj.handle].length;
				for(i=0;i<max;i++){
					var msgObj =  messageQueue[obj.handle][i];
					console.log('sending message: ' + sys.inspect(msgObj));
					client.send(msgObj);
				}
			}
		}
		
		if(obj.target !== undefined && obj.message !== undefined){
			console.log('message from ' + obj.handle + ' for ' + obj.target + ': ' + obj.message);
			if(handles[obj.target]){
				console.log('Target is online, sending message');
				handles[obj.target].send(obj);
			}else{
				console.log('Target is not online, queueing up message');
				console.log('existing messages: ' + sys.inspect(messageQueue[obj.target]));
				if(!messageQueue[obj.target]){
					messageQueue[obj.target] = [];
				}
				messageQueue[obj.target].push(obj);
			}
		}
	});
	
	client.on('disconnect', function(){
		console.log('disconnected!');
	});
});
