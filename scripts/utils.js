// scripts/utils.js
// Função utilitária para injetar scripts sequencialmente
function injectScript(url) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${chrome.runtime.getURL(url)}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL(url);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Erro ao carregar ${url}`));
    document.head.appendChild(script);
  });
}

function injectAllGestureScripts() {
  return injectScript('libs/fingerpose.js')
    .then(() => injectScript('gestures/openHand.js'))
    .then(() => injectScript('scripts/detector.js'));
} 