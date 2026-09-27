import { post } from "@/services/ApiService";
import type { TaskCoachAdviceDto } from "../models/dto";
import { TaskCoachStyle, type TaskCoachStyle as TaskCoachStyleValue } from "../models/enums";
import { getTimezoneHeader } from "./timezone";

const BASE = "/private/family/task-coach";

export const taskCoachApi = {
  getAdvice(
    profileUuid?: string,
    coachStyle: TaskCoachStyleValue = TaskCoachStyle.CHEERFUL
  ): Promise<TaskCoachAdviceDto> {
    const headers = getTimezoneHeader();
    return post(
      `${BASE}/advice`,
      profileUuid ? { profileUuid, coachStyle } : { coachStyle },
      headers ? { headers } : undefined
    );
  },

  synthesizeSpeech(profileUuid: string, speechText: string): Promise<Blob> {
    return post(`${BASE}/speech`, { profileUuid, speechText }, { responseType: "blob" });
  },
};
