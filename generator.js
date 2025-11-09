import {
  createCard, fontMap, generatorControls, generatorForm,
  getStyle, promise, updateOutput,
} from './app.js';
import CanvasKitInit from './canvaskit.js';
import { ImageBuilder } from './image.js';

let imageURL = '';

const image = document.getElementById('preview');
const CanvasKit = await CanvasKitInit();

await promise;

generatorForm.onsubmit = (event) => {
  event.preventDefault();
  const item = generatorControls.font;
  if (item === undefined) return;
  const fonts = (
    (item instanceof HTMLInputElement) ?
    [fontMap.get(item.value)] :
    Array.from(item, (e) => fontMap.get(e.value))
  );
  const style = getStyle(generatorControls);
  const message = generatorControls.message.value;
  const buffer = ImageBuilder.generate(CanvasKit, fonts, style, message);
  URL.revokeObjectURL(imageURL);
  image.src = imageURL = URL.createObjectURL(new Blob([buffer]));
  image.width = buffer.width;
  image.height = buffer.height;
  updateOutput(createCard(generatorControls, style), 1);
  const y = generatorForm.getBoundingClientRect().y - 8;
  if (y < 0) window.scrollBy(0, y);
};

generatorForm.querySelector('[type=submit]').disabled = false;
