//Acces to localPeerConnection library
var lib = new localPeerConnectionLib();

// JavaScript variables holding stream, connection information, send and receive channels
var localStream, localPeerConnection, remotePeerConnection, sendChannel, receiveChannel, socket, remoteSocketId;
var callDone = false;

//JavaScript variables associated with demo buttons
var sendButton = document.getElementById("sendButton");

// JavaScript variables associated with HTML5 video elements in the page
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");

// JavaScript variables assciated with call management buttons in the page
var startButton = document.getElementById("startButton");
var callButton = document.getElementById("callButton");
var hangupButton = document.getElementById("hangupButton");

//On startup, just the 'Start' button must be enabled
sendButton.disabled = true;

//Associate handlers with buttons
sendButton.onclick = sendData;

// Just allow the user to click on the 'Call' button at start-up
startButton.disabled = false;
callButton.disabled = true;
hangupButton.disabled = true;

// Associate JavaScript handlers with click events on the buttons
startButton.onclick = start;
callButton.onclick = call;
hangupButton.onclick = hangup;

// JavaScript variable associated with proper
// configuration of an RTCPeerConnection object:
// use DTLS/SRTP
var pc_constraints = {
  'optional': [{
    'DtlsSrtpKeyAgreement': true
  }]
};

// This is an optional configuration string, associated with NAT traversal setup
var servers = {
  "iceServers": [
    {
      "url": "turn:testart.cat",
      "username": "prouser",
      "credential": "3TptDG7cAfz5TaXsda"
    }]
};

// Utility function for logging information to the JavaScript console
function log(text) {
  console.log("At time: " + (performance.now() / 1000).toFixed(3) + " --> " + text);
}

// Callback in case of success of the getUserMedia() call
function successCallback(stream) {
  log("Received local stream");

  // Associate the local video element with the retrieved stream
  if (window.URL) {
    localVideo.src = URL.createObjectURL(stream);
  } else {
    localVideo.srcObject = stream;
  }

  localVideo.muted = true;
  localStream = stream;

  // Connect to signalling server
  socket = io();
  lib.setSocket(socket);

	//Enviem un missatge de connexió al servidor de senyalització
  socket.on('connect', function () {
    console.log("CONNECTED");
  });

  // Receive message from the other peer via the signalling server 
  socket.on('message', function (message) {
    console.log('Received message:', message);
    switch (message.type) {
      case "newUser":
        remoteSocketId = message.msg;
        lib.setRemoteSocketId(remoteSocketId);
        // We can now enable the 'Call' button
        callButton.disabled = false;
        break;
      case "offer":
        if (!callDone) call();

        // Create the remote PeerConnection object
        remotePeerConnection = new RTCPeerConnection(servers, pc_constraints);
        lib.setRemotePeerConnection(remotePeerConnection);
        log("Created remote peer connection object remotePeerConnection");
        // Add a handler associated with ICE protocol events...
        remotePeerConnection.onicecandidate = lib.gotRemoteIceCandidate;
				// ...and a second handler to be activated as soon as the remote stream becomes available
				remotePeerConnection.onaddstream = gotRemoteStream;

        // ...and data channel creation event  
        remotePeerConnection.ondatachannel = lib.gotReceiveChannel;

        // ...do the same with the 'pseudo-remote' PeerConnection
        // Note well: this is the part that will have to be changed if you want the communicating peers to become
        // remote (which calls for the setup of a proper signaling channel)
        remotePeerConnection.setRemoteDescription(new RTCSessionDescription(message.data));

				// Create the Answer to the received Offer based on the 'local' description
				remotePeerConnection.createAnswer(lib.gotRemoteDescription, lib.onSignalingError);
        break;
      case "answer":
				log("Answer from remotePeerConnection: \n" + message.data.sdp);
        // Conversely, set the 'remote' description as the remote description of the local PeerConnection 
        localPeerConnection.setRemoteDescription(new RTCSessionDescription(message.data));
        break;
      case "localCandidate":
        // Add candidate to the remote PeerConnection 
        remotePeerConnection.addIceCandidate(new RTCIceCandidate({
          sdpMLineIndex: message.data.sdpMLineIndex,
          candidate: message.data.candidate
        }));
        break;
      case "remoteCandidate":
        // Add candidate to the local PeerConnection	  
        localPeerConnection.addIceCandidate(new RTCIceCandidate({
          sdpMLineIndex: message.data.sdpMLineIndex,
          candidate: message.data.candidate
        }));
        break;
      case "hangup":
        console.log("Altre usuari ha desconnectat");
        hangup();
        break;
      default:
        socket.on('disconnect', function (socketId) {
          console.log("DISCONNECT NOW!");
        });
    }
  });
}

// Function associated with clicking on the 'Start' button
// This is the event triggering all other actions
function start() {
  log("Requesting local stream");
  // First of all, disable the 'Start' button on the page
  startButton.disabled = true;
  // Get ready to deal with different browser vendors...

  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  // Now, call getUserMedia()
  if (navigator.getUserMedia) {
    navigator.getUserMedia({audio: false, video: true},
      successCallback,
      function (err) {
        console.log("The following error occurred: " + err.name)
      });
  } else console.log("getUserMedia not supported");
}

//Handler for sending data to the 'remote' peer
function sendData() {
  var data = document.getElementById("dataChannelSend").value;
  sendChannel.send(data);
  log('Sent data: ' + data);
}

// Function associated with clicking on the 'Call' button
// This is enabled upon successful completion of the 'Start' button handler
function call() {
  callDone = true;
  // First of all, disable the 'Call' button on the page...
  callButton.disabled = true;
  // ...and enable the 'Hangup' button
  hangupButton.disabled = false;
  sendButton.disabled = false;
  log("Starting call");

  // Note well: getVideoTracks() and getAudioTracks() are not currently supported in Firefox...
  // ...just use them with Chrome
  if (navigator.webkitGetUserMedia) {
    // Log info about video and audio device in use
    if (localStream.getVideoTracks().length > 0) {
      log('Using video device: ' + localStream.getVideoTracks()[0].label);
    }
    if (localStream.getAudioTracks().length > 0) {
      log('Using audio device: ' + localStream.getAudioTracks()[0].label);
    }
  }

  // Create the local PeerConnection object
  localPeerConnection = new RTCPeerConnection(servers, pc_constraints);
  lib.setLocalPeerConnection(localPeerConnection);
  log("Created local peer connection object localPeerConnection, with Data Channel");

  try {
    // Note Well: SCTP-based reliable Data Channels supported in Chrome 29+ !
    // use {reliable: false} if you have an older version of Chrome
    sendChannel = localPeerConnection.createDataChannel("sendDataChannel", { reliable: true });
    log('Created reliable send data channel');
  } catch (e) {
    alert('Failed to create data channel!');
    log('createDataChannel() failed with following message: ' + e.message);
  }
  // Add a handler associated with ICE protocol events
  localPeerConnection.onicecandidate = lib.gotLocalIceCandidate;

  // Associate handlers with data channel events
  sendChannel.onopen = lib.handleSendChannelStateChange;
  sendChannel.onclose = lib.handleSendChannelStateChange;

  // Add the local stream (as returned by getUserMedia() to the local PeerConnection
  localPeerConnection.addStream(localStream);
  log("Added localStream to localPeerConnection");

	// We're all set! Create an Offer to be 'sent' to the callee as soon as the local SDP is ready
  localPeerConnection.createOffer(lib.gotLocalDescription, lib.onSignalingError);
}

// Handler to be called when hanging up the call
function hangup() {
  log("Ending call");
  // Close PeerConnection(s)
  localPeerConnection.close();
  remotePeerConnection.close();
  // Reset local variables
  localPeerConnection = null;
  remotePeerConnection = null;
  // Disable 'Hangup' button
  hangupButton.disabled = true;
  // Enable 'Start' button to allow for new calls to be established
  startButton.disabled = false;

  // Close channels...
  log('Closing data channels');
  sendChannel.close();
  log('Closed data channel with label: ' + sendChannel.label);
  receiveChannel.close();
  log('Closed peer connections');
  // Rollback to the initial setup of the HTML5 page
  sendButton.disabled = true;
  dataChannelSend.value = "";
  dataChannelReceive.value = "";
  dataChannelSend.disabled = true;
  dataChannelSend.placeholder = "1: Press Call; 2: Enter text; 3: Press Send.";

  socket.disconnect();

  //refresquem la pàgina 
  location.reload(true);
}

// Handler to be called as soon as the remote stream becomes available
function gotRemoteStream(event) {
  // Associate the remote video element with the retrieved stream
  if (window.URL) {
    // Chrome
    remoteVideo.src = window.URL.createObjectURL(event.stream);
  } else {
    // Firefox
    remoteVideo.srcObject = event.stream;
  }
  log("Received remote stream");
}
