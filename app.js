// © 2025 주유월 <ju@yuwol.pe.kr>
// SPDX-License-Identifier: Zlib

const INDEX_COLORS = 0;
const INDEX_CARD = 1;

const NON_HANGEUL_ID = /[^$_가-힣]/;
const NON_HEX = /[^0-9A-Fa-f]/;

const fontList = document.getElementById('fonts');
const resetButton = document.getElementById('font-reset');
const defaultFonts = {};
const defaultFontNames = [
  'NotoSansKR-Regular.woff2',
  'NotoColorEmoji.woff2',
];

export { INDEX_CARD };
export const generatorForm = document.getElementById('generator');
export const generatorElements = generatorForm.elements;
export const fontMap = new Map();
export const promise = Promise.all(defaultFontNames.map(async (name) => {
  const res = await fetch(name);
  if (!res.ok) throw new Error();
  const buffer = defaultFonts[name] = await res.arrayBuffer();
  fontMap.set(name, buffer);
}));

for (const color of document.querySelectorAll('[type=color][data-name]')) {
  const item = color.form.elements[color.getAttribute('data-name')];
  const multiple = (item instanceof RadioNodeList);
  const text = multiple ? item[color.getAttribute('data-index')] : item;
  connectColorPicker(color, text);
  color.disabled = false;
}

const moveUp = (event) => {
  if (!moveItem(event.currentTarget, 'previous', 'before')) return;
  resetButton.disabled = false;
};

const moveDown = (event) => {
  if (!moveItem(event.currentTarget, 'next', 'after')) return;
  resetButton.disabled = false;
};

const addFont = (() => {
  const itemTemplate = document.getElementById('font-item').content;
  const checkbox = itemTemplate.querySelector('[type=checkbox]');
  const labelText = itemTemplate.querySelector('label').lastChild;
  return (name, buffer) => {
    fontMap.set(name, buffer);
    checkbox.value = name;
    labelText.data = ` ${name}`;
    const item = itemTemplate.cloneNode(true);
    item.querySelector('[data-dir=up]').onclick = moveUp;
    item.querySelector('[data-dir=down]').onclick = moveDown;
    fontList.prepend(item);
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
  button.onclick = moveUp;
  button.disabled = false;
}

for (const button of fontList.querySelectorAll('[data-dir=down]')) {
  button.onclick = moveDown;
  button.disabled = false;
}

{
  const removeButton = document.getElementById('font-remove');
  removeButton.onclick = () => {
    removeButton.disabled = true;
    resetButton.disabled = false;
    for (const checkbox of generatorForm.querySelectorAll('[name=font]:checked')) {
      fontMap.delete(checkbox.value);
      checkbox.closest('li').remove();
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
  const fileInput = document.getElementById('font-file');
  const uploadButton = document.getElementById('font-upload');

  const addFontFromFile = async (file) => {
    const { name } = file;
    if (fontMap.has(name)) {
      window.alert(`파일명이 '${name}'인 폰트를 중복하여 등록할 수 없습니다.`);
      return;
    }
    addFont(name, await file.arrayBuffer());
  };

  fileInput.onchange = () => {
    uploadButton.disabled = (fileInput.files.length === 0);
  };

  uploadButton.onclick = async function upload() {
    uploadButton.onclick = null;
    uploadButton.disabled = true;
    resetButton.disabled = false;
    const { files } = fileInput;
    await (
      (files.length > 1) ?
      Promise.all(Array.from(files, addFontFromFile)) :
      addFontFromFile(files[0])
    );
    fileInput.value = '';
    uploadButton.onclick = upload;
  };
}

{
  const urlBox = document.getElementById('font-url');
  const loadButton = document.getElementById('font-load');

  urlBox.oninput = () => {
    if (urlBox.value.length === 0) {
      loadButton.disabled = true;
    } else if (loadButton.disabled) {
      loadButton.disabled = false;
    }
  };

  loadButton.onclick = async () => {
    const url = urlBox.value;
    if (!url) return;
    let name = '';
    try {
      name = decodeURIComponent(new URL(url).pathname.slice(1));
    } catch (e) {
      return;
    }
    if (name) {
      const length = name.length - +name.endsWith('/');
      name = name.slice(name.lastIndexOf('/', length - 1) + 1, length);
    }
    while (!name || fontMap.has(name)) {
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
    urlBox.value = '';
  };
}

const paletteForm = document.getElementById('palette');
const paletteElements = paletteForm.elements;

{
  const itemTemplate = document.getElementById('color-item').content;
  const removeButton = document.getElementById('color-remove');
  const addButton = document.getElementById('color-add');
  const colorList = document.getElementById('colors');

  const moveUp = (event) => void moveItem(event.currentTarget, 'previous', 'before');
  const moveDown = (event) => void moveItem(event.currentTarget, 'next', 'after');
  const toggleRemoveButton = (event) => {
    if (event.currentTarget.checked) {
      removeButton.disabled = false;
    } else if (paletteForm.querySelector('[name=checkbox]:checked') === null) {
      removeButton.disabled = true;
    }
  };

  removeButton.onclick = () => {
    const nodes = paletteForm.querySelectorAll('[name=checkbox]:checked');
    removeButton.disabled = true;
    if (nodes.length === colorList.childElementCount) {
      return colorList.replaceChildren();
    }
    for (const checkbox of nodes) {
      checkbox.closest('li').remove();
    }
  };

  addButton.onclick = () => {
    const item = itemTemplate.cloneNode(true);
    const color = item.querySelector('[type=color]');
    const text = item.querySelector('[name=value]');
    item.querySelector('[name=checkbox]').onchange = toggleRemoveButton;
    item.querySelector('[data-dir=up]').onclick = moveUp;
    item.querySelector('[data-dir=down]').onclick = moveDown;
    connectColorPicker(color, text);
    colorList.append(item);
  };

  addButton.disabled = false;

  for (const checkbox of paletteElements.checkbox) {
    checkbox.onchange = toggleRemoveButton;
    checkbox.disabled = false;
  }

  for (const button of colorList.querySelectorAll('[data-dir=up]')) {
    button.onclick = moveUp;
    button.disabled = false;
  }

  for (const button of colorList.querySelectorAll('[data-dir=down]')) {
    button.onclick = moveDown;
    button.disabled = false;
  }
}

export const updateOutput = (() => {
  const outputBox = document.getElementById('output');
  const downloadLink = document.getElementById('download');
  const snippets = [
    createColors(paletteElements),
    createCard(defaultFontNames, getStyle(generatorElements)),
  ];

  let fileURL = '';
  downloadLink.onclick = downloadLink.oncontextmenu = () => {
    if (fileURL) return;
    const type = 'text/javascript; charset=UTF-8';
    fileURL = URL.createObjectURL(new Blob([outputBox.value], { type }));
    downloadLink.setAttribute('href', fileURL);
  };

  return (snippet, index) => {
    snippets[index] = snippet;
    outputBox.value = snippets.join('\n');
    URL.revokeObjectURL(fileURL);
    fileURL = '';
  };
})();

paletteForm.onsubmit = (event) => {
  event.preventDefault();
  updateOutput(createColors(paletteElements), INDEX_COLORS);
};

paletteForm.querySelector('[type=submit]').disabled = false;

function connectColorPicker(color, text) {
  color.oninput = () => void (text.value = color.value);
  text.oninput = () => void (color.value = text.value);
  text.onchange = () => normalizeColor(color, text);
}

function createColor(key, value) {
  const id = NON_HANGEUL_ID.test(key) ? JSON.stringify(key) : key;
  return `  ${id}: ${toRGBArray(value)}, // ${value}\n`;
}

function createColors(elements) {
  let snippet = 'export const colors = {';
  const item = elements.key;
  if (item === undefined) {
  } else if (item instanceof RadioNodeList) {
    const values = elements.value;
    const end = item.length;
    snippet += '\n';
    for (let i = 0; i < end; ++i) {
      snippet += createColor(item[i].value, values[i].value);
    }
  } else {
    snippet += '\n' + createColor(item.value, elements.value.value);
  }
  return snippet + '};\n';
}

function moveItem(button, direction, action) {
  const item = button.closest('li');
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

function parseColor(hexColor) {
  return [
    Number.parseInt(hexColor.slice(1, 3), 16),
    Number.parseInt(hexColor.slice(3, 5), 16),
    Number.parseInt(hexColor.slice(5, 7), 16),
  ];
}

function toHexColor({ 0: r, 1: g, 2: b }) {
  return '#' + ((r * 0x10000) + (g * 0x100) + b).toString(16).padStart(6, '0');
}

function toRGBArray(hexColor) {
  return `[0x${hexColor.slice(1, 3)}, 0x${hexColor.slice(3, 5)
  }, 0x${hexColor.slice(5, 7)}]`;
}

export function createCard(fontNames, style) {
  const backgroundColor = toHexColor(style.backgroundColor);
  const frameColor = toHexColor(style.frameColor);
  const textColor = toHexColor(style.textColor);
  return `\
export const fonts = ${JSON.stringify(fontNames, undefined, 2).slice(0, -2)},
];

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

export function getStyle(elements) {
  return {
    backgroundColor: parseColor(elements.backgroundColor.value),
    frameColor: parseColor(elements.frameColor.value),
    textColor: parseColor(elements.textColor.value),
    fontSize: elements.fontSize.valueAsNumber,
    lineHeight: elements.lineHeight.valueAsNumber / 100,
    horizontalFrameThickness: elements.horizontalFrameThickness.valueAsNumber,
    verticalFrameThickness: elements.verticalFrameThickness.valueAsNumber,
    frameLeft: elements.frameLeft.valueAsNumber,
    frameTop: elements.frameTop.valueAsNumber,
    contentLeft: elements.contentLeft.valueAsNumber,
    minContentTop: elements.minContentTop.valueAsNumber,
  };
}
