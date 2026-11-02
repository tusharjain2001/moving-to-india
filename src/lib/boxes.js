// "A few boxes" moves skip the AI survey: the customer adds boxes by size instead
// (same sizes, volumes and item shape as the Malaysia project's box builder).
// Dims are metres, like the AI survey items. The volume is Malaysia's figure per box
// (4 / 5 / 6 cft), which is more than length x width x height.
export const BOX_SIZES = {
  S: { label: "Small", dims: [0.46, 0.33, 0.38], vol: 0.1133 }, // 4 cft
  M: { label: "Medium", dims: [0.46, 0.46, 0.52], vol: 0.1416 }, // 5 cft
  L: { label: "Large", dims: [0.46, 0.46, 0.74], vol: 0.1699 }, // 6 cft
};

export const boxVolume = (size) => BOX_SIZES[size].vol;
export const boxCm = (size) => BOX_SIZES[size].dims.map((m) => Math.round(m * 100)).join(" × ") + " cm";

/** boxes: [{ size, contents, weight (kg per box), qty }] -> the order items the quotation sends. */
export const boxItems = (boxes) =>
  boxes.map((b) => ({
    name: `${BOX_SIZES[b.size].label} box — ${b.contents}`,
    dims: BOX_SIZES[b.size].dims,
    volM3: BOX_SIZES[b.size].vol,
    qty: b.qty,
    weightKg: b.weight,
  }));
