import type { BidAddressDto } from "../types/contracts";

const DASH_PLACEHOLDER = "-";

export function toDisplayValue(value: unknown): string {
  if (value === null || value === undefined) {
    return DASH_PLACEHOLDER;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : DASH_PLACEHOLDER;
  }

  return String(value);
}

export function toBooleanValue(value: boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return DASH_PLACEHOLDER;
  }
  return value ? "Yes" : "No";
}

export function toListValue(values: Array<string | null | undefined> | null | undefined): string {
  if (!values || values.length === 0) {
    return DASH_PLACEHOLDER;
  }

  const normalized = values.map((item) => toDisplayValue(item)).filter((item) => item !== DASH_PLACEHOLDER);
  return normalized.length > 0 ? normalized.join(", ") : DASH_PLACEHOLDER;
}

export function toConfidenceValue(confidence: number | null | undefined): string {
  if (confidence === null || confidence === undefined || Number.isNaN(confidence)) {
    return DASH_PLACEHOLDER;
  }

  return `${(confidence * 100).toFixed(0)}%`;
}

export function toDateTimeValue(dateTime: string | null | undefined): string {
  const raw = toDisplayValue(dateTime);
  if (raw === DASH_PLACEHOLDER) {
    return DASH_PLACEHOLDER;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  return parsed.toLocaleString();
}

export function toDateValue(dateTime: string | null | undefined): string {
  const raw = toDisplayValue(dateTime);
  if (raw === DASH_PLACEHOLDER) {
    return DASH_PLACEHOLDER;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  return parsed.toLocaleDateString();
}

export function toAddressValue(address: BidAddressDto | null | undefined): string {
  if (!address) {
    return DASH_PLACEHOLDER;
  }

  if (address.full_address && address.full_address.trim().length > 0) {
    return address.full_address;
  }

  const parts = [address.street, address.city, address.state, address.postal_code, address.country]
    .map((part) => (part ?? "").trim())
    .filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : DASH_PLACEHOLDER;
}

export function toNumberValue(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return DASH_PLACEHOLDER;
  }
  return String(value);
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export { DASH_PLACEHOLDER };
