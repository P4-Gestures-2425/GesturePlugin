let detector = null;
let gestureEstimator = null;
let video = null;
let stream = null;
let detecting = false;
let lastCursorPos = { x: 0, y: 0 };
let pinchActive = false;
let lastUrl = location.href;
let detectionEnabled = false;
let detectionLoopActive = false;

//* Ao carregar o content script, lê o estado persistente e inicia deteção se necessário
try {
  chrome.storage.local.get('detectionEnabled', (data) => {
    if (data && data.detectionEnabled) {
      startHandDetection();
    }
  });
} catch (e) {
  console.warn('[CONTENT] chrome.storage não disponível:', e.message);
}

//* Começa a detetar gestos de mão 
async function startHandDetection() {
  if (detecting || detectionLoopActive) return;
  detectionEnabled = true;
  try { chrome.storage.local.set({ detectionEnabled: true }); } catch (e) {}
  detecting = true;
  detectionLoopActive = true;


  if (!detector) {
    detector = await handPoseDetection.createDetector(
      handPoseDetection.SupportedModels.MediaPipeHands,
      { runtime: 'tfjs', modelType: 'full', maxHands: 2 }
    );
    console.log('[CONTENT] Detector carregado:', !!detector);
  }


  if (!gestureEstimator) {
    const GE = window.fp.GestureEstimator;
    gestureEstimator = new GE([
      window.fp.Gestures.ThumbsUpGesture,
      window.openHandGesture,
      window.thumbDownGesture
    ]);
    console.log('[CONTENT] GestureEstimator carregado:', !!gestureEstimator);
  }


  if (!video) {
    video = document.createElement('video');
    video.setAttribute('autoplay', '');
    video.setAttribute('playsinline', '');
    video.style.display = 'none';
    video.setAttribute('muted', '');
    video.muted = true;
    video.style.display = 'block';
    video.style.position = 'fixed';
    video.style.top = '10px';
    video.style.left = '10px';
    video.style.transform = 'scaleX(-1)';
    video.style.zIndex = 99999;
    video.width = 320;
    video.height = 240;
    document.body.appendChild(video);
  }


  if (!stream) {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      await video.play();
      console.log('[CONTENT] Stream da câmara iniciado!');
    } catch (e) {
      console.error('[CONTENT] Erro ao aceder à câmara:', e.message);
      detecting = false;
      detectionLoopActive = false;
      return;
    }
  }

  //* Inicia a detecção de gestos 
  async function detect() {
    if (!detecting) { detectionLoopActive = false; return; }
    let hands = [];
    try {
      if (!video || video.readyState < 2) {
        requestAnimationFrame(detect);
        return;
      }
      hands = await detector.estimateHands(video);
      console.log('[CONTENT] Mãos detectadas:', hands.length);
      if (hands.length > 0) {
        const keypoints = hands[0].keypoints;
        const wrist = keypoints.find(k => k.name === 'wrist');
        const middleTip = keypoints.find(k => k.name === 'middle_finger_tip');
        if (wrist && middleTip) {
          const dist = Math.sqrt((wrist.x - middleTip.x) ** 2 + (wrist.y - middleTip.y) ** 2);
          console.log('[CONTENT] Distância entre mão e dedo médio:', dist);
          if (dist < 70) {
            showVideoOverlay(false); // Esconde overlay (posição ideal)
          } else {
            showVideoOverlay(true, 'Afasta-se da câmara!'); // Mostra overlay
          }
        } else {
          showVideoOverlay(true, 'Mão não detetada corretamente!');
        }
      } else {
        showVideoOverlay(true, 'Mão não detetada!');
      }
      if (hands.length > 0) {
        const keypoints = hands[0].keypoints3D;
        const est = gestureEstimator.estimate(keypoints, 9);
        console.log('[CONTENT] Estimativa de gestos:', est);
        let gesture = null;
        if (est.gestures && est.gestures.length > 0) {
          gesture = est.gestures.reduce((p, c) => (p.score > c.score ? p : c));
          if (gesture.name === 'thumbs_up') {
            window.scrollBy({ top: -15, behavior: 'instant' });
            showGestureFeedback('👍');
          }
          if (gesture.name === 'thumbs_down') {
            window.scrollBy({ top: 15, behavior: 'instant' });
            showGestureFeedback('👎');
          }
          if (gesture.name === 'open_hand') {
            if (!document.getElementById('virtual-cursor')) {
              createVirtualCursor();
            }

            showGestureFeedback('🖐️');
            let palm = hands[0].keypoints.find(k => k.name === 'wrist');
            if (!palm) {
              palm = hands[0].keypoints.find(k => k.name === 'index_finger_tip');
            }
            if (palm) {
              moveVirtualCursor(palm.x, palm.y);
            }
            if (gesture.score < 0.9) {
              document.getElementById('virtual-cursor').style.display = 'none';
            } else {
              document.getElementById('virtual-cursor').style.display = 'block';
            }
          } else {
            //* Esconde o cursor se não for mão aberta
            if (document.getElementById('virtual-cursor')) {
              document.getElementById('virtual-cursor').style.display = 'none';
            }
          }
        }

        const thumbTip = hands[0].keypoints.find(k => k.name === 'thumb_tip');
        const indexTip = hands[0].keypoints.find(k => k.name === 'index_finger_tip');
        const middleTip = hands[0].keypoints.find(k => k.name === 'middle_finger_tip');
        const cursor = document.getElementById('virtual-cursor');
        if (isPinch(thumbTip, indexTip) && !pinchActive && cursor && cursor.style.display !== 'none') {
          pinchActive = true;
          simulateClick(lastCursorPos.x, lastCursorPos.y);
          if (cursor) cursor.style.background = 'rgba(255, 0, 0, 0.7)';
        }
        if (!isPinch(thumbTip, indexTip)) {
          pinchActive = false;
          if (cursor) cursor.style.background = 'rgba(0, 123, 255, 0.7)';
        }
        if (isMiddleTouchingThumb(thumbTip, middleTip) && cursor && cursor.style.display !== 'none') {
          if (!cursor.rightClickActive) {
            cursor.rightClickActive = true;
            simulateRightClick(lastCursorPos.x, lastCursorPos.y);
            cursor.style.background = 'rgba(255, 165, 0, 0.7)';
          }
        } else {
          if (cursor) cursor.rightClickActive = false;
          if (cursor && !pinchActive) cursor.style.background = 'rgba(0, 123, 255, 0.7)';
        }
      }
    } catch (e) {
      if (e.message && e.message.includes('Extension context invalidated')) {
        console.warn('[CONTENT] Contexto da extensão invalidado, parando ciclo.');
        detecting = false;
        detectionLoopActive = false;
        return;
      }
      console.error('[CONTENT] Erro ao detetar mãos:', e.message);
    }
    requestAnimationFrame(detect);
  }
  detect();
}

//* Para a detecção de gestos de mão
function stopHandDetection() {
  detecting = false;
  detectionEnabled = false;
  detectionLoopActive = false;
  try { chrome.storage.local.set({ detectionEnabled: false }); } catch (e) {}
  if (video) {
    video.pause();
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    video.remove();
    video = null;
  }
  detector = null;
  gestureEstimator = null;
  
  //* Remove o cursor virtual se existir
  const cursor = document.getElementById('virtual-cursor');
  if (cursor) {
    cursor.remove();
  }
  
  //* Remove o overlay de posição se existir
  const overlay = document.getElementById('video-position-overlay');
  if (overlay) {
    overlay.remove();
  }
}

function showGestureFeedback(emoji) {
  let el = document.getElementById('gesture-feedback');
  if (!el) {
    el = document.createElement('div');
    el.id = 'gesture-feedback';
    el.style.position = 'fixed';
    el.style.bottom = '30px';
    el.style.right = '30px';
    el.style.fontSize = '3rem';
    el.style.zIndex = 99999;
    el.style.background = 'rgba(255,255,255,0.8)';
    el.style.borderRadius = '1rem';
    el.style.padding = '0.5rem 1rem';
    document.body.appendChild(el);
  }
  el.textContent = emoji;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 1200);
}

//* Cria um cursor virtual que segue o dedo 
function createVirtualCursor() {
  let cursor = document.getElementById('virtual-cursor');
  if (!cursor) {
    cursor = document.createElement('div');
    cursor.id = 'virtual-cursor';
    cursor.style.position = 'fixed';
    cursor.style.width = '30px';
    cursor.style.height = '30px';
    cursor.style.background = 'rgba(0, 123, 255, 0.7)';
    cursor.style.borderRadius = '50%';
    cursor.style.pointerEvents = 'none';
    cursor.style.zIndex = 100000;
    cursor.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(cursor);
  }
  return cursor;
}

//* Move o cursor virtual para a posição do dedo 
function moveVirtualCursor(x, y) {
  const cursor = createVirtualCursor();

  //* Tamanho do vídeo
  const videoWidth = video.width;
  const videoHeight = video.height;

  //* Tamanho da janela
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  //* Padding de 10% em todos os lados
  const paddingX = videoWidth * 0.1;
  const paddingY = videoHeight * 0.1;
  const usableWidth = videoWidth - 2 * paddingX;
  const usableHeight = videoHeight - 2 * paddingY;

  //* Garante que x e y estão dentro da área útil
  const clampedX = Math.max(paddingX, Math.min(videoWidth - paddingX, x));
  const clampedY = Math.max(paddingY, Math.min(videoHeight - paddingY, y));

  //* Mapeia as coordenadas da área útil do vídeo para a janela
  const mappedX = screenWidth - (((clampedX - paddingX) / usableWidth) * screenWidth);
  const mappedY = ((clampedY - paddingY) / usableHeight) * screenHeight;

  cursor.style.left = `${mappedX}px`;
  cursor.style.top = `${mappedY}px`;

  //* Guarda a posição real para simular cliques
  lastCursorPos = { x: mappedX, y: mappedY };
}

//* Função para calcular a distância entre dois pontos 2D 
function distance2D(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

//* --- Funções de Deteção de Gestos ---
function isPinch(thumbTip, indexTip) {
  if (!thumbTip || !indexTip) return false;
  return distance2D(thumbTip, indexTip) < 15;
}

function isMiddleTouchingThumb(thumbTip, middleTip) {
  if (!thumbTip || !middleTip) return false;
  return distance2D(thumbTip, middleTip) < 15;
}

//* --- Funções de Simulação de Cliques ---
function simulateClick(x, y) {
  const el = document.elementFromPoint(x, y);
  if (el) {
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: x, clientY: y }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: x, clientY: y }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }));
  }
}

function simulateRightClick(x, y) {
  const el = document.elementFromPoint(x, y);
  if (el) {
    el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: x, clientY: y, button: 2 }));
  }
}

//* Função para mostrar/ocultar overlay no vídeo
function showVideoOverlay(show, mensagem = 'Ajuste a posição para ficar visível!') {
  let overlay = document.getElementById('video-position-overlay');
  if (!overlay) {
    overlay = document.createElement('div');  
    overlay.id = 'video-position-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = video.style.top || '10px';
    overlay.style.left = video.style.left || '10px';
    overlay.style.width = video.width + 'px';
    overlay.style.height = video.height + 'px';
    overlay.style.background = 'rgba(38, 38, 38, 0.5)';
    overlay.style.color = '#fff';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.fontSize = '1.5rem';
    overlay.style.fontWeight = 'bold';
    overlay.style.zIndex = 100002;
    overlay.style.pointerEvents = 'none';
    overlay.textContent = mensagem;
    document.body.appendChild(overlay);
  }
  overlay.textContent = mensagem;
  overlay.style.display = show ? 'flex' : 'none';
}

//* Escuta mensagens do background para iniciar/parar a detecção de gestos
try {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'start_gesture') {
      startHandDetection();
    }
    if (msg.action === 'stop_gesture') {
      stopHandDetection();
    }
  });
} catch (e) {
  console.warn('[CONTENT] chrome.runtime não disponível:', e.message);
}

const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    try {
      chrome.storage.local.get('detectionEnabled', (data) => {
        if (data && data.detectionEnabled) {
          setTimeout(() => {
            startHandDetection();
          }, 300);
        }
      });
    } catch (e) {
      console.warn('[CONTENT] chrome.storage não disponível:', e.message);
    }
  }
});
observer.observe(document, { subtree: true, childList: true });

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    try {
      chrome.storage.local.get('detectionEnabled', (data) => {
        if (data && data.detectionEnabled && !detecting) {
          setTimeout(() => {
            startHandDetection();
          }, 300);
        }
      });
    } catch (e) {
      console.warn('[CONTENT] chrome.storage não disponível:', e.message);
    }
  }
});
