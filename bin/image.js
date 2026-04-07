// © 2025 주유월 <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

import { writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import CanvasKitInit from 'canvaskit-wasm';
import { fonts, style } from '../layouts/card.js';
import { ImageBuilder } from '../src/image.js';

const sep = (process.platform === 'win32') ? '\\' : '/';
const { input, output } = parseArgs({
  options: {
    input : { type: 'string', short: 'i' },
    output: { type: 'string', short: 'o' },
  }
}).values;

const [ CanvasKit, message, ...fontFiles ] = await Promise.all([
  CanvasKitInit(),
  readFile(input, 'utf-8'),
  ...fonts.values().map((name) => readFile('fonts' + sep + name)),
]);

writeFileSync(output, ImageBuilder.generate(CanvasKit, fontFiles, style, message));
