// Downsample in the canvas first. Small tiles preserve localized movements.
export const width = 96;
export const height = 72;
const tile = 6;

export function luminance(rgba: Uint8ClampedArray) {
    const frame = new Uint8Array(width * height);
    for (let i = 0; i < frame.length; i++) {
        frame[i] = (rgba[4 * i] + 2 * rgba[4 * i + 1] + rgba[4 * i + 2]) / 4;
    }
    return frame;
}

export function compareFrames(frame: Uint8Array, reference: Uint8Array) {
    let exposure = 0;
    for (let i = 0; i < frame.length; i++) {
        exposure += frame[i] - reference[i];
    }
    exposure /= frame.length;
    // Average the four most active tiles so a single noisy patch carries less weight.
    const strongest = [0, 0, 0, 0];
    let changedTiles = 0;
    for (let y = 0; y < height; y += tile) {
        for (let x = 0; x < width; x += tile) {
            let changed = 0;
            for (let dy = 0; dy < tile; dy++) {
                for (let dx = 0; dx < tile; dx++) {
                    const i = (y + dy) * width + x + dx;
                    if (Math.abs(frame[i] - reference[i] - exposure) > 20) {
                        changed++;
                    }
                }
            }
            const fraction = changed / (tile * tile);
            if (fraction > strongest[0]) {
                strongest[0] = fraction;
                strongest.sort((a, b) => a - b);
            }
            if (fraction >= 0.3) {
                changedTiles++;
            }
        }
    }
    return { peak: strongest.reduce((sum, value) => sum + value, 0) / strongest.length, changedTiles, shifted: changedTiles >= 6 };
}
