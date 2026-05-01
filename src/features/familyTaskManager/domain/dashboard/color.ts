export const PROFILE_FALLBACK_COLORS = ["#f0df8e", "#b9a8ff", "#8de9d6", "#95b9ff", "#f3b589", "#95d8a4"];

export function hexToRgba(color: string, alpha: number): string {
  const raw = color.trim().replace("#", "");
  const expanded =
    raw.length === 3 && /^[0-9a-fA-F]{3}$/.test(raw) ? `${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}` : raw;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    return `rgba(148, 163, 184, ${alpha})`;
  }

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
