// © 2025 주유월 <ju@yuwol.pe.kr>
// SPDX-License-Identifier: Zlib

import {
  INDEX_CARD, createCard, fontMap, generatorElements,
  generatorForm, getStyle, promise, updateOutput,
} from './app.js';
import CanvasKit from './canvaskit.js';
import { ImageBuilder } from './image.js';

const image = document.getElementById('preview');
let imageURL = '';

generatorForm.onsubmit = (event) => {
  event.preventDefault();
  const item = generatorElements.font;
  if (item === undefined) return;
  const fontNames = (
    (item instanceof RadioNodeList) ?
    Array.from(item, e => e.value) :
    [item.value]
  );
  const fonts = fontNames.map(e => fontMap.get(e));
  const style = getStyle(generatorElements);
  const message = generatorElements.message.value;
  const buffer = ImageBuilder.generate(CanvasKit, fonts, style, message);
  URL.revokeObjectURL(imageURL);
  image.src = imageURL = URL.createObjectURL(new Blob([buffer]));
  image.width = buffer.width;
  image.height = buffer.height;
  updateOutput(createCard(fontNames, style), INDEX_CARD);
  const y = generatorForm.getBoundingClientRect().y - 8;
  if (y < 0) window.scrollBy(0, y);
};

await promise;

generatorForm.querySelector('[type=submit]').disabled = false;
