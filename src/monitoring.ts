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
    let peak = 0;
    let changedTiles = 0;
    for (let y = 0; y < height; y += tile) {
        for (let x = 0; x < width; x += tile) {
            let changed = 0;
            for (let dy = 0; dy < tile; dy++) {
                for (let dx = 0; dx < tile; dx++) {
                    const i = (y + dy) * width + x + dx;
                    if (Math.abs(frame[i] - reference[i] - exposure) > 12) {
                        changed++;
                    }
                }
            }
            const fraction = changed / (tile * tile);
            peak = Math.max(peak, fraction);
            if (fraction >= 0.3) {
                changedTiles++;
            }
        }
    }
    return { peak, changedTiles, shifted: changedTiles >= 3 };
}

export function decibels(samples: Uint8Array) {
    let squares = 0;
    for (let i = 0; i < samples.length; i++) {
        const sample = (samples[i] - 128) / 128;
        squares += sample * sample;
    }
    return 10 * Math.log10(squares / samples.length);
}
