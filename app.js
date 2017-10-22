import "bootstrap/dist/css/bootstrap.min.css"

require('jquery/dist/jquery');
require('popper.js/dist/umd/popper');
require('bootstrap/dist/js/bootstrap');

$(function () {
	var socket = require('socket.io-client/dist/socket.io.js')();
	$('form').submit(function(){
    	socket.emit('chat message', $('#m').val());
    	$('#m').val('');
    	return false;
    });
    socket.on('chat message', function(msg){
    	$('#messages').append($('<li>').text(msg));
    });
});