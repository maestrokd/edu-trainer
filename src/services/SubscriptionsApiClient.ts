import { get, post } from "@/services/ApiService";
import type { Authority } from "@/contexts/AuthContext.tsx";

export interface RedeemRequest {
  promoCode: string;
}

export interface RedeemResponse {
  planName: string;
  endsAt: Date | null;
}

export interface EntitlementsResponse {
  planName: string;
  endsAt: Date | null;
  authorities: Authority[];
}

// Transport (DTO) types returned by the backend
interface RedeemResponseDto {
  planName: string;
  endsAt: string | null; // ISO string with offset
}

interface EntitlementsResponseDto {
  planName: string;
  endsAt: string | null; // ISO string with offset
  authorities: Authority[];
}

function generateIdempotencyKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function parseNullableDate(isoString: string | null): Date | null {
  if (!isoString) return null;
  const parsed = new Date(isoString);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

class SubscriptionsApiClient {
  static generatePromoCode(): Promise<void> {
    const url = `/private/promo-codes/generates`;
    return post<void>(url);
  }

  static redeemPromoCode(request: RedeemRequest): Promise<RedeemResponse> {
    const url = `/private/promo-codes/redeems`;
    const idempotencyKey = generateIdempotencyKey();
    return post<RedeemResponseDto>(url, request, {
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    }).then((dto) => ({
      planName: dto.planName,
      endsAt: parseNullableDate(dto.endsAt),
    }));
  }

  static fetchEntitlements(): Promise<EntitlementsResponse> {
    const url = `/private/subscriptions/entitlements/me`;
    return get<EntitlementsResponseDto>(url).then((dto) => ({
      planName: dto.planName,
      endsAt: parseNullableDate(dto.endsAt),
      authorities: dto.authorities,
    }));
  }
}

export default SubscriptionsApiClient;
