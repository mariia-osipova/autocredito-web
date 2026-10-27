/* Propuesta de interfaz creada para este proyecto. No extraída de un sistema corporativo de Autocrédito. */
/* Autocrédito UI v1: tabs, local form validation and transient notices.
   API: AutocreditoUI.init(root), .showToast(elementOrId, message).
   Forms emit ac:submit with detail.values. This library never sends data. */
(function () {
  'use strict';
  if (window.AutocreditoUI) { window.AutocreditoUI.init(document); return; }
  const boundTabs = new WeakSet();
  const boundForms = new WeakSet();
  const boundToastButtons = new WeakSet();
  const toastStates = new WeakMap();
  const find = (root, selector) => {
    const items = Array.from(root.querySelectorAll(selector));
    if (root.matches && root.matches(selector)) items.unshift(root);
    return items;
  };

  function setupTabs(root) {
    find(root, '[data-ac-tabs]').forEach(group => {
      if (boundTabs.has(group)) return;
      boundTabs.add(group);
      const list = group.querySelector('[role="tablist"]');
      if (!list) return;
      const tabs = Array.from(list.querySelectorAll('[role="tab"]'));
      const activate = index => {
        tabs.forEach((tab, i) => {
          const active = i === index;
          tab.setAttribute('aria-selected', String(active));
          tab.tabIndex = active ? 0 : -1;
          const panel = document.getElementById(tab.getAttribute('aria-controls'));
          if (panel) panel.hidden = !active;
        });
      };
      const selected = tabs.findIndex(tab => tab.getAttribute('aria-selected') === 'true');
      if (tabs.length) activate(Math.max(0, selected));
      tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => activate(index));
        tab.addEventListener('keydown', event => {
          let next = index;
          const vertical = list.getAttribute('aria-orientation') === 'vertical';
          if (event.key === (vertical ? 'ArrowDown' : 'ArrowRight')) next = (index + 1) % tabs.length;
          else if (event.key === (vertical ? 'ArrowUp' : 'ArrowLeft')) next = (index - 1 + tabs.length) % tabs.length;
          else if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = tabs.length - 1;
          else return;
          event.preventDefault();
          activate(next);
          tabs[next].focus();
        });
      });
    });
  }

  function setupForms(root) {
    find(root, '[data-ac-form]').forEach(form => {
      if (boundForms.has(form)) return;
      boundForms.add(form);
      const fields = Array.from(form.querySelectorAll('[data-ac-field]'));
      const summary = form.querySelector('[data-ac-errors]');
      const summaryList = summary && summary.querySelector('ul');
      const fieldName = field => field.dataset.acLabel || (field.labels && field.labels[0] ? field.labels[0].textContent.replace('*', '').trim() : 'Campo');
      const errorText = field => {
        if (field.validity.valueMissing || field.validity.customError) return field.dataset.errorRequired || 'Completá este campo.';
        if (field.validity.typeMismatch) return 'Revisá el formato de este dato.';
        if (field.validity.tooShort) return 'Usá al menos ' + field.minLength + ' caracteres.';
        if (field.validity.tooLong) return 'Usá como máximo ' + field.maxLength + ' caracteres.';
        if (field.validity.patternMismatch) return field.dataset.errorPattern || 'Revisá el formato indicado.';
        return 'Revisá este campo.';
      };
      const validate = field => {
        field.setCustomValidity('');
        if (field.required && /^(text|search|email|tel|url)$/.test(field.type) && !field.value.trim()) field.setCustomValidity('required');
        const valid = field.disabled || field.validity.valid;
        const error = field.id && document.getElementById(field.id + '-error');
        field.setAttribute('aria-invalid', String(!valid));
        if (error) { error.hidden = valid; error.textContent = valid ? '' : errorText(field); }
        return valid;
      };
      const renderSummary = invalid => {
        if (!summary || !summaryList) return;
        summaryList.replaceChildren();
        invalid.forEach(field => {
          const item = document.createElement('li');
          const link = document.createElement('a');
          link.href = '#' + field.id;
          link.textContent = fieldName(field) + ': ' + errorText(field);
          link.addEventListener('click', event => { event.preventDefault(); field.focus(); });
          item.appendChild(link);
          summaryList.appendChild(item);
        });
        summary.hidden = !invalid.length;
      };
      fields.forEach(field => field.addEventListener('blur', () => {
        validate(field);
        if (summary && !summary.hidden) renderSummary(fields.filter(item => item.getAttribute('aria-invalid') === 'true'));
      }));
      const attempt = () => {
        const invalid = fields.filter(field => !validate(field));
        renderSummary(invalid);
        if (invalid.length) {
          if (summary) summary.focus();
          else invalid[0].focus();
          return;
        }
        const values = Object.fromEntries(new FormData(form).entries());
        form.dispatchEvent(new CustomEvent('ac:submit', { bubbles: true, detail: { values } }));
      };
      form.querySelectorAll('[data-ac-submit]').forEach(button => button.addEventListener('click', attempt));
      form.addEventListener('submit', event => { event.preventDefault(); attempt(); });
      form.addEventListener('keydown', event => {
        if (event.key !== 'Enter' || event.isComposing || event.target.tagName !== 'INPUT' || /^(checkbox|radio|button|submit|reset)$/.test(event.target.type)) return;
        event.preventDefault(); attempt();
      });
      form.addEventListener('reset', () => {
        fields.forEach(field => {
          field.setCustomValidity(''); field.removeAttribute('aria-invalid');
          const error = field.id && document.getElementById(field.id + '-error');
          if (error) { error.hidden = true; error.textContent = ''; }
        });
        renderSummary([]);
        form.dispatchEvent(new CustomEvent('ac:reset', { bubbles: true }));
      });
    });
  }

  function showToast(target, message) {
    const toast = typeof target === 'string' ? document.getElementById(target) : target;
    if (!toast) return;
    const text = toast.querySelector('[data-ac-toast-text]');
    if (!text) return;
    let state = toastStates.get(toast);
    if (!state) {
      state = { timer: null, trigger: null };
      const hide = () => {
        clearTimeout(state.timer);
        const needsFocus = toast.contains(document.activeElement);
        toast.hidden = true;
        if (needsFocus && state.trigger && state.trigger.isConnected) state.trigger.focus();
      };
      state.hide = hide;
      state.schedule = () => { clearTimeout(state.timer); state.timer = setTimeout(hide, 5000); };
      const dismiss = toast.querySelector('[data-ac-toast-dismiss]');
      if (dismiss) dismiss.addEventListener('click', hide);
      toast.addEventListener('mouseenter', () => clearTimeout(state.timer));
      toast.addEventListener('mouseleave', () => { if (!toast.contains(document.activeElement)) state.schedule(); });
      toast.addEventListener('focusin', () => clearTimeout(state.timer));
      toast.addEventListener('focusout', event => { if (!toast.contains(event.relatedTarget)) state.schedule(); });
      toastStates.set(toast, state);
    }
    clearTimeout(state.timer);
    state.trigger = document.activeElement;
    text.textContent = '';
    toast.hidden = false;
    requestAnimationFrame(() => { text.textContent = message; state.schedule(); });
  }

  document.addEventListener('click', event => {
    const target = event.target instanceof Element && event.target.closest('.ac-button[aria-disabled="true"]');
    if (target) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  function init(root) {
    root = root || document;
    setupTabs(root); setupForms(root);
    find(root, '[data-ac-toast-target]').forEach(button => {
      if (boundToastButtons.has(button)) return;
      boundToastButtons.add(button);
      button.addEventListener('click', () => showToast(button.dataset.acToastTarget, button.dataset.acToastMessage || 'Aviso de ejemplo.'));
    });
  }
  window.AutocreditoUI = Object.freeze({ init, showToast });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(document), { once: true });
  else init(document);
})();
