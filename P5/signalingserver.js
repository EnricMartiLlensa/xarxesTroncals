
// Cal canviar la situaci� dels certificats all� on estiguin
// Cal canviar el #port TCP on aquest server escolta

var express = require('express');
var fs = require('fs');
var https = require('https');
var credentials = {
	key: fs.readFileSync(__dirname + '/server.key.org'),
	cert: fs.readFileSync(__dirname + '/server.crt'),
	passphrase: 'xarxes123'
}

var morgan = require('morgan');
var app = express();

app.use(morgan('tiny'));
app.use(express.static('public_html'));

app.get('/', function (params) {
	res.sendFile(__dirname + '/public_html/index.html');
});

var httpsServer = https.createServer(credentials, app);
httpsServer.listen(3000);

// Use socket.io JavaScript library for real-time web applications
var io = require('socket.io')(httpsServer);

//array on guardem els id's dels usuaris
var usuarisConnectats = [];
var usuarisDesconnectats = 0;

var usuari1, usuari2; //shortcuts als usuaris de la app

io.sockets.on('connection', function (socket){
	usuarisConnectats.push(socket.id); //s'ha connectat un usuari, socket.id t� l'identificador
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
