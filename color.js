for (const color of document.querySelectorAll('[type=color][data-name]')) {
  const text = color.form.elements[color.getAttribute('data-name')];
  color.oninput = () => void (text.value = color.value);
  text.oninput = () => void (color.value = text.value);
}
