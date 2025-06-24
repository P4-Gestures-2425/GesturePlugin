//* Carrega o GestureEstimator e todos gestos personalizados
if (!window.fp || !window.fp.GestureEstimator) {
  console.error('GestureEstimator não está disponível. Certifique-se de que o script está carregado corretamente.');
} else {
  const GE = new window.fp.GestureEstimator([
    window.openHandGesture,
    window.fp.Gestures.ThumbsUpGesture,
    window.fp.Gestures.VictoryGesture
  ]);
  window.GE = GE;
} 