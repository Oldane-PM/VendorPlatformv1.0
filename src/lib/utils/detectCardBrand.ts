/**
 * detectCardBrand — derives card network from a card number.
 *
 * Visa:       starts with 4, length 13 | 16 | 19
 * Mastercard: starts with 51-55 OR 2221-2720, length 16
 */
export type CardBrand = 'visa' | 'mastercard' | 'unknown';

export function detectCardBrand(cardNumber: string): CardBrand {
  const digits = cardNumber.replace(/\D/g, '');

  if (!digits.length) return 'unknown';

  // Visa: starts with 4, length 13/16/19
  if (/^4/.test(digits) && [13, 16, 19].includes(digits.length)) {
    return 'visa';
  }

  // Mastercard: starts with 51-55 or 2221-2720, length 16
  if (digits.length === 16) {
    const twoDigit = parseInt(digits.substring(0, 2), 10);
    if (twoDigit >= 51 && twoDigit <= 55) return 'mastercard';

    const fourDigit = parseInt(digits.substring(0, 4), 10);
    if (fourDigit >= 2221 && fourDigit <= 2720) return 'mastercard';
  }

  return 'unknown';
}

/** Label for display. */
export function cardBrandLabel(brand: CardBrand): string {
  switch (brand) {
    case 'visa':
      return 'Visa';
    case 'mastercard':
      return 'Mastercard';
    default:
      return 'Card';
  }
}
