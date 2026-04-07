// © 2025 주유월 <ju@yuwol.pe.kr>
// SPDX-License-Identifier: Zlib

class Block extends Array {
  space = 0;

  render(space) {
    const block = this.slice();
    block.space = this.space + space;
    return block;
  }

  toString(space = 0) {
    return this.join('\n' + ' '.repeat(this.space + space));
  }
}

export const DO_NOT_SEND = '현재 새 쪽지를 받고 있지 않습니다.';

/**
 * @param {string|null|undefined} value
 * @param {string} [fallback]
 * @returns {string}
 */
export function escapeHTML(value, fallback = '') {
  return (value == null) ? fallback : (value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
  );
}

/**
 * @param {string|null|undefined} value
 * @param {string} [fallback]
 * @returns {string}
 */
export function escapeElement(value, fallback = '') {
  return (value == null) ? fallback : (value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
  );
}

export function formatDateTime(datetime) {
  const month = +datetime.slice(5, 7);
  const day = +datetime.slice(8, 10);
  const date = `${datetime.slice(0, 4)}. ${month}. ${day}.`;
  return (datetime.length > 10) ? `${date} ${datetime.slice(11, 19)}` : date;
}

export function prettify(str) {
  return Block.from(str.split('\n'));
}

export function pretty(strs, ...exps) {
  const block = Block.from(strs[0].split('\n'));
  const end = exps.length;
  let i = 0, k = block.length - 1;
  while (i < end) {
    const exp = exps[i], str = strs[++i];
    if (!(exp instanceof Block)) {
      block[k] += exp;
    } else if (exp.length === 1) {
      block[k] += exp[0];
    } else {
      const { space } = exp;
      let values = exp.values();
      block[k] += values.next().value;
      if (space > 0) {
        const gap = ' '.repeat(space);
        values = values.map(e => gap + e);
      }
      k = block.push(...values) - 1;
    }
    if (str === '') continue;
    const index = str.indexOf('\n');
    if (index === -1) {
      block[k] += str;
    } else {
      if (index > 0) block[k] += str.slice(0, index);
      k = block.push(...str.slice(index + 1).split('\n')) - 1;
    }
  }
  return block;
}
