// Element References
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const flashOverlay = document.getElementById('flashOverlay');
const flashText = document.getElementById('flashText');
const answerButtons = document.querySelectorAll('[data-type="answer"]');
const statusButtons = document.querySelectorAll('[data-type="status"]');

let lastSentMessage = null;
let isConnected = false;

const socket = new WebSocket("ws://56.155.110.169:3000");
let peerConnection;
let dataChannel;

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

// Connection
socket.onopen = () => {
  updateConnectionStatus('connecting');
  initializePeerConnection();
};

socket.onerror = () => updateConnectionStatus('disconnected');
socket.onclose = () => updateConnectionStatus('disconnected');

async function initializePeerConnection() {
  peerConnection = new RTCPeerConnection(config);
  dataChannel = peerConnection.createDataChannel("examSignal");

  dataChannel.onopen = () => {
    isConnected = true;
    updateConnectionStatus('connected');
    vibrate([50]);
  };

  dataChannel.onclose = () => {
    isConnected = false;
    updateConnectionStatus('disconnected');
  };

  dataChannel.onmessage = (event) => handleIncomingSignal(event.data);

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.send(JSON.stringify({ type: "candidate", candidate: event.candidate }));
    }
  };

  try {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.send(JSON.stringify({ type: "offer", offer }));
  } catch (error) {
    console.error('Error:', error);
  }
}

socket.onmessage = async (message) => {
  const data = JSON.parse(message.data);

  if (data.type === "offer") {
    peerConnection = new RTCPeerConnection(config);

    peerConnection.ondatachannel = (event) => {
      dataChannel = event.channel;
      dataChannel.onopen = () => {
        isConnected = true;
        updateConnectionStatus('connected');
        vibrate([50]);
      };
      dataChannel.onclose = () => {
        isConnected = false;
        updateConnectionStatus('disconnected');
      };
      dataChannel.onmessage = (event) => handleIncomingSignal(event.data);
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.send(JSON.stringify({ type: "candidate", candidate: event.candidate }));
      }
    };

    await peerConnection.setRemoteDescription(data.offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.send(JSON.stringify({ type: "answer", answer }));
  }

  if (data.type === "answer") {
    await peerConnection.setRemoteDescription(data.answer);
  }

  if (data.type === "candidate") {
    await peerConnection.addIceCandidate(data.candidate);
  }
};

// Button Handlers
answerButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    sendSignal(btn.dataset.signal, 'answer');
    vibrate([30]);
  });
});

statusButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const signal = btn.dataset.signal;
    sendSignal(signal, 'status');
    vibrate([30]);
  });
});

// Flash with text (only on receiver)
function showFlash(color, text) {
  flashOverlay.style.backgroundColor = color;
  flashText.textContent = text;
  flashOverlay.classList.add('active');

  setTimeout(() => {
    flashOverlay.classList.remove('active');
  }, 2000);
}

// Signal Functions
function sendSignal(message, type) {
  if (!isConnected || !dataChannel || dataChannel.readyState !== 'open') {
    vibrate([50, 50, 50]);
    return;
  }

  const signalData = { message, type, timestamp: Date.now() };
  dataChannel.send(JSON.stringify(signalData));
  lastSentMessage = signalData;
}

function handleIncomingSignal(data) {
  const signalData = JSON.parse(data);
  const message = signalData.message;

  let color = '#4a9eff';

  if (message === 'A') color = '#4a9eff';
  else if (message === 'B') color = '#50c878';
  else if (message === 'C') color = '#ffa94d';
  else if (message === 'D') color = '#ff6b9d';
  else if (message === 'Help') color = '#ff4757';
  else if (message === 'Repeat') color = '#a29bfe';
  else if (message === 'Wait') color = '#ffa502';
  else if (message === 'OK') color = '#26de81';
  else if (message === 'Clear') color = '#747d8c';
  else if (message === 'Done') color = '#2ed573';

  showFlash(color, message);

  if (signalData.type === 'status' && message === 'Help') {
    vibrate([100, 50, 100, 50, 100]);
  } else if (signalData.type === 'status') {
    vibrate([50, 30, 50]);
  } else {
    vibrate([80]);
  }
}

function updateConnectionStatus(status) {
  statusDot.className = 'status-dot ' + status;

  switch (status) {
    case 'connected':
      statusText.textContent = 'Connected';
      break;
    case 'connecting':
      statusText.textContent = 'Connecting...';
      break;
    case 'disconnected':
      statusText.textContent = 'Disconnected';
      break;
  }
}

function vibrate(pattern) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

// Wake Lock
let wakeLock = null;

async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
    } catch (err) {
      console.log('Wake lock error:', err);
    }
  }
}

requestWakeLock();

document.addEventListener('visibilitychange', async () => {
  if (wakeLock !== null && document.visibilityState === 'visible') {
    await requestWakeLock();
  }
});

updateConnectionStatus('connecting');
console.log('Ready');
