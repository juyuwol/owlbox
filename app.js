const NON_HANGEUL_ID = /[^$_가-힣]/;
const NON_HEX = /[^0-9A-Fa-f]/;

const defaultFonts = {};
const fontList = document.getElementById('fonts');
const resetButton = document.getElementById('reset');

export const generatorForm = document.getElementById('generator');
export const generatorControls = generatorForm.elements;
export const fontMap = new Map();
export const promise = Promise.all([
  'NotoSansKR-Regular.woff2',
  'NotoColorEmoji.woff2',
].map(async (name) => {
  const res = await fetch(name);
  if (!res.ok) throw new Error();
  const buffer = defaultFonts[name] = await res.arrayBuffer();
  fontMap.set(name, buffer);
}));

for (const color of document.querySelectorAll('[type=color][data-name]')) {
  const item = color.form.elements[color.getAttribute('data-name')];
  const isList = (item instanceof RadioNodeList);
  const text = isList ? item[color.getAttribute('data-index')] : item;
  connectColorPicker(color, text);
  color.disabled = false;
}

const itemUp = (event) => {
  if (!moveItem(event.currentTarget, 'previous', 'before')) return;
  resetButton.disabled = false;
};

const itemDown = (event) => {
  if (!moveItem(event.currentTarget, 'next', 'after')) return;
  resetButton.disabled = false;
};

const addFont = (() => {
  const { content } = document.getElementById('font-item');
  const checkbox = content.querySelector('[type=checkbox]');
  const labelText = content.querySelector('label').lastChild;
  return (name, buffer) => {
    fontMap.set(name, buffer);
    checkbox.value = name;
    labelText.data = ` ${name}`;
    const item = content.cloneNode(true);
    item.querySelector('[data-dir=up]').onclick = itemUp;
    item.querySelector('[data-dir=down]').onclick = itemDown;
    fontList.append(item);
  };
})();

resetButton.onclick = () => {
  resetButton.disabled = true;
  fontMap.clear();
  fontList.replaceChildren();
  for (const name in defaultFonts) {
    addFont(name, defaultFonts[name]);
  }
};

for (const button of fontList.querySelectorAll('[data-dir=up]')) {
  button.onclick = itemUp;
  button.disabled = false;
}

for (const button of fontList.querySelectorAll('[data-dir=down]')) {
  button.onclick = itemDown;
  button.disabled = false;
}

{
  const removeButton = document.getElementById('remove');
  removeButton.onclick = () => {
    removeButton.disabled = true;
    resetButton.disabled = false;
    for (const checkbox of generatorForm.querySelectorAll('[name=font]:checked')) {
      fontMap.delete(checkbox.value);
      findLIAncestor(checkbox).remove();
    }
  };

  fontList.onchange = (event) => {
    if (event.target.checked) {
      removeButton.disabled = false;
    } else if (generatorForm.querySelector('[name=font]:checked') === null) {
      removeButton.disabled = true;
    }
  };
}

for (const checkbox of fontList.querySelectorAll('[name=font]')) {
  checkbox.disabled = false;
}

{
  const fileSelector = document.getElementById('file');
  const uploadButton = document.getElementById('upload');

  const addFontFromFile = async (file) => {
    const { name } = file;
    if (fontMap.has(name)) {
      window.alert(`파일명이 '${name}'인 폰트를 중복하여 등록할 수 없습니다.`);
      return;
    }
    addFont(name, await file.arrayBuffer());
  };

  fileSelector.onchange = () => {
    uploadButton.disabled = (fileSelector.files.length === 0);
  };

  uploadButton.onclick = async function upload() {
    uploadButton.onclick = null;
    uploadButton.disabled = true;
    resetButton.disabled = false;
    const { files } = fileSelector;
    await (
      (files.length > 1) ?
      Promise.all(Array.from(files, addFontFromFile)) :
      addFontFromFile(files[0])
    );
    fileSelector.value = '';
    uploadButton.onclick = upload;
  };
}

{
  const urlTextbox = document.getElementById('url');
  const loadButton = document.getElementById('load');

  urlTextbox.oninput = () => {
    if (urlTextbox.value.length === 0) {
      loadButton.disabled = true;
    } else if (loadButton.disabled) {
      loadButton.disabled = false;
    }
  };

  loadButton.onclick = async () => {
    const url = urlTextbox.value;
    if (!url) return;
    let name = '';
    try {
      name = decodeURIComponent(new URL(url).pathname);
    } catch (e) {
      return;
    }
    if (name.endsWith('/')) name = name.slice(0, -1);
    name = name.slice(name.lastIndexOf('/') + 1);
    while ((name === '') || fontMap.has(name)) {
      name = window.prompt(`파일명이 '${name
      }'인 폰트를 등록할 수 없습니다. 등록할 파일명을 입력해 주세요.`, name);
      if (name === null) return;
    }
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const type = res.headers.get('content-type');
      if ((type !== null) && !type.startsWith('font/')) throw new Error();
      addFont(name, await res.arrayBuffer());
    } catch (e) {
      return window.alert('URL로부터 폰트를 가져오지 못했습니다.');
    }
    urlTextbox.value = '';
  };
}

const paletteForm = document.getElementById('palette');
const paletteControls = paletteForm.elements;

{
  const template = document.getElementById('color-item').content.firstElementChild;
  const removeButton = document.getElementById('color-remove');
  const addButton = document.getElementById('color-add');
  const colorList = document.getElementById('colors');

  const itemUp = (event) => void moveItem(event.currentTarget, 'previous', 'before');
  const itemDown = (event) => void moveItem(event.currentTarget, 'next', 'after');
  const toggleRemoveButton = (event) => {
    if (event.currentTarget.checked) {
      removeButton.disabled = false;
    } else if (paletteForm.querySelector('[name=checkbox]:checked') === null) {
      removeButton.disabled = true;
    }
  };

  removeButton.onclick = () => {
    const elements = paletteForm.querySelectorAll('[name=checkbox]:checked');
    removeButton.disabled = true;
    if (elements.length === colorList.childElementCount) {
      return colorList.replaceChildren();
    }
    for (const checkbox of elements) {
      findLIAncestor(checkbox).remove();
    }
  };

  addButton.onclick = () => {
    const item = template.cloneNode(true);
    const color = item.querySelector('[type=color]');
    const text = item.querySelector('[name=value]');
    item.querySelector('[name=checkbox]').onchange = toggleRemoveButton;
    item.querySelector('[data-dir=up]').onclick = itemUp;
    item.querySelector('[data-dir=down]').onclick = itemDown;
    connectColorPicker(color, text);
    colorList.append(item);
  };

  addButton.disabled = false;

  for (const checkbox of paletteControls.checkbox) {
    checkbox.onchange = toggleRemoveButton;
    checkbox.disabled = false;
  }

  for (const button of colorList.querySelectorAll('[data-dir=up]')) {
    button.onclick = itemUp;
    button.disabled = false;
  }

  for (const button of colorList.querySelectorAll('[data-dir=down]')) {
    button.onclick = itemDown;
    button.disabled = false;
  }
}

export const updateOutput = (() => {
  const outputBox = document.getElementById('output');
  const downloadLink = document.getElementById('download');
  const values = [
    createColors(paletteControls),
    createCard(generatorControls, getStyle(generatorControls)),
  ];

  let fileURL = '';
  downloadLink.onclick = downloadLink.oncontextmenu = () => {
    if (fileURL) return;
    const type = 'text/javascript; charset=UTF-8';
    fileURL = URL.createObjectURL(new Blob([outputBox.value], { type }));
    downloadLink.setAttribute('href', fileURL);
  };

  return (value, index) => {
    values[index] = value;
    outputBox.value = values.join('\n');
    URL.revokeObjectURL(fileURL);
    fileURL = '';
  };
})();

paletteForm.onsubmit = (event) => {
  event.preventDefault();
  updateOutput(createColors(paletteControls), 0);
};

paletteForm.querySelector('[type=submit]').disabled = false;

function connectColorPicker(color, text) {
  color.oninput = () => void (text.value = color.value);
  text.oninput = () => void (color.value = text.value);
  text.onchange = () => normalizeColor(color, text);
}

function createColors(controls) {
  let colors = 'export const colors = ';
  const keys = controls.key;
  if (keys === undefined) return colors + 'null;\n';
  const values = controls.value;
  const end = keys.length;
  colors += '{\n';
  for (let i = 0; i < end; ++i) {
    const value = values[i].value;
    const key = keys[i].value;
    const id = NON_HANGEUL_ID.test(key) ? JSON.stringify(key) : key;
    colors += `  ${id}: ${toRGBArray(value)}, // ${value}\n`;
  }
  return colors + '};\n';
}

function findLIAncestor(element) {
  do {
    element = element.parentElement;
  } while (element.tagName !== 'LI');
  return element;
}

function moveItem(button, direction, action) {
  const item = findLIAncestor(button);
  const sibling = item[`${direction}ElementSibling`];
  if (sibling === null) return false;
  sibling[action](item);
  button.focus();
  return true;
}

function normalizeColor(color, text) {
  let { value } = text, hex = value;
  switch (hex.length) {
    case 6:
      if (!NON_HEX.test(hex)) value = '#' + hex;
      break;
    case 4:
      if (!hex.startsWith('#')) break;
      hex = hex.slice(1);
    case 3: if (!NON_HEX.test(hex)) {
      const { 0: r, 1: g, 2: b } = hex;
      value = '#' + r + r + g + g + b + b;
    }
  }
  color.value = value;
  text.value = color.value;
}

function parseColor(color) {
  return [
    Number.parseInt(color.slice(1, 3), 16),
    Number.parseInt(color.slice(3, 5), 16),
    Number.parseInt(color.slice(5, 7), 16),
  ];
}

function toHexColor({ 0: r, 1: g, 2: b }) {
  return '#' + ((r * 0x10000) + (g * 0x100) + b).toString(16).padStart(6, '0');
}

function toRGBArray(hex) {
  return `[0x${hex.slice(1, 3)}, 0x${hex.slice(3, 5)}, 0x${hex.slice(5)}]`;
}

export function createCard(controls, style) {
  const backgroundColor = toHexColor(style.backgroundColor);
  const frameColor = toHexColor(style.frameColor);
  const textColor = toHexColor(style.textColor);
  const item = controls.font;
  const fonts = (
    (item instanceof HTMLInputElement) ?
    [item.value] :
    Array.from(item, (e) => e.value)
  );
  return `\
export const fonts = ${JSON.stringify(fonts, undefined, 2)};

export const style = {
  backgroundColor: ${toRGBArray(backgroundColor)}, // ${backgroundColor}
  frameColor: ${toRGBArray(frameColor)}, // ${frameColor}
  textColor: ${toRGBArray(textColor)}, // ${textColor}
  fontSize: ${style.fontSize},
  lineHeight: ${style.lineHeight},
  horizontalFrameThickness: ${style.horizontalFrameThickness},
  verticalFrameThickness: ${style.verticalFrameThickness},
  frameLeft: ${style.frameLeft},
  frameTop: ${style.frameTop},
  contentLeft: ${style.contentLeft},
  minContentTop: ${style.minContentTop},
};
`;
}

export function getStyle(controls) {
  return {
    backgroundColor: parseColor(controls.backgroundColor.value),
    frameColor: parseColor(controls.frameColor.value),
    textColor: parseColor(controls.textColor.value),
    fontSize: controls.fontSize.valueAsNumber,
    lineHeight: controls.lineHeight.valueAsNumber / 100,
    horizontalFrameThickness: controls.horizontalFrameThickness.valueAsNumber,
    verticalFrameThickness: controls.verticalFrameThickness.valueAsNumber,
    frameLeft: controls.frameLeft.valueAsNumber,
    frameTop: controls.frameTop.valueAsNumber,
    contentLeft: controls.contentLeft.valueAsNumber,
    minContentTop: controls.minContentTop.valueAsNumber,
  };
}
