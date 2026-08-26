import { post } from "@/services/ApiService";
import type { TaskCoachAdviceDto } from "../models/dto";
import { getTimezoneHeader } from "./timezone";

const BASE = "/private/family/task-coach";

export const taskCoachApi = {
  getAdvice(profileUuid?: string): Promise<TaskCoachAdviceDto> {
    const headers = getTimezoneHeader();
    return post(`${BASE}/advice`, profileUuid ? { profileUuid } : {}, headers ? { headers } : undefined);
  },

  synthesizeSpeech(profileUuid: string, speechText: string): Promise<Blob> {
    return post(`${BASE}/speech`, { profileUuid, speechText }, { responseType: "blob" });
  },
};
