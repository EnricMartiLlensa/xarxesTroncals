// JavaScript global variables holding stream, connection information, send and receive channels
var localStream, localPeerConnection, remotePeerConnection, sendChannel, receiveChannel;

// Callback in case of success of the getUserMedia() call
function obtenirCorrectamentUserMediaCallback(stream) {
	log("Successfully received localMediaStream");

	// Associate the local video element with the retrieved stream
	/*if (window.URL) {
	  localVideo.src =  URL.createObjectURL(stream);
	} else {*/
	 localVideo.srcObject = stream;
	//}
	
	localStream = stream;
	callButton.disabled = false; // We can now enable the 'Call' button 
}

//funció per estalbir la connexió local
function establirConnexioLocal(servers, pc_constraints){
	localPeerConnection = new RTCPeerConnection(servers, pc_constraints);
	localPeerConnection.onicecandidate = obtenirIceCandidateLocal; // Add a handler associated with ICE protocol events
	localPeerConnection.addStream(localStream); // Add the local stream (as returned by getUserMedia() to the local PeerConnection
}

//funció per estalbir la connexió remota
function establirConnexioRemota(servers, pc_constraints){
	remotePeerConnection = new RTCPeerConnection(servers, pc_constraints); // Create the remote PeerConnection object
	remotePeerConnection.onicecandidate = obtenirIceCandidateRemot; // Add a handler associated with ICE protocol events...
	remotePeerConnection.onaddstream = obtenirStreamRemot; // ...and a second handler to be activated as soon as the remote stream becomes available 
}

// Handler to be called whenever a new local ICE candidate becomes available
function obtenirIceCandidateLocal(event){
	if (event.candidate) {
		// Add candidate to the remote PeerConnection 
		remotePeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
		log("Local ICE candidate: \n" + event.candidate.candidate);
	}
}

// Handler to be called whenever a new 'remote' ICE candidate becomes available
function obtenirIceCandidateRemot(event){
	if (event.candidate) {
		// Add candidate to the local PeerConnection	  
		localPeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
		log("Remote ICE candidate: \n " + event.candidate.candidate);
	}
}

function senyalitzarError(error) {
	log('Failed to create signaling message : ' + error.name);
}

// Handler to be called when the 'local' SDP becomes available
function obtenirDescripcioLocal(description){
	// Add the local description to the local PeerConnection
	localPeerConnection.setLocalDescription(description);
	log("Offer from localPeerConnection: \n" + description.sdp);

	// ...do the same with the 'pseudo-remote' PeerConnection
	// Note well: this is the part that will have to be changed if you want the communicating peers to become
	// remote (which calls for the setup of a proper signaling channel)
	remotePeerConnection.setRemoteDescription(description);

	// Create the Answer to the received Offer based on the 'local' description
	remotePeerConnection.createAnswer(obtenirDescripcioRemota, senyalitzarError);
}

// Handler to be called when the 'remote' SDP becomes available
function obtenirDescripcioRemota(description){
	// Set the 'remote' description as the local description of the remote PeerConnection
	remotePeerConnection.setLocalDescription(description);
	log("Answer from remotePeerConnection: \n" + description.sdp);
	// Conversely, set the 'remote' description as the remote description of the local PeerConnection 
	localPeerConnection.setRemoteDescription(description);
}

// Handler to be called as soon as the remote stream becomes available
function obtenirStreamRemot(event){	

	// Associate the remote video element with the retrieved stream
	/*if (window.URL) { // Chrome
		remoteVideo.src = window.URL.createObjectURL(event.stream);
	} else { // Firefox*/
		remoteVideo.srcObject = event.stream;
	// }  
	log("Received remote stream");
}

//Handler associated with the management of remote peer connection's
//data channel events
function obtenirCanalReceptor(event) {
	
	log('Receive Channel Callback: event --> ' + event);
	// Retrieve channel information
	receiveChannel = event.channel;

	// Set handlers for the following events: 
	// (i) open; (ii) message; (iii) close
	receiveChannel.onopen = tractarCanalReceptorCanviEstat;
	receiveChannel.onmessage = tractarMissatge;
	receiveChannel.onclose = tractarCanalReceptorCanviEstat;
}

//Message event handler
function tractarMissatge(event) {
	
	log('Received message: ' + event.data);
	// Show message in the HTML5 page
	document.getElementById("dataChannelReceive").value = event.data;
	// Clean 'Send' text area in the HTML page
	document.getElementById("dataChannelSend").value = '';
}

//Handler for either 'open' or 'close' events on sender's data channel
function tractarCanalEnviadorCanviEstat() {
	
	var readyState = sendChannel.readyState;
	log('Send channel state is: ' + readyState);
	if (readyState == "open") {
		// Enable 'Send' text area and set focus on it
		dataChannelSend.disabled = false;
		dataChannelSend.focus();
		dataChannelSend.placeholder = "";
		sendButton.disabled = false; // Enable 'Send'  button

	} else { // event MUST be 'close', if we are here...
		dataChannelSend.disabled = true; // Disable 'Send' text area
		sendButton.disabled = true; // Disable  'Send' 
	}
}

//Handler for either 'open' or 'close' events on receiver's data channel
function tractarCanalReceptorCanviEstat() {
	
	var readyState = receiveChannel.readyState;
	log('Receive channel state is: ' + readyState);
}

// Utility function for logging information to the JavaScript console
function log(text) {
  console.log("At time: " + (performance.now() / 1000).toFixed(3) + " --> " + text);
}

// funció per establir un DataChannel
function establirConnexioDades() {
	
	try {
		// Note Well: SCTP-based reliable Data Channels supported in Chrome 29+! use {reliable: false} if you have an older version of Chrome
		sendChannel = localPeerConnection.createDataChannel("sendDataChannel", { reliable: true });
		log('Created reliable send data channel');
	} catch (e) {
		alert('Failed to create data channel!');
		log('createDataChannel() failed with following message: ' + e.message);
	}

	// Associate handlers with data channel events
	sendChannel.onopen = tractarCanalEnviadorCanviEstat;
	sendChannel.onclose = tractarCanalEnviadorCanviEstat;

	remotePeerConnection.ondatachannel = obtenirCanalReceptor;// ...and data channel creation event  
}
