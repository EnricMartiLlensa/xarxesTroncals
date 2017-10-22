require('dotenv').config()
var express = require('express');
var app 	= express();
var server = app.listen(process.env.PORT, function() {
	console.log(`listening on *:${process.env.PORT}`);	
});
var io = require('socket.io').listen(server);


app.use(express.static(__dirname + '/build/'));

/* RUTAS */
app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

/* SOCKET IO */
io.on('connection',function(socket) {
	//console.log(socket.conn.server.clients);
	io.emit('chat message', 'a user connected');
	socket.username = "USER";
	socket.on('chat message', function(msg){
		io.emit('chat message', msg);
	});
	socket.on('disconnect', function(){
		io.emit('chat message','a user disconnected');
	});
});