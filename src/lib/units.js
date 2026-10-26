// Sizes and volumes (ported from moversely/web/src/lib/units.ts). Dims are metres.
export const M3_TO_FT3 = 35.3147;
const M_TO_IN = 39.3701;

export const itemVolumeM3 = (item) => item.dims[0] * item.dims[1] * item.dims[2] * item.qty;
export const roomVolume = (room) => room.items.reduce((s, it) => s + itemVolumeM3(it), 0);

export function formatVolume(m3, units) {
  return units === "imperial"
    ? `${Math.round(m3 * M3_TO_FT3).toLocaleString()} ft³`
    : `${m3.toFixed(m3 < 10 ? 2 : 1)} m³`;
}

export function formatDims(dims, units) {
  return units === "imperial"
    ? dims.map((m) => `${Math.round(m * M_TO_IN)} in`).join(" × ")
    : dims.map((m) => `${Math.round(m * 100)}`).join(" × ") + " cm";
}

export const toField = (m, units) => Math.round(units === "imperial" ? m * M_TO_IN : m * 100);
export const fromField = (v, units) => (units === "imperial" ? v / M_TO_IN : v / 100);
export const fieldUnit = (units) => (units === "imperial" ? "in" : "cm");

/** Rough shipping guide. Usable container space is less than its nominal volume. */
export function shippingGuide(totalM3) {
  const ft3 = totalM3 * M3_TO_FT3;
  if (ft3 === 0) return "Scan a room to get an estimate";
  if (ft3 < 350) return "Shared container (LCL) or air freight";
  if (ft3 < 1000) return "20 ft container";
  if (ft3 < 2000) return "40 ft container";
  if (ft3 < 2400) return "40 ft high-cube container";
  return `${Math.ceil(ft3 / 2200)} × 40 ft high-cube containers`;
}
