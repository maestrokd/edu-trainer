import { LoginSuggestionCard } from "./LoginSuggestionCard";
import { UpgradeSuggestionCard } from "./UpgradeSuggestionCard";
import { useFamilyTaskCapabilities } from "../../hooks/useFamilyTaskCapabilities";

interface CapabilitySuggestionsProps {
  source: string;
}

export function CapabilitySuggestions({ source }: CapabilitySuggestionsProps) {
  const capabilities = useFamilyTaskCapabilities();

  if (capabilities.shouldShowLoginSuggestion) {
    return <LoginSuggestionCard source={source} />;
  }

  if (capabilities.shouldShowUpgradeSuggestion) {
    return <UpgradeSuggestionCard source={source} />;
  }

  return null;
}
