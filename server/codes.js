'use strict';

// Ne jamais completer, raccourcir ou corriger un code de recharge automatiquement.
// Accepter uniquement une suite de 14 chiffres (groupes espaces/tirets toleres).
function extractCandidates(text) {
  const value = String(text || '').replace(/\u00a0/g, ' ');
  const re = /\d(?:[ \t-]*\d){13}/g;
  const result = [];
  let match;
  while ((match = re.exec(value)) !== null) {
    const before = value[match.index - 1] || '';
    const after = value[match.index + match[0].length] || '';
    if (/\d/.test(before) || /\d/.test(after)) continue;
    if (/\d[ \t-]*$/.test(value.slice(0, match.index))) continue;
    if (/^[ \t-]*\d/.test(value.slice(match.index + match[0].length))) continue;
    const code = match[0].replace(/\D/g, '');
    if (/^\d{14}$/.test(code) && !result.includes(code)) result.push(code);
    if (result.length >= 10) break;
  }
  return result;
}

module.exports = { extractCandidates };
