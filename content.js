let detector = null;
let gestureEstimator = null;
let video = null;
let stream = null;
let detecting = false;

async function startHandDetection() {
  if (detecting) return;
  detecting = true;
  

  if (!detector) {
    detector = await handPoseDetection.createDetector(
      handPoseDetection.SupportedModels.MediaPipeHands,
      { runtime: 'tfjs', modelType: 'full', maxHands: 2 }
    );
    console.log('[CONTENT] Detector carregado:', !!detector);
  }
  

  if (!gestureEstimator) {
    const GE = window.fp.GestureEstimator;
    gestureEstimator = new GE([window.fp.Gestures.ThumbsUpGesture, window.fp.Gestures.VictoryGesture]);
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
      return;
    }
  }
  
  async function detect() {
    if (!detecting) return;
    let hands = [];
    try {
      hands = await detector.estimateHands(video);
      console.log('[CONTENT] Mãos detectadas:', hands.length);
      if (hands.length > 0) {
        //const keypoints = hands[0].keypoints3D || hands[0].keypoints;
        const keypoints = hands[0].keypoints3D;
        //console.log('[CONTENT] Keypoints:', keypoints);
        const est = gestureEstimator.estimate(keypoints, 9);
        //console.log('[CONTENT] Gestos detectados:', est.gestures);
        //console.log('numweo de gestos', est.gestures.length);
        if (est.gestures && est.gestures.length > 0) {
          const gesture = est.gestures.reduce((p, c) => (p.score > c.score ? p : c));
          console.log(gesture.name, gesture.score);
          console.log("--------------------------------");
          if (gesture.name === 'thumbs_up') {
           window.scrollBy({ top: 15, behavior: 'instant' });
            //swindow.scrollBy({ top: 5, behavior: 'smooth' });
            showGestureFeedback('👍');
          }
          if (gesture.name === 'victory') {
            window.scrollBy({ top: -15, behavior: 'instant' });

            showGestureFeedback('✌️');
          }
        }
      }
    } catch (e) {
      console.error('[CONTENT] Erro ao detetar mãos:', e.message);
    }
    requestAnimationFrame(detect);
  }
  detect();
}

function stopHandDetection() {
  detecting = false;
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

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'start_gesture') {
    startHandDetection();
  }
  if (msg.action === 'stop_gesture') {
    stopHandDetection();
  }
});
