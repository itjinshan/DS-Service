// One-time cleanup for DestinationSpot documents saved before
// Utils/spotDedup.ts's dedup existed — back then saveSpots() had no dedup
// beyond an exact-name check, so the same real-world place could get saved
// more than once under reworded names (confirmed: "Lama Temple (Yonghe
// Temple)" / "Yonghe Temple (Lama Temple)", ~3m apart). This does NOT
// prevent future duplicates — that's Utils/spotSourcing.ts's job — it only
// cleans up what already landed in Mongo.
//
// Uses the same isLikelyDuplicate() (proximity + name-token-overlap) as the
// live prevention path, via the compiled build/Utils/spotDedup.js, so the
// "same place" definition can't drift between the two. That check alone
// isn't reliable enough to auto-delete on — checked against real sourced
// data, it also flags genuinely distinct co-located landmarks that share a
// place-name token (e.g. "Wawel Royal Castle" vs "Wawel Cathedral", ~23m
// apart, 25% name-token overlap, but a cathedral that's a separately
// notable landmark within the castle grounds, not a reworded duplicate).
// So every cluster this finds is split into two tiers:
//   - HIGH CONFIDENCE: every pairwise link in the cluster is both close
//     (<=15m) and has meaningfully overlapping names (>=25% token overlap).
//     Only this tier is ever deleted, and only with --apply.
//   - NEEDS REVIEW: matched the looser 100m/any-overlap check but at least
//     one link falls outside the tight band above. Always just printed,
//     never deleted by this script — a human needs to look at these.
//
// Usage (run from DS-Service/, after `npx tsc` so build/ is current):
//   node scripts/dedupe-destination-spots.js            # dry run, no writes
//   node scripts/dedupe-destination-spots.js --apply     # deletes the
//                                                          high-confidence
//                                                          tier only

require('dotenv').config();
const mongoose = require('mongoose');
const { isLikelyDuplicate, nameTokenOverlap, DUPLICATE_RADIUS_METERS } = require('../build/Utils/spotDedup');
const { distanceMeters } = require('../build/Utils/geo');

const TIGHT_RADIUS_METERS = 15;
const TIGHT_OVERLAP_FLOOR = 0.25;

function toNamedPoint(spot) {
    return { name: spot.SpotName, lat: spot.Latitude, lng: spot.Longitude };
}

function findClusters(spots) {
    const parent = spots.map((_, i) => i);
    function find(i) {
        while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; }
        return i;
    }
    function union(a, b) {
        const ra = find(a), rb = find(b);
        if (ra !== rb) parent[ra] = rb;
    }

    const points = spots.map((s) => (typeof s.Latitude === 'number' ? toNamedPoint(s) : null));
    for (let i = 0; i < spots.length; i++) {
        if (!points[i]) continue;
        for (let j = i + 1; j < spots.length; j++) {
            if (!points[j]) continue;
            if (isLikelyDuplicate(points[i], points[j])) union(i, j);
        }
    }

    const groups = new Map();
    spots.forEach((spot, i) => {
        const root = find(i);
        if (!groups.has(root)) groups.set(root, []);
        groups.get(root).push(spot);
    });
    return [...groups.values()].filter((group) => group.length > 1);
}

// A cluster is high-confidence only if EVERY pair within it clears the
// tight band — one weak link (e.g. one member related to the others only
// via a >15m or low-overlap connection) downgrades the whole cluster to
// manual review rather than risk deleting the wrong member.
function clusterConfidence(cluster) {
    for (let i = 0; i < cluster.length; i++) {
        for (let j = i + 1; j < cluster.length; j++) {
            const a = toNamedPoint(cluster[i]);
            const b = toNamedPoint(cluster[j]);
            const dist = distanceMeters(a, b);
            const overlap = nameTokenOverlap(a.name, b.name);
            if (dist > TIGHT_RADIUS_METERS || overlap < TIGHT_OVERLAP_FLOOR) return 'review';
        }
    }
    return 'high';
}

function pickCanonical(cluster) {
    return cluster.slice().sort((a, b) => {
        if ((b.Rating || 0) !== (a.Rating || 0)) return (b.Rating || 0) - (a.Rating || 0);
        return String(a._id).localeCompare(String(b._id));
    })[0];
}

async function run() {
    const apply = process.argv.includes('--apply');
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const spotsCollection = db.collection('destination spots');

    const allSpots = await spotsCollection.find({}).toArray();
    const byCity = new Map();
    for (const spot of allSpots) {
        const key = String(spot.City);
        if (!byCity.has(key)) byCity.set(key, []);
        byCity.get(key).push(spot);
    }

    const idsToDelete = [];
    let highCount = 0, reviewCount = 0;

    for (const [cityId, spots] of byCity) {
        for (const cluster of findClusters(spots)) {
            const confidence = clusterConfidence(cluster);
            const canonical = pickCanonical(cluster);
            const others = cluster.filter((s) => String(s._id) !== String(canonical._id));

            console.log(`\n[${confidence.toUpperCase()}] City ${cityId} — cluster kept: "${canonical.SpotName}" (${canonical._id})`);
            for (const other of others) {
                const dist = distanceMeters(toNamedPoint(canonical), toNamedPoint(other)).toFixed(1);
                const overlap = nameTokenOverlap(canonical.SpotName, other.SpotName).toFixed(2);
                console.log(`  ${confidence === 'high' ? 'DELETE' : 'REVIEW'} "${other.SpotName}" (${other._id}) — ${dist}m, name overlap ${overlap}`);
            }

            if (confidence === 'high') {
                highCount++;
                idsToDelete.push(...others.map((s) => s._id));
            } else {
                reviewCount++;
            }
        }
    }

    console.log(`\n${highCount} high-confidence cluster(s) (${idsToDelete.length} document(s) to delete), ${reviewCount} cluster(s) flagged for manual review (never auto-deleted).`);
    console.log(`(Dedup radius ${DUPLICATE_RADIUS_METERS}m for detection; ${TIGHT_RADIUS_METERS}m + >= ${TIGHT_OVERLAP_FLOOR} name overlap for auto-delete eligibility.)`);

    if (apply && idsToDelete.length) {
        const result = await spotsCollection.deleteMany({ _id: { $in: idsToDelete } });
        console.log(`Deleted ${result.deletedCount} document(s).`);
    } else if (idsToDelete.length) {
        console.log('Dry run only — re-run with --apply to delete the high-confidence tier.');
    }

    await mongoose.disconnect();
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
