import CanvasKitInit from './canvaskit.js';
import { ImageBuilder } from './image.js';

let fileURL = null;
let imageURL = null;

const defaultFontMap = new Map();
const fontMap = new Map();
const image = document.getElementById('preview');
const remover = document.getElementById('remove');
const resetter = document.getElementById('reset');
const file = document.getElementById('file');
const uploader = document.getElementById('upload');
const list = document.getElementById('fonts');
const output = document.getElementById('output');
const downloader = document.getElementById('download');
const form = document.forms.generator;
const controls = form.elements;

const itemUp = (event) => {
  const item = event.currentTarget.parentNode;
  const prev = item.previousElementSibling;
  if (prev === null) return;
  resetter.disabled = false;
  prev.before(item);
};

const itemDown = (event) => {
  const item = event.currentTarget.parentNode;
  const next = item.nextElementSibling;
  if (next === null) return;
  resetter.disabled = false;
  next.after(item);
};

const addFont = (() => {
  const template = document.getElementById('font-item').content;
  const checkbox = template.querySelector('[type=checkbox]');
  const labelText = template.querySelector('label').lastChild;
  return (name, buffer) => {
    fontMap.set(name, buffer);
    checkbox.value = name;
    labelText.data = ` ${name}`;
    const item = template.cloneNode(true);
    item.querySelector('[data-dir=up]').onclick = itemUp;
    item.querySelector('[data-dir=down]').onclick = itemDown;
    list.append(item);
  };
})();

const addFontFromFile = async (file) => {
  const { name } = file;
  if (fontMap.has(name)) {
    return window.alert(`파일명이 '${name}'인 폰트를 중복하여 등록할 수 없습니다.`);
  }
  addFont(name, await file.arrayBuffer());
};

const remove = (input) => {
  if (!input.checked) return;
  fontMap.delete(input.value);
  input.parentNode.parentNode.remove();
}

remover.onclick = () => {
  remover.disabled = true;
  resetter.disabled = false;
  const { font } = controls;
  if (font instanceof HTMLInputElement) return remove(font);
  for (let i = font.length - 1; i >= 0; --i) {
    remove(font[i]);
  }
};

resetter.onclick = () => {
  resetter.disabled = true;
  fontMap.clear();
  list.replaceChildren();
  for (const [ name, buffer ] of defaultFontMap) {
    addFont(name, buffer);
  }
};

file.onchange = () => {
  uploader.disabled = (file.files.length === 0);
};

uploader.onclick = async function upload() {
  uploader.onclick = null;
  uploader.disabled = true;
  resetter.disabled = false;
  const { files } = file;
  await (
    (files.length > 1) ?
    Promise.all(Array.from(files, addFontFromFile)) :
    addFontFromFile(files[0])
  );
  file.value = '';
  uploader.onclick = upload;
};

list.onchange = (event) => {
  if (event.target.checked) {
    remover.disabled = false;
    return;
  }
  const { font } = controls;
  if (font instanceof HTMLInputElement) {
    remover.disabled = !font.checked;
    return;
  }
  for (const input of font) {
    if (!input.checked) continue;
    remover.disabled = false;
    return;
  }
  remover.disabled = true;
};

for (const button of list.querySelectorAll('[data-dir=up]')) {
  button.onclick = itemUp;
  button.disabled = false;
}

for (const button of list.querySelectorAll('[data-dir=down]')) {
  button.onclick = itemDown;
  button.disabled = false;
}

fileURL = createScriptFile(output.value);
downloader.href = fileURL;

const [ CanvasKit ] = await ((load) => Promise.all([
  CanvasKitInit(),
  load('NotoSansKR-Regular.woff2'),
  load('NotoColorEmoji.woff2'),
]))(async (file) => {
  const res = await fetch(file);
  if (!res.ok) throw new Error();
  const buffer = await res.arrayBuffer();
  defaultFontMap.set(file, buffer);
  fontMap.set(file, buffer);
});

form.onsubmit = (event) => {
  event.preventDefault();
  const backgroundColor = parseColor(controls.backgroundColor.value);
  const frameColor = parseColor(controls.frameColor.value);
  const textColor = parseColor(controls.textColor.value);
  const fontSize = controls.fontSize.valueAsNumber;
  const lineHeight = controls.lineHeight.valueAsNumber / 100;
  const horizontalFrameThickness = controls.horizontalFrameThickness.valueAsNumber;
  const verticalFrameThickness = controls.verticalFrameThickness.valueAsNumber;
  const frameLeft = controls.frameLeft.valueAsNumber;
  const frameTop = controls.frameTop.valueAsNumber;
  const contentLeft = controls.contentLeft.valueAsNumber;
  const minContentTop = controls.minContentTop.valueAsNumber;
  const fonts = [];
  const { font } = controls;
  if (font instanceof HTMLInputElement) {
    const { value } = font;
    fonts.push(fontMap.get(value));
  } else for (const { value } of font) {
    fonts.push(fontMap.get(value));
  }
  const buffer = ImageBuilder.generate(CanvasKit, fonts, {
    backgroundColor,
    frameColor,
    textColor,
    fontSize,
    lineHeight,
    horizontalFrameThickness,
    verticalFrameThickness,
    frameLeft,
    frameTop,
    contentLeft,
    minContentTop,
  }, controls.message.value);
  if (imageURL !== null) URL.revokeObjectURL(imageURL);
  imageURL = URL.createObjectURL(new Blob([buffer]));
  image.src = imageURL;
  image.width = buffer.width;
  image.height = buffer.height;
  const backgroundColorHex = hex(backgroundColor);
  const frameColorHex = hex(frameColor);
  const textColorHex = hex(textColor);
  const text = output.value = `\
export const fonts = [${[...fontMap.keys()].reduce((code, name) => code + `
  ${JSON.stringify(name)},`, '')}
];

export const style = {
  backgroundColor: ${rgb(backgroundColorHex)}, // #${backgroundColorHex}
  frameColor: ${rgb(frameColorHex)}, // #${frameColorHex}
  textColor: ${rgb(textColorHex)}, // #${textColorHex}
  fontSize: ${fontSize},
  lineHeight: ${lineHeight},
  horizontalFrameThickness: ${horizontalFrameThickness},
  verticalFrameThickness: ${verticalFrameThickness},
  frameLeft: ${frameLeft},
  frameTop: ${frameTop},
  contentLeft: ${contentLeft},
  minContentTop: ${minContentTop},
};
`;
  URL.revokeObjectURL(fileURL);
  fileURL = createScriptFile(text);
  downloader.href = fileURL;
  const y = form.getBoundingClientRect().y - 8;
  if (y < 0) window.scrollBy(0, y);
};

controls.submit.disabled = false;

function createScriptFile(text) {
  return URL.createObjectURL(new Blob([text], { type: 'text/javascript' }));
}

function parseColor(color) {
  return [
    Number.parseInt(color.slice(1, 3), 16),
    Number.parseInt(color.slice(3, 5), 16),
    Number.parseInt(color.slice(5, 7), 16),
  ];
}

function hex(rgb) {
  return (rgb[0] * 0x10000 + rgb[1] * 0x100 + rgb[2]).toString(16).padStart(6, '0');
}

function rgb(hex) {
  return `[0x${hex.slice(0, 2)}, 0x${hex.slice(2, 4)}, 0x${hex.slice(4)}]`;
}
