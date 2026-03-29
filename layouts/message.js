// Copyright 2025 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: 0BSD

import { colors } from './card.js';

export default () => Object.keys(colors).reduce((code, name) => {
  const [ r, g, b ] = colors[name];
  const hex = ((r * 0x10000) + (g * 0x100) + b).toString(16).padStart(6, '0');
  return code + `\
[data-color="${name.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"] {
  color: #${hex};
}
`;
}, `\
.message-line {
  font-size: 0.875rem;
  margin: var(--ld) 0;
}
.message-count {
  float: right;
  text-align: right;
}
.message-count,
.message-loading .message-color,
.color-remember {
  display: none;
}
.message-enabled .message-count,
.message-enabled .color-remember {
  display: block;
}
.message-toggle {
  padding: 1em 0 0;
}
.color-icon {
  display: inline-flex;
  align-items: center;
}
.color-label::after,
.color-icon::before {
  content: ' ';
}
.color-icon::after {
  content: '';
  background-color: currentColor;
  display: inline-block;
  width: 1em;
  height: 1em;
}
.color-icon:not([data-color]) {
  display: none;
}
.color-remember,
.message-submit {
  text-align: right;
}
`);
