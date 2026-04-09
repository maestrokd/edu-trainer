import React from "react";
import { RoundingTrainerHeader } from "./RoundingTrainerHeader";

interface RoundingTrainerShellProps {
  children: React.ReactNode;
  isPlayScreen: boolean;
  playSummarySnippet: string | null;
  onNewSession: () => void;
  onBackToSetup: () => void;
  labels: {
    title: string;
    setupLabel: string;
    menuLabel: string;
    newSession: string;
    changeSetup: string;
    toMenu: string;
  };
}

export function RoundingTrainerShell({
  children,
  isPlayScreen,
  playSummarySnippet,
  onNewSession,
  onBackToSetup,
  labels,
}: RoundingTrainerShellProps) {
  return (
    <div className="min-h-dvh w-full bg-gradient-to-br bg-background flex flex-col p-2 sm:p-4 overflow-hidden">
      <div className="w-full flex flex-col h-full">
        <RoundingTrainerHeader
          isPlayScreen={isPlayScreen}
          playSummarySnippet={playSummarySnippet}
          onNewSession={onNewSession}
          onBackToSetup={onBackToSetup}
          labels={labels}
        />
        {children}
      </div>
    </div>
  );
}
