import { describeLimits, isStrictRule, meetsLimits, StrictRule, strictCourses } from './strict';
type BaseRule = 'still' | 'precision' | 'anchor' | 'shift' | 'move' | 'quiet' | 'hush' | 'voice' | 'combined' | 'lock';
export type Rule = BaseRule | StrictRule;
export type Group = 'Movement' | 'Position' | 'Sound' | 'Mixed';
export interface Stage { rule: Rule; seconds: number; streak: boolean; }
export interface Challenge { strict?: boolean; id: string; name: string; group: Group; brief: string; stages: Stage[]; }
export interface Reading { tiles?: number; motion?: number; shifted?: boolean; noise?: number; }

const baseInstructions: Record<BaseRule, string> = {
    still: 'Keep movement at or below 15%.', precision: 'Keep movement at or below 8%.',
    anchor: 'Stay near the starting camera view.', shift: 'Move a little to one side and hold the changed view.',
    move: 'Make a small, visible movement each second (20% or higher).',
    quiet: 'Keep microphone input at or below −30 dBFS.', hush: 'Keep input at or below −40 dBFS.',
    voice: 'Hum or speak softly between −36 and −12 dBFS.',
    combined: 'Stay still (15% or less) and quiet (−30 dBFS or lower).',
    lock: 'Hold the starting view with movement at or below 8%.'
};
export function instruction(rule: Rule) {
    return isStrictRule(rule) ? describeLimits(rule) : baseInstructions[rule];
}
const s = (rule: Rule, seconds: number, streak = false): Stage => ({ rule, seconds, streak });
function course(id: string, name: string, group: Group, brief: string, ...stages: Stage[]): Challenge {
    return { id, name, group, brief, stages };
}
export const courses = [
    course('steady', 'Steady hand', 'Movement', 'Bank ten seconds of stillness. Each steady second counts.', s('still',10)),
    course('streak', 'Unbroken line', 'Movement', 'Build an uninterrupted stillness streak.', s('still',12,true)),
    course('micro', 'Fine control', 'Movement', 'Work inside a tighter movement threshold.', s('precision',12)),
    course('ladder', 'Precision ladder', 'Movement', 'Start steady, then tighten your control.', s('still',6),s('precision',8,true)),
    course('freeze', 'Move & freeze', 'Movement', 'Alternate visible movement with a clean freeze.', s('move',3),s('still',6,true),s('move',3),s('still',6,true)),
    course('anchor', 'Anchor point', 'Position', 'Keep the original view intact for fifteen seconds.', s('anchor',15,true)),
    course('offset', 'Offset hold', 'Position', 'Settle into a different spot after calibration.', s('shift',8,true)),
    course('home', 'Find home', 'Position', 'Shift away, then match your starting view again.', s('shift',4),s('anchor',8,true)),
    course('shuttle', 'Two-point shuttle', 'Position', 'Visit the offset and home positions twice.', s('shift',3),s('anchor',3),s('shift',3),s('anchor',3)),
    course('lock', 'Position lock', 'Position', 'Hold both alignment and fine movement control.', s('lock',12,true)),
    course('quiet', 'Quiet room', 'Sound', 'Accumulate twelve seconds below the sound ceiling.', s('quiet',12)),
    course('hush', 'Hush streak', 'Sound', 'Hold a continuous stretch below a stricter ceiling.', s('hush',8,true)),
    course('voice', 'Level voice', 'Sound', 'Keep a soft voice inside a target level band.', s('voice',5)),
    course('fade', 'Fade to quiet', 'Sound', 'Go from a soft voice to quiet, then quieter still.', s('voice',3),s('quiet',4),s('hush',5)),
    course('echo', 'Call & rest', 'Sound', 'Repeat two short voice and silence intervals.', s('voice',3),s('quiet',3),s('voice',3),s('quiet',3)),
    course('duet', 'Silent statue', 'Mixed', 'Meet the camera and microphone goals together.', s('combined',12,true)),
    course('relay', 'Sensor relay', 'Mixed', 'Pass a stillness stage followed by a sound stage.', s('still',6),s('quiet',6,true)),
    course('reset', 'Quiet return', 'Mixed', 'Leave the starting view, return, then settle quietly.', s('shift',3),s('anchor',4),s('combined',6,true)),
    course('contrast', 'Switchback', 'Mixed', 'Move, speak softly, then freeze in silence.', s('move',3),s('voice',3),s('combined',6,true)),
    course('finale', 'Full circuit', 'Mixed', 'Complete all five movement, position and sound stages.', s('precision',5),s('shift',4),s('anchor',4),s('voice',3),s('combined',8,true)),
    ...strictCourses
];

export function evaluate(rule: Rule, r: Reading): boolean | undefined {
    if (isStrictRule(rule)) { return meetsLimits(rule, r); }
    switch (rule) {
        case 'still': return r.motion === undefined ? undefined : r.motion <= .15;
        case 'precision': return r.motion === undefined ? undefined : r.motion <= .08;
        case 'move': return r.motion === undefined ? undefined : r.motion >= .2;
        case 'anchor': case 'shift': return r.shifted === undefined ? undefined : r.shifted === (rule === 'shift');
        case 'lock': return r.shifted === undefined || r.motion === undefined ? undefined : !r.shifted && r.motion <= .08;
        case 'quiet': case 'hush': case 'voice': {
            if (r.noise === undefined) { return undefined; }
            if (rule === 'voice') { return r.noise >= -36 && r.noise <= -12; }
            return r.noise <= (rule === 'hush' ? -40 : -30);
        }
        case 'combined': return r.noise === undefined || r.motion === undefined ? undefined : r.motion <= .15 && r.noise <= -30;
    }
}

// Undefined denotes a sensor gap, which does not count as a scored second.
export function scoreSecond(course: Challenge, rule: Rule, batch: Reading[], traditional = false): boolean | undefined {
    const checks = batch.map(r => evaluate(rule, r));
    const valid = checks.filter(v => v !== undefined);
    if (course.strict && !traditional) {
        if (valid.length < 8 || valid.length !== batch.length) { return undefined; }
        return valid.every(Boolean);
    }
    if (valid.length < 5) { return undefined; }
    const hits = valid.filter(Boolean).length;
    return rule === 'move' ? hits > 0 : hits >= Math.ceil((course.strict ? .9 : .8) * valid.length);
}

export interface Run { stage: number; progress: number; elapsed: number; hits: number; combo: number; bestCombo: number; }
export const initialRun: Run = { stage: 0, progress: 0, elapsed: 0, hits: 0, combo: 0, bestCombo: 0 };
export function advance(run: Run, course: Challenge, hit: boolean): Run {
    const stage = course.stages[run.stage];
    const progress = hit ? run.progress + 1 : stage.streak ? 0 : run.progress;
    const complete = progress === stage.seconds;
    const combo = hit ? run.combo + 1 : 0;
    return { stage: run.stage + Number(complete), progress: complete ? 0 : progress, combo,
        hits: run.hits + Number(hit), elapsed: run.elapsed + 1, bestCombo: Math.max(run.bestCombo, combo) };
}
export function readLocal<T>(key: string, fallback: T): T {
    try { return JSON.parse(localStorage.getItem('ct.' + key) || 'null') || fallback; }
    catch { return fallback; }
}
export function saveLocal(key: string, value: any) {
    try { localStorage.setItem('ct.' + key, JSON.stringify(value)); } catch { /* Session still works in private mode. */ }
}
export function target(c: Challenge) { return c.stages.reduce((n, stage) => n + stage.seconds, 0); }
