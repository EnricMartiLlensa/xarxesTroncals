function localPeerConnectionLib() { //pseudoclasse localPeerConnectionLib
    
	//ATRIBUTES
	var socket = null;
	var localPeerConnection = null;
	var remotePeerConnection = null;
	var remoteSocketId = null;
	
	//PUBLIC FUNCTIONS
	
	this.setSocket = function(sock){
		socket = sock;
	};
	
	this.setLocalPeerConnection = function(localPeer){
		localPeerConnection = localPeer;
	};
	
	this.setRemotePeerConnection = function (remotePeer){
		remotePeerConnection = remotePeer;
	};
	
	this.setRemoteSocketId = function (remoteSock){
		remoteSocketId = remoteSock;
	};
	
	
	
	//Handler associated with the management of remote peer connection's
	//data channel events
	this.gotReceiveChannel = function(event) {
		log('Receive Channel Callback: event --> ' + event);
		// Retrieve channel information
		receiveChannel = event.channel;

		// Set handlers for the following events: 
		// (i) open; (ii) message; (iii) close
		receiveChannel.onopen = handleReceiveChannelStateChange;
		receiveChannel.onmessage = handleMessage;
		receiveChannel.onclose = handleReceiveChannelStateChange;
	};
	
	this.onSignalingError = function(error) {
		console.log('Failed to create signaling message : ' + error.name);
	};
	
	// Handler to be called whenever a new local ICE candidate becomes available
	this.gotLocalIceCandidate = function(event){
	  if (event.candidate) {
		log("Local ICE candidate: \n" + event.candidate.candidate);
		socket.emit("message",{type:"localCandidate", data:event.candidate, to:remoteSocketId, from: socket.id});
	  }
	}
	
	// Handler to be called whenever a new 'remote' ICE candidate becomes available
	this.gotRemoteIceCandidate = function(event){
	  if (event.candidate) {
		log("Remote ICE candidate: \n " + event.candidate.candidate);
		socket.emit("message",{type:"remoteCandidate", data:event.candidate, to:remoteSocketId, from:socket.id});
	  }
	};
	
	//Handler for either 'open' or 'close' events on sender's data channel
	this.handleSendChannelStateChange = function() {
		var readyState = sendChannel.readyState;
		log('Send channel state is: ' + readyState);
		if (readyState == "open") {
			// Enable 'Send' text area and set focus on it
			dataChannelSend.disabled = false;
			dataChannelSend.focus();
			dataChannelSend.placeholder = "";
			// Enable both 'Send' and 'Close' buttons  
			sendButton.disabled = false;
		} else { // event MUST be 'close', if we are here...
			// Disable 'Send' text area
			dataChannelSend.disabled = true;
			// Disable both 'Send' and 'Close' buttons
			sendButton.disabled = true;
		}
	}
	
	// Handler to be called when the 'local' SDP becomes available
	this.gotLocalDescription = function(description){
	  // Add the local description to the local PeerConnection
	  localPeerConnection.setLocalDescription(description);
	  log("Offer from localPeerConnection: \n" + description.sdp);

	  socket.emit("message",{type:"offer", data:description, to:remoteSocketId, from:socket.id});
	}
	
	// Handler to be called when the 'remote' SDP becomes available
	this.gotRemoteDescription = function(description){
	  // Set the 'remote' description as the local description of the remote PeerConnection
	  remotePeerConnection.setLocalDescription(description);
	  
	  socket.emit("message",{type:"answer", data:description, to:remoteSocketId, from:socket.id});
	}
}

//PRIVATE FUNCTIONS

//Handler for either 'open' or 'close' events on receiver's data channel
	function handleReceiveChannelStateChange()  {
		var readyState = receiveChannel.readyState;
		log('Receive channel state is: ' + readyState);
	};
	
	//Message event handler
	function handleMessage(event) {
		log('Received message: ' + event.data);
		// Show message in the HTML5 page
		document.getElementById("dataChannelReceive").value = event.data;
		// Clean 'Send' text area in the HTML page
		document.getElementById("dataChannelSend").value = '';
	};