const video = document.getElementById('videoPreview');
const status = document.getElementById('status');

document.getElementById('start').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'start_gesture' }, function(response) {
    });
  });
});

document.getElementById('stop').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'stop_gesture' }, function(response) {
    });
  });
});

document.getElementById('about-btn').addEventListener('click', function() {
  window.open('pages/index.html', '_blank');
});

async function startPreview() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    status.textContent = 'Câmera ativa. Faça um gesto!';
  } catch (e) {
    status.textContent = 'Erro ao acessar a câmera!';
  }
}

function stopPreview() {
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
    video.srcObject = null;
  }
  status.textContent = 'Aguardando gesto...';
}
