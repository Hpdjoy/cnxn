const connectBtn = document.getElementById("connectBtn");
const sendBtn = document.getElementById("sendBtn");
const statusText = document.getElementById("status");

// 1. Connect to signaling server
const socket = new WebSocket("ws://localhost:3000");

// 2. WebRTC variables
let peerConnection;
let dataChannel;

// 3. ICE servers (STUN)
const config = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }
  ]
};

// 4. When connect button clicked
connectBtn.onclick = async () => {
  statusText.innerText = "Status: Connecting...";

  peerConnection = new RTCPeerConnection(config);

  // Create DataChannel
  dataChannel = peerConnection.createDataChannel("buttonChannel");

  dataChannel.onopen = () => {
    statusText.innerText = "Status: Connected (P2P)";
    sendBtn.disabled = false;
  };

  dataChannel.onmessage = (event) => {
    alert("Received from peer: " + event.data);
  };

  // ICE candidate handling
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.send(JSON.stringify({
        type: "candidate",
        candidate: event.candidate
      }));
    }
  };

  // Create offer
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  socket.send(JSON.stringify({
    type: "offer",
    offer
  }));
};

// 5. Receive signaling messages
socket.onmessage = async (message) => {
  const data = JSON.parse(message.data);

  // If offer received
  if (data.type === "offer") {
    peerConnection = new RTCPeerConnection(config);

    peerConnection.ondatachannel = (event) => {
      dataChannel = event.channel;

      dataChannel.onopen = () => {
        statusText.innerText = "Status: Connected (P2P)";
        sendBtn.disabled = false;
      };

      dataChannel.onmessage = (event) => {
        alert("Received from peer: " + event.data);
      };
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.send(JSON.stringify({
          type: "candidate",
          candidate: event.candidate
        }));
      }
    };

    await peerConnection.setRemoteDescription(data.offer);

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.send(JSON.stringify({
      type: "answer",
      answer
    }));
  }

  // If answer received
  if (data.type === "answer") {
    await peerConnection.setRemoteDescription(data.answer);
  }

  // If ICE candidate received
  if (data.type === "candidate") {
    await peerConnection.addIceCandidate(data.candidate);
  }
};

// 6. Send button click
sendBtn.onclick = () => {
  dataChannel.send("BUTTON_CLICKED");
};
