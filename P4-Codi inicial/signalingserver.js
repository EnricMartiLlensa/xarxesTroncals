
// Cal canviar la situació dels certificats allà on estiguin
// Cal canviar el #port TCP on aquest server escolta

var express = require('express');
var fs = require('fs');
var http = require('http');
var https = require('https');

// Create a node-static server instance
var express = express();
var server = https.createServer({ 
        key: fs.readFileSync('/home/xarxes/certs/xarxes.key'),
        cert: fs.readFileSync('/home/xarxes/certs/xarxes.crt'),
}, express).listen(3000, function() { console.log('Listening SOCKET.IO')});

// Use socket.io JavaScript library for real-time web applications
var io = require('socket.io').listen(server);

//array on guardem els id's dels usuaris
var usuarisConnectats = [];
var usuarisDesconnectats = 0;

var usuari1, usuari2; //shortcuts als usuaris de la app

console.log("SIGNALING SERVER FUNCIONANT");

io.sockets.on('connection', function (socket){
	usuarisConnectats.push(socket.id); //s'ha connectat un usuari, socket.id té l'identificador
	console.log("USUARI ID -> " + socket.id + " || CONNECT");
	if (usuarisConnectats.length > 1){ //quan els dos usuaris s'han connectat al server
		
		usuari1 = usuarisConnectats[0];
		usuari2 = usuarisConnectats[1];
		
		io.to(usuari1).emit('message', {type:'newUser', msg:usuari2}); //enviem info de user1 -> user2
		io.to(usuari2).emit('message', {type:'newUser', msg:usuari1}); //enviem info de user2 -> user1
	}
	// data is an object with receiver socket id and the message
	socket.on('message', function (message) {
		socket.to(message.to).emit('message', message);
	});
	
	socket.on('disconnect', function (message) {
		console.log("USUARI ID -> " + socket.id + " || DISCONNECT");
		if(usuari1 == socket.id){
			io.to(usuari2).emit('message', {type:'hangup'});
		}else{
			io.to(usuari1).emit('message', {type:'hangup'});
		}
		usuarisDesconnectats ++;
		
		if(usuarisDesconnectats > 1){
			//tots els usuaris s'han desconnectat
			console.log("DELETE USERS FROM USER LIST");
			usuarisDesconnectats = 0;
			usuarisConnectats = [];
		}
	});
});
