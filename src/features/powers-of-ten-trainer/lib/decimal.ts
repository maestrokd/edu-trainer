import type { DecimalValue } from "../model/trainer.types";

export function normalizeDecimal(value: DecimalValue): DecimalValue {
  let coefficient = Math.trunc(value.coefficient);
  let scale = Math.max(0, Math.trunc(value.scale));
  while (scale > 0 && coefficient % 10 === 0) {
    coefficient /= 10;
    scale -= 1;
  }
  return { coefficient, scale };
}

export function decimalKey(value: DecimalValue): string {
  const normalized = normalizeDecimal(value);
  return `${normalized.coefficient}:${normalized.scale}`;
}

export function decimalEquals(left: DecimalValue, right: DecimalValue): boolean {
  return decimalKey(left) === decimalKey(right);
}

export function shiftDecimal(value: DecimalValue, places: number): DecimalValue {
  if (places === 0) return normalizeDecimal(value);
  if (places < 0) {
    return normalizeDecimal({ coefficient: value.coefficient, scale: value.scale + Math.abs(places) });
  }
  if (value.scale >= places) {
    return normalizeDecimal({ coefficient: value.coefficient, scale: value.scale - places });
  }
  return normalizeDecimal({
    coefficient: value.coefficient * 10 ** (places - value.scale),
    scale: 0,
  });
}

export function decimalToNumber(value: DecimalValue): number {
  return value.coefficient / 10 ** value.scale;
}

export function parseDecimalInput(raw: string): DecimalValue | null {
  const normalized = raw.trim().replace(",", ".");
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  const coefficient = Number(`${whole}${fraction}`);
  if (!Number.isSafeInteger(coefficient)) return null;
  return normalizeDecimal({ coefficient, scale: fraction.length });
}

export function formatDecimal(value: DecimalValue, locale: string, preserveScale = false): string {
  return new Intl.NumberFormat(locale || undefined, {
    minimumFractionDigits: preserveScale ? value.scale : 0,
    maximumFractionDigits: value.scale,
  }).format(decimalToNumber(value));
}
