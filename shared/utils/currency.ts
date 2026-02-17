/**
 * Currency formatting utilities
 * Handles price display with locale-aware formatting
 */

export interface FormatPriceOptions {
    /** Amount in cents (smallest currency unit) */
    amountInCents: number;
    /** ISO currency code (USD, EUR, GBP, INR, etc.) */
    currency: string;
    /** Optional locale, defaults to en-US */
    locale?: string;
    /** Show decimal places even for whole numbers, defaults to true */
    showDecimals?: boolean;
}

/**
 * Format price from cents to currency string
 * @param amountInCents - Price in cents (e.g., 1999 for $19.99)
 * @param currency - ISO currency code (e.g., 'USD', 'EUR', 'INR')
 * @param locale - Optional locale for formatting (defaults to 'en-US')
 * @returns Formatted price string (e.g., '$19.99', '€19,99', '₹1,999.00')
 */
export function formatPrice(
    amountInCents: number,
    currency: string = 'USD',
    locale: string = 'en-US'
): string {
    // Convert cents to major currency unit
    const amount = amountInCents / 100;

    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency.toUpperCase(),
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch (error) {
        // Fallback to USD if currency code is invalid
        console.error(`Invalid currency code: ${currency}`, error);
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    }
}

/**
 * Format price with custom options
 */
export function formatPriceWithOptions({
    amountInCents,
    currency,
    locale = 'en-US',
    showDecimals = true,
}: FormatPriceOptions): string {
    const amount = amountInCents / 100;

    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency.toUpperCase(),
            minimumFractionDigits: showDecimals ? 2 : 0,
            maximumFractionDigits: showDecimals ? 2 : 0,
        }).format(amount);
    } catch (error) {
        console.error(`Invalid currency code: ${currency}`, error);
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: showDecimals ? 2 : 0,
            maximumFractionDigits: showDecimals ? 2 : 0,
        }).format(amount);
    }
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currency: string, locale: string = 'en-US'): string {
    try {
        const formatted = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency.toUpperCase(),
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(0);

        // Extract just the symbol
        return formatted.replace(/[\d\s,\.]/g, '');
    } catch (error) {
        return '$'; // Default fallback
    }
}

/**
 * Parse price string back to cents
 * Note: This is a simple implementation and may not work for all locales
 */
export function parsePriceToCents(priceString: string): number {
    // Remove currency symbols and spaces
    const cleaned = priceString.replace(/[^0-9.,]/g, '');

    // Handle different decimal separators
    // Assume last separator is decimal point
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');

    let numberString = cleaned;
    if (lastComma > lastDot) {
        // European format (e.g., 1.999,99)
        numberString = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
        // US format (e.g., 1,999.99)
        numberString = cleaned.replace(/,/g, '');
    }

    const amount = parseFloat(numberString);
    return Math.round(amount * 100);
}
