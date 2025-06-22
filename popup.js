const video = document.getElementById('videoPreview');
const status = document.getElementById('status');

document.getElementById('start').onclick = () => {
  chrome.storage.local.set({ detectionEnabled: true });
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'start_gesture' });
  });
};

document.getElementById('stop').onclick = () => {
  chrome.storage.local.set({ detectionEnabled: false });
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'stop_gesture' });
  });
};

document.getElementById('about-btn').addEventListener('click', function() {
  window.open('pages/index.html', '_blank');
});

async function startPreview() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    status.textContent = 'Câmera ativa. Faça um gesto!';
  } catch (e) {
    status.textContent = 'Erro ao aceder a câmera!';
  }
}

function stopPreview() {
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
    video.srcObject = null;
  }
  status.textContent = 'A espera do gesto...';
}
