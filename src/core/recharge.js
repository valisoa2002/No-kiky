// Network rules are kept separate from the user interface.
// Airtel's full one-step USSD format MUST be tested on a real card.
export const NETWORKS = Object.freeze({
  yas: {
    id: 'yas',
    label: 'Yas',
    color: '#E52F83',
    letter: 'Y',
    mode: 'direct',
    hint: 'Recharge directe',
    verifiedDirect: true,
  },
  orange: {
    id: 'orange',
    label: 'Orange',
    color: '#F58220',
    letter: 'O',
    mode: 'direct-test',
    hint: 'Recharge rapide 202*CODE (a tester)',
    verifiedDirect: false,
  },
  airtel: {
    id: 'airtel',
    label: 'Airtel',
    color: '#E32636',
    letter: 'A',
    mode: 'direct-test',
    hint: 'Prefixe *888* (a verifier)',
    verifiedDirect: false,
  },
});

export const OPERATOR_ORDER = Object.freeze(['yas', 'orange', 'airtel']);

export function sanitizeCode(value) {
  return String(value ?? '').replace(/[^0-9]/g, '');
}

export function isValidCode(code) {
  return typeof code === 'string' && /^\d{14}$/.test(code);
}

// Avoid auto-correcting O/0 or I/1: a false correction could debit the wrong card.
// Extract distinct 14-digit groups with spaces or hyphens between digits.
// Do not truncate a longer number to 14 digits.
export function extractCodeCandidates(rawText) {
  const text = String(rawText ?? '').replace(/\u00a0/g, ' ');
  const candidatePattern = /\d(?:[ \t-]*\d){13}/g;
  const matches = [];
  let match;

  while ((match = candidatePattern.exec(text)) !== null) {
    const before = text[match.index - 1] ?? '';
    const after = text[match.index + match[0].length] ?? '';
    if (/\d/.test(before) || /\d/.test(after)) continue;
    // Ne jamais extraire les 14 premiers chiffres d'un numero plus long,
    // meme si ses derniers chiffres sont separes par un espace/tiret.
    if (/\d[ \t-]*$/.test(text.slice(0, match.index))) continue;
    if (/^[ \t-]*\d/.test(text.slice(match.index + match[0].length))) continue;

    const code = match[0].replace(/\D/g, '');
    if (isValidCode(code) && !matches.includes(code)) matches.push(code);
    if (matches.length >= 10) break;
  }

  return matches;
}

export function buildUssd(networkId, code) {
  if (!isValidCode(code)) {
    throw new Error('Le code doit contenir exactement 14 chiffres.');
  }

  switch (networkId) {
    case 'yas':
      return `#321*${code}#`;
    case 'airtel':
      // User-supplied prefix; the operator publicly documents *888# as a menu.
      return `*888*${code}#`;
    case 'orange':
      // Format fourni par l'utilisateur: exactement 202* + 14 chiffres.
      // Non confirme par les sources officielles Orange; tester sur une SIM Orange.
      // Le menu officiellement documente reste #123# en secours.
      return `202*${code}`;
    default:
      throw new Error('Operateur non pris en charge.');
  }
}

export function toPhoneUrl(ussd) {
  // Important: '#' is a URI fragment delimiter, so it must become %23.
  if (typeof ussd !== 'string' || !/^[0-9*#]+$/.test(ussd)) {
    throw new Error('Commande USSD invalide.');
  }
  return `tel:${encodeURIComponent(ussd)}`;
}
