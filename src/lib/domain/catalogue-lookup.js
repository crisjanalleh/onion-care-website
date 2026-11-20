/**
 * Resolution of free-text locations to the legacy catalogue's canonical labels.
 * The legacy system routed a farmer to an administrator by location, so the exact
 * label matters and anything unrecognised is rejected rather than guessed at.
 */
import { LOCATIONS } from "@/lib/domain/catalogue";
import { normalizeLocationKey } from "@/lib/format";

export { normalizeLocationKey };

const BY_KEY = new Map(LOCATIONS.map((entry) => [normalizeLocationKey(entry.location), entry]));

/** The canonical label for a location the catalogue knows, or null. */
export function canonicalLocation(value) {
  if (!value) return null;
  return BY_KEY.get(normalizeLocationKey(String(value)))?.location ?? null;
}

/** The legacy administrator username routed for a location, or null. */
export function adminUsernameForLocation(value) {
  if (!value) return null;
  return BY_KEY.get(normalizeLocationKey(String(value)))?.adminUsername ?? null;
}
