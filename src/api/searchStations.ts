import { Station } from "./station.ts";

export async function searchStations(
  term: string,
  options?: { signal?: AbortSignal },
): Promise<Station[]> {
  const response = await fetch(
    `https://search.ch/timetable/api/completion.json?show_ids=1&term=${encodeURIComponent(term)}`,
    { signal: options?.signal },
  );
  const data = await response.json();
  return data.filter(
    (r: Station) =>
      r.iconclass === "sl-icon-type-train" ||
      r.iconclass === "sl-icon-type-strain",
  );
}
