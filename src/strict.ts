import { Challenge, Group, Reading } from './challenges';

interface Limits {
    motion?: [number, number];
    tiles?: [number, number];
    noise?: [number, number];
}

const targets = {
    fineHold: { motion: [0, .04] },
    measuredMotion: { motion: [.08, .25] },
    narrowMotion: { motion: [.08, .15] },
    exactHome: { tiles: [0, 1] },
    closeOffset: { tiles: [3, 8] },
    wideOffset: { tiles: [9, 20] },
    offsetLock: { tiles: [3, 8], motion: [0, .04] },
    deepQuiet: { noise: [-Infinity, -46] },
    softBand: { noise: [-38, -32] },
    middleBand: { noise: [-30, -24] },
    narrowBand: { noise: [-34, -31] },
    quietLock: { noise: [-Infinity, -44], motion: [0, .04] },
    voicedAnchor: { noise: [-38, -32], tiles: [0, 1] },
    quietOffset: { noise: [-Infinity, -44], tiles: [3, 8] },
    tripleLock: { noise: [-Infinity, -46], tiles: [0, 1], motion: [0, .04] }
};
export type StrictRule = keyof typeof targets;
const limits: Record<StrictRule, Limits> = targets as Record<StrictRule, Limits>;

export function isStrictRule(rule: string): rule is StrictRule {
    return Object.prototype.hasOwnProperty.call(targets, rule);
}

export function meetsLimits(rule: StrictRule, r: Reading): boolean | undefined {
    const bounds = limits[rule];
    const channels = Object.keys(bounds) as Array<keyof Limits>;
    if (channels.some(key => r[key] === undefined)) { return undefined; }
    return channels.every(key => {
        const [low, high] = bounds[key]!;
        const value = r[key]!;
        return value >= low && value <= high;
    });
}

export function describeLimits(rule: StrictRule) {
    const { motion, tiles, noise } = limits[rule];
    const parts: string[] = [];
    if (motion) { parts.push('movement ' + motion[0] * 100 + '–' + motion[1] * 100 + '%'); }
    if (tiles) { parts.push(tiles[0] + '–' + tiles[1] + ' camera tiles changed from the starting view'); }
    if (noise) { parts.push('microphone ' + (noise[0] === -Infinity ? 'at or below ' + noise[1] : noise.join(' to ')) + ' dBFS'); }
    return parts.join(' and ') + '.';
}

function strict(id: string, name: string, group: Group, brief: string, ...holds: Array<[StrictRule, number]>): Challenge {
    return { id, name, group, brief, strict: true,
        stages: holds.map(([rule, seconds]) => ({ rule, seconds, streak: true })) };
}
export const strictCourses = [
    strict('stillpoint','Stillpoint','Movement','Keep even small movements below the four-percent ceiling.', ['fineHold',15]),
    strict('governor','Speed governor','Movement','Sustain moderate, controlled movement inside a bounded range.', ['measuredMotion',5]),
    strict('thread','Thread the needle','Movement','Move continuously inside a narrow band.', ['narrowMotion',5]),
    strict('brake','Precision brake','Movement','Decelerate from broad movement to a narrow band, then freeze.', ['measuredMotion',4],['narrowMotion',4],['fineHold',8]),
    strict('escapement','Escapement','Movement','Switch twice between a precise freeze and controlled movement.', ['fineHold',6],['measuredMotion',3],['fineHold',6],['narrowMotion',3]),
    strict('registration','Registration mark','Position','Keep the camera scene within one changed tile of home.', ['exactHome',15]),
    strict('near-field','Near field','Position','Hold a small offset without drifting too far.', ['closeOffset',10]),
    strict('two-depths','Two distances','Position','Step through two distinct amounts of scene change.', ['closeOffset',5],['wideOffset',6]),
    strict('landing','Precision landing','Position','Travel outward, narrow the offset, and return to the original view.', ['wideOffset',5],['closeOffset',5],['exactHome',8]),
    strict('offset-clamp','Offset clamp','Position','Settle at a small offset and hold the movement ceiling there.', ['closeOffset',4],['offsetLock',12]),
    strict('noise-floor','Noise floor','Sound','Hold a lower microphone ceiling for fifteen seconds.', ['deepQuiet',15]),
    strict('soft-channel','Soft channel','Sound','Hold your microphone signal within a six-decibel band.', ['softBand',5]),
    strict('three-db','Three-decibel window','Sound','Maintain a steady sound within a three-decibel band.', ['narrowBand',4]),
    strict('terraces','Sound terraces','Sound','Raise the input level, then return to the softer band.', ['softBand',3],['middleBand',3],['softBand',4]),
    strict('cutoff','Clean cutoff','Sound','Alternate a narrow sound band and deep quiet twice.', ['narrowBand',3],['deepQuiet',5],['narrowBand',3],['deepQuiet',8]),
    strict('quiet-clamp','Quiet clamp','Mixed','Meet the quiet and stillness limits at the same instant.', ['quietLock',12]),
    strict('voice-register','Voice in register','Mixed','Hold your starting position while maintaining a soft sound band.', ['voicedAnchor',5]),
    strict('silent-offset','Silent offset','Mixed','Hold a small positional shift under the sound ceiling.', ['quietOffset',10]),
    strict('triple','Triple lock','Mixed','Match the starting scene, stay still, and hold deep quiet together.', ['tripleLock',12]),
    strict('inspection','Final inspection','Mixed','Move through an offset hold, voiced return, quiet freeze and triple lock.', ['offsetLock',5],['quietOffset',5],['voicedAnchor',4],['quietLock',6],['tripleLock',10])
];
