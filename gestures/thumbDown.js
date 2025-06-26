(function waitForFingerpose() {
  if (!window.fp || !window.fp.GestureDescription) {
    setTimeout(waitForFingerpose, 30);
    return;
  }
  const thumbDownGesture = new window.fp.GestureDescription('thumbs_down');
  const fp = window.fp;

  //* Polegar estendido para baixo
  thumbDownGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
  thumbDownGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.VerticalDown, 1.0);
  thumbDownGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.DiagonalDownRight, 0.9);
  thumbDownGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.DiagonalDownLeft, 0.9);

  //* Outros dedos dobrados
  const fingers = [fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky];
  for (let finger of fingers) {
    thumbDownGesture.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
    thumbDownGesture.addDirection(finger, fp.FingerDirection.HorizontalRight, 0.8);
    thumbDownGesture.addDirection(finger, fp.FingerDirection.HorizontalLeft, 0.8);
    thumbDownGesture.addDirection(finger, fp.FingerDirection.DiagonalDownRight, 0.7);
    thumbDownGesture.addDirection(finger, fp.FingerDirection.DiagonalDownLeft, 0.7);
  }

  window.thumbDownGesture = thumbDownGesture;
})(); 