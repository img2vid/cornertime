import { compareFrames, decibels, height, width } from './monitoring';

it('ignores uniform exposure changes and single noisy pixels at the default threshold', () => {
    const reference = new Uint8Array(width * height).fill(80);
    const frame = new Uint8Array(width * height).fill(100);
    frame[0] = 150;
    expect(compareFrames(frame, reference).peak).toBeLessThan(0.15);
    expect(compareFrames(frame, reference).shifted).toBe(false);
});

it('detects a small movement and distinguishes holding a shifted position', () => {
    const start = new Uint8Array(width * height);
    const frame = start.slice();
    frame.fill(140, 0, 6);
    expect(compareFrames(frame, start).peak).toBeGreaterThan(0.15);
    for (let y = 0; y < 6; y++) {
        frame.fill(140, y * width, y * width + 18);
    }
    expect(compareFrames(frame, frame).peak).toBe(0);
    expect(compareFrames(frame, start).shifted).toBe(true);
    expect(compareFrames(start, start).shifted).toBe(false);
});

it('reports silence and half-scale microphone samples', () => {
    expect(decibels(new Uint8Array([128, 128]))).toBe(-Infinity);
    expect(decibels(new Uint8Array([64, 192]))).toBeCloseTo(-6.02);
});
