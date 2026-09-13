import { get } from "@/services/ApiService";

export const FeatureFlag = {
  FAMILY_TASK_MANAGER_AI_ASSISTANT: "family-task-manager-ai-assistant",
} as const;

export type FeatureFlag = (typeof FeatureFlag)[keyof typeof FeatureFlag];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function getFeatureFlags(signal?: AbortSignal): Promise<Record<FeatureFlag, boolean>> {
  const response = await get<unknown>("/private/features", { signal });
  const features = isRecord(response) && isRecord(response.features) ? response.features : {};
  return {
    [FeatureFlag.FAMILY_TASK_MANAGER_AI_ASSISTANT]: features[FeatureFlag.FAMILY_TASK_MANAGER_AI_ASSISTANT] === true,
  };
}
