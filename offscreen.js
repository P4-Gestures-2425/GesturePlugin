function offscreenLog(...args) {
  chrome.runtime.sendMessage({ type: 'offscreen_log', log: args.map(String).join(' ') });
}

(async () => {
  offscreenLog('offscreen.js carregado!');

  
  let detector;
  try {
    detector = await handPoseDetection.createDetector(
      handPoseDetection.SupportedModels.MediaPipeHands,
      {
        runtime: 'tfjs',
        modelType: 'full',
        maxHands: 2
      }
    );
    offscreenLog('Detector carregado:', !!detector);
  } catch (e) {
    offscreenLog('Erro ao carregar detector:', e.message);
    return;
  }


  let gestureEstimator;
  try {
    const GE = window.fp.GestureEstimator;
    gestureEstimator = new GE([window.fp.Gestures.ThumbsUpGesture]);
    offscreenLog('GestureEstimator carregado:', !!gestureEstimator);
  } catch (e) {
    offscreenLog('Erro ao carregar GestureEstimator:', e.message);
    return;
  }

  const video = document.createElement('video');
  video.setAttribute('autoplay', '');
  video.setAttribute('playsinline', '');
  video.style.display = 'none';
  document.body.appendChild(video);

  video.onloadedmetadata = () => offscreenLog('Vídeo da câmera carregado!');

  
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();
    offscreenLog('Stream da câmera iniciado!');
    offscreenLog('Video readyState:', video.readyState, 'Width:', video.videoWidth, 'Height:', video.videoHeight);
  } catch (e) {
    offscreenLog('Erro ao acessar câmera:', e.message);
    return;
  }

  async function detect() {
    offscreenLog('Detectando mãos...');
    let hands = [];
    try {
      hands = await detector.estimateHands(video);
      offscreenLog('Mãos detectadas:', hands.length);
      if (hands.length > 0) {
        offscreenLog('Keypoints da primeira mão:', JSON.stringify(hands[0].keypoints || []));
        offscreenLog('Keypoints3D da primeira mão:', JSON.stringify(hands[0].keypoints3D || []));
      } else {
        offscreenLog('Nenhuma mão detetada. Hands:', JSON.stringify(hands));
      }
    } catch (e) {
      offscreenLog('Erro ao detectar mãos:', e.message);
      requestAnimationFrame(detect);
      return;
    }

    if (hands.length > 0) {
      const keypoints = hands[0].keypoints3D || hands[0].keypoints;
      try {
        const est = gestureEstimator.estimate(keypoints, 7.5);
        offscreenLog('Gestos detectados:', JSON.stringify(est.gestures));
        if (est.gestures && est.gestures.length > 0) {
          const gesture = est.gestures.reduce((p, c) => (p.score > c.score ? p : c));
          chrome.runtime.sendMessage({ type: 'gesture_detected', gesture: gesture.name });
        }
      } catch (e) {
        offscreenLog('Erro ao estimar gesto:', e.message);
      }
    }
    requestAnimationFrame(detect);
  }

  detect();
})();
