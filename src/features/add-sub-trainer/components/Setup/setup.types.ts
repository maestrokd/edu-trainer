import type { SessionConfig } from "../../model/trainer.types";

export interface AddSubTrainerSetupController {
  state: { config: SessionConfig };
  canStart: boolean;
  actions: {
    updateConfig: (payload: Partial<SessionConfig>) => void;
    startGame: () => void;
  };
}
