// Haversine great-circle distance in meters between two lat/lng points.
export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
    const EARTH_RADIUS_METERS = 6371000;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const sinHalfDLat = Math.sin(dLat / 2);
    const sinHalfDLng = Math.sin(dLng / 2);
    const h = sinHalfDLat * sinHalfDLat
        + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinHalfDLng * sinHalfDLng;
    return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}
