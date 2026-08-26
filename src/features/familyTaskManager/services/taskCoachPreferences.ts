const AUTOPLAY_STORAGE_KEY = "family-task-coach:preferences:autoplay";
const AUTO_REQUEST_STORAGE_KEY = "family-task-coach:preferences:auto-request";

export function loadTaskCoachAutoplay(): boolean {
  try {
    const stored = localStorage.getItem(AUTOPLAY_STORAGE_KEY);
    return stored === null ? true : stored === "true";
  } catch {
    return true;
  }
}

export function saveTaskCoachAutoplay(enabled: boolean): void {
  try {
    localStorage.setItem(AUTOPLAY_STORAGE_KEY, String(enabled));
  } catch {
    // Local storage can be unavailable in privacy-restricted browser contexts.
  }
}

export function loadTaskCoachAutoRequest(): boolean {
  try {
    const stored = localStorage.getItem(AUTO_REQUEST_STORAGE_KEY);
    return stored === null ? true : stored === "true";
  } catch {
    return true;
  }
}

export function saveTaskCoachAutoRequest(enabled: boolean): void {
  try {
    localStorage.setItem(AUTO_REQUEST_STORAGE_KEY, String(enabled));
  } catch {
    // Local storage can be unavailable in privacy-restricted browser contexts.
  }
}
