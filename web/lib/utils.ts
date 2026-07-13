import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCleanTaskDescription(description: string | null | undefined): string {
  if (!description) return '';
  return description.replace(/\[(version|Note|Reviewer|Result):[^\]]*\]/g, '').trim();
}

/**
 * Safely parses a Prisma Decimal object or string into a Number.
 * Handles the case where the Prisma Decimal is serialized as { s, e, d }
 * due to Redis cache omitting the ClassSerializerInterceptor.
 */
export function parseDecimal(value: any): number {
  if (value === null || value === undefined) return 0;
  
  if (typeof value === 'number') return value;
  
  if (typeof value === 'string') {
    const parsed = Number(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  // Handle Prisma Decimal internal structure { s, e, d }
  if (typeof value === 'object' && Array.isArray(value.d)) {
    try {
      const sign = value.s || 1;
      const exponentRaw = value.e || 0;
      const digitsStr = value.d.map((num: number, idx: number) => idx === 0 ? num.toString() : num.toString().padStart(7, '0')).join('');
      const exponent = exponentRaw - (digitsStr.length - 1);
      const numStr = (sign < 0 ? '-' : '') + digitsStr + 'e' + exponent;
      const parsed = parseFloat(numStr);
      return isNaN(parsed) ? 0 : parsed;
    } catch (e) {
      console.error('Failed to parse Decimal object', e);
    }
  }
  return 0;
}
