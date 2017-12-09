class localPeerConnectionLib { //pseudoclasse localPeerConnectionLib

      //ATRIBUTES
      constructor() {
            this.localSocket = null;
            this.localPConnection = null;
            this.remotePConnection = null;
            this.remoteSocketId = null;
      }

      //PUBLIC FUNCTIONS
      get socket() {
            return this.localSocket;
      }

      set socket(sock) {
            this.localSocket = sock;
      }

      set localPeerConnection(localPeer) {
            this.localPConnection = localPeer;
            log("Socket ID LOCAL: " + this.localSocket.id);
      }

      get localPeerConnection() {
            return this.localPConnection;
      }

      get remotePeerConnection() {
            return this.remotePConnection;
      }
      set remotePeerConnection(remotePeer) {
            this.remotePConnection = remotePeer;
            log("Socket ID REMOT: " + this.remoteSocketId);
      }

      get remoteSocket() {
            return this.remoteSocketId;
      }

      set remoteSocket(remoteSock) {
            this.remoteSocketId = remoteSock;
      }



      //Handler associated with the management of remote peer connection's
      //data channel events
      gotReceiveChannel(event) {
            log('Receive Channel Callback: event --> ' + event);
            // Retrieve channel information
            receiveChannel = event.channel;

            // Set handlers for the following events: 
            // (i) open; (ii) message; (iii) close
            receiveChannel.onopen = handleReceiveChannelStateChange;
            receiveChannel.onmessage = handleMessage;
            receiveChannel.onclose = handleReceiveChannelStateChange;
      }

      onSignalingError(error) {
            console.log('Failed to create signaling message : ' + error.name);
      }

      // Handler to be called whenever a new local ICE candidate becomes available
      gotLocalIceCandidate(event) {
            if (event.candidate) {
                  log("Local ICE candidate: \n" + event.candidate.candidate);
                  socket.emit("message", {
                        type: "localCandidate",
                        data: event.candidate,
                        to: this.remoteSocketId,
                        from: this.localSocket.id
                  });
            }
      }

      // Handler to be called whenever a new 'remote' ICE candidate becomes available
      gotRemoteIceCandidate(event) {
            if (event.candidate) {
                  log("Remote ICE candidate: \n " + event.candidate.candidate);
                  socket.emit("message", {
                        type: "remoteCandidate",
                        data: event.candidate,
                        to: this.remoteSocketId,
                        from: this.localSocket.id
                  });
            }
      }

      //Handler for either 'open' or 'close' events on sender's data channel
      handleSendChannelStateChange() {
            alert("ON OPEN");
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
      gotLocalDescription(description) {
            // Add the local description to the local PeerConnection
            localPeerConnection.setLocalDescription(description);
            log("Offer from localPeerConnection: \n" + description.sdp);
            alert("BEFORE CREATE OFFER");

            socket.emit("message", {
                  type: "offer",
                  data: description,
                  to: remoteSocketId,
                  from: localSocket.id
            });
      }

      // Handler to be called when the 'remote' SDP becomes available
      static gotRemoteDescription(description) {
            // Set the 'remote' description as the local description of the remote PeerConnection
            remotePeerConnection.setLocalDescription(description);

            socket.emit("message", {
                  type: "answer",
                  data: description,
                  to: this.remoteSocketId,
                  from: this.localSocket.id
            });
      }
}

//PRIVATE FUNCTIONS

//Handler for either 'open' or 'close' events on receiver's data channel
function handleReceiveChannelStateChange() {
      var readyState = receiveChannel.readyState;
      log('Receive channel state is: ' + readyState);
}

//Message event handler
function handleMessage(event) {
      log('Received message: ' + event.data);
      // Show message in the HTML5 page
      document.getElementById("dataChannelReceive").value = event.data;
      // Clean 'Send' text area in the HTML page
      document.getElementById("dataChannelSend").value = '';
}
