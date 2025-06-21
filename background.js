chrome.runtime.onMessage.addListener((msg, sender) => {
  // Este background.js agora só serve para receber gestos do content script
  if (msg.type === 'gesture_detected') {
    console.log('Gesto recebido do content script:', msg.gesture);
    
  }
});
