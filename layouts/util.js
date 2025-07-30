class Block extends Array {
  /**
   * @param {number} space
   * @returns {Block}
   */
  render(space) {
    if (space === 0) return this;
    const gap = ' '.repeat(space);
    const block = this.map(e => (gap + e));
    block[0] = this[0];
    return block;
  }

  toString() {
    return this.join('\n');
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
  const date = `${datetime.slice(0, 4)}. ${+datetime.slice(5, 7)}. ${+datetime.slice(8, 10)}.`;
  if (datetime.length === 10) return date;
  return `${date} ${datetime.slice(11, 19)}`;
}

export function pretty(strs, ...exps) {
  const block = new Block('');
  const values = exps.values();
  let i = 0;
  for (const str of strs) {
    const { value, done } = values.next();
    if (str.length > 0) {
      const lines = str.split('\n');
      block[i] += lines[0];
      if (lines.length > 1) i = block.push(...lines.values().drop(1)) - 1;
    }
    if (done === true) continue;
    if (value instanceof Block) {
      block[i] += value[0];
      if (value.length > 1) i = block.push(...value.values().drop(1)) - 1;
    } else {
      block[i] += value;
    }
  }
  return block;
}
