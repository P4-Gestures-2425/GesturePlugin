//* Funções utilitárias para gestos de mão
export function distance2D(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function isPinch(thumbTip, indexTip) {
  if (!thumbTip || !indexTip) return false;
  return distance2D(thumbTip, indexTip) < 15;
}

export function isMiddleTouchingThumb(thumbTip, middleTip) {
  if (!thumbTip || !middleTip) return false;
  return distance2D(thumbTip, middleTip) < 15;
} 