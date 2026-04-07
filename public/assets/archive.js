// © 2025 주유월 <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

import { lockForm, unlockForm, throwIfHttpError } from './util.js';

const form = document.getElementById('import');
const submitButton = form.querySelector('[type=submit]');
const fileInput = form.elements.file;

fileInput.onchange = () => {
  submitButton.disabled = (fileInput.files.length === 0);
};

form.onsubmit = async (event) => {
  event.preventDefault();
  if (form.hasAttribute('data-locked')) return;
  submitButton.disabled = true;
  const { files } = fileInput;
  if (files.length === 0) return;
  const locked = lockForm(form);
  form.setAttribute('data-locked', '');
  try {
    await fetch(form.action, {
      method: 'PUT',
      body: files[0],
    }).then(throwIfHttpError);
    window.alert(form.getAttribute('data-ok'));
  } catch (error) {
    submitButton.disabled = false;
    window.alert(error.message);
  } finally {
    form.removeAttribute('data-locked');
    unlockForm(locked);
  }
};
