(function waitForFingerpose() {
  if (!window.fp || !window.fp.GestureDescription) {
    setTimeout(waitForFingerpose, 30);
    return;
  }
  const openHandGesture = new window.fp.GestureDescription('open_hand');
  const fingers = [
    window.fp.Finger.Thumb,
    window.fp.Finger.Index,
    window.fp.Finger.Middle,
    window.fp.Finger.Ring,
    window.fp.Finger.Pinky
  ];

  for (let finger of fingers) {
    //* Aceita dedo esticado (NoCurl) e um pouco dobrado (HalfCurl)
    openHandGesture.addCurl(finger, window.fp.FingerCurl.NoCurl, 1.0);
    openHandGesture.addCurl(finger, window.fp.FingerCurl.HalfCurl, 0.7);

    //* Aceita várias direções para permitir conseguirmos ter os dedos afastados e detetar tbm
    openHandGesture.addDirection(finger, window.fp.FingerDirection.VerticalUp, 1.0);
    openHandGesture.addDirection(finger, window.fp.FingerDirection.DiagonalUpLeft, 0.8);
    openHandGesture.addDirection(finger, window.fp.FingerDirection.DiagonalUpRight, 0.8);
  }

  window.openHandGesture = openHandGesture;
})(); 