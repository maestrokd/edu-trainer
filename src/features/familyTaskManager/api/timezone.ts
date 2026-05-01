export function getBrowserTimezone(): string | null {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone?.trim() ? timezone : null;
  } catch {
    return null;
  }
}

export function getTimezoneHeader() {
  const timezone = getBrowserTimezone();
  return timezone ? { "X-Timezone": timezone } : undefined;
}
