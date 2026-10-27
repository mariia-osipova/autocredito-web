/* Documentation demos only. No requests, accounts or saved personal data. */
(() => {
  'use strict';
  const live = document.getElementById('ds-live');
  let liveTimer;
  function announce(message) {
    if (!live) return;
    clearTimeout(liveTimer); live.textContent = '';
    liveTimer = setTimeout(() => { live.textContent = message; }, 50);
  }
  document.querySelectorAll('[data-ds-copy]').forEach(button => {
    const original = button.textContent;
    let copyTimer;
    button.addEventListener('click', async () => {
      const code = document.getElementById(button.dataset.dsCopy);
      if (!code) return;
      let copied = false;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(code.textContent); copied = true;
        }
      } catch (_) {}
      if (!copied) {
        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange(); range.selectNodeContents(code);
          selection.removeAllRanges(); selection.addRange(range);
          try { copied = document.execCommand('copy'); } catch (_) {}
          if (copied) selection.removeAllRanges();
        }
      }
      button.textContent = copied ? 'Copiado' : 'Código seleccionado';
      announce(copied ? 'Código copiado.' : 'Copiá el código seleccionado con el atajo de tu dispositivo.');
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => { button.textContent = original; }, 2500);
    });
  });
  document.querySelectorAll('[data-ds-action]').forEach(button => {
    button.addEventListener('click', () => {
      const output = document.getElementById('button-demo-result');
      if (output) output.textContent = 'Ejemplo: activaste «' + button.textContent.trim() + '». No se envió información.';
    });
  });
  document.querySelectorAll('[data-ds-loading]').forEach(button => {
    button.addEventListener('click', () => {
      if (button.getAttribute('aria-busy') === 'true') return;
      const original = button.textContent;
      button.setAttribute('aria-busy', 'true'); button.setAttribute('aria-disabled', 'true');
      button.textContent = 'Cargando ejemplo…';
      setTimeout(() => {
        button.removeAttribute('aria-busy'); button.removeAttribute('aria-disabled');
        button.textContent = original;
        const output = document.getElementById('button-demo-result');
        if (output) output.textContent = 'La simulación de carga terminó. El botón vuelve a estar disponible.';
      }, 1200);
    });
  });
  const form = document.getElementById('preferences-demo');
  const result = document.getElementById('preferences-result');
  let savedExample = null;
  if (form && result) {
    form.addEventListener('ac:submit', event => {
      savedExample = { ...event.detail.values };
      const types = { portal: 'Portal', landing: 'Página de presentación', herramienta: 'Herramienta interna' };
      const values = {
        'saved-project': savedExample.project.trim(),
        'saved-type': types[savedExample.type] || savedExample.type,
        'saved-guide': savedExample.guide === 'on' ? 'Incluida' : 'Sin guía'
      };
      Object.entries(values).forEach(([id, value]) => { const node = document.getElementById(id); if (node) node.textContent = value; });
      result.hidden = false;
      announce('Preferencias del ejemplo guardadas en esta página.');
    });
    form.addEventListener('ac:reset', () => {
      savedExample = null;
      result.hidden = true;
      ['saved-project','saved-type','saved-guide'].forEach(id => { const node = document.getElementById(id); if (node) node.textContent = ''; });
      announce('Ejemplo restablecido.');
    });
  }
})();
