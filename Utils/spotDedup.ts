import { distanceMeters } from './geo';

// Two spots within this radius, whose names still share at least one
// meaningful word, are treated as the same real-world place. Shared by
// sourceSpotsForCity() (prevents new duplicates) and
// scripts/dedupe-destination-spots.js (cleans up existing ones), so the
// "same place" definition can't drift between the two.
//
// Neither signal is safe alone, confirmed against real sourced data:
// - Exact-name matching misses reworded duplicates — "Lama Temple (Yonghe
//   Temple)" / "Yonghe Temple (Lama Temple)" were saved as two documents
//   for the same landmark, ~3m apart.
// - Proximity alone produces real false positives — "Ljubljana Castle" and
//   an unrelated nearby cafe sit within a few dozen meters of each other;
//   "National Museum of Slovenia" / "National Gallery of Slovenia" are two
//   separate institutions ~89m apart that happen to share 3 of 5 name
//   tokens ("national", "of", "slovenia").
// Requiring proximity AND some shared vocabulary rules out the
// coincidentally-nearby-but-unrelated case. It does NOT perfectly rule out
// every false positive — two genuinely distinct landmarks that share a
// place-name prefix (e.g. "Wawel Castle" vs "Wawel Cathedral", both real,
// separately-notable places on the same hill) can still clear both checks.
// That residual ambiguity is why the migration script splits its findings
// into a high-confidence and a manual-review tier instead of deleting
// everything this flags.
export const DUPLICATE_RADIUS_METERS = 100;

function tokenSet(name: string): Set<string> {
    return new Set(name.toLowerCase().replace(/[()]/g, ' ').split(/\s+/).filter(Boolean));
}

// Jaccard similarity (intersection / union) of the two names' word sets —
// 0 for no shared words, 1 for identical word sets regardless of order
// (so "Lama Temple (Yonghe Temple)" vs "Yonghe Temple (Lama Temple)" scores
// 1.0 despite the reordering).
export function nameTokenOverlap(nameA: string, nameB: string): number {
    const a = tokenSet(nameA);
    const b = tokenSet(nameB);
    if (!a.size || !b.size) return 0;
    let intersection = 0;
    for (const token of a) if (b.has(token)) intersection++;
    const union = a.size + b.size - intersection;
    return union ? intersection / union : 0;
}

export interface NamedPoint {
    name: string;
    lat: number;
    lng: number;
}

export function isLikelyDuplicate(a: NamedPoint, b: NamedPoint): boolean {
    if (distanceMeters(a, b) > DUPLICATE_RADIUS_METERS) return false;
    return nameTokenOverlap(a.name, b.name) > 0;
}
