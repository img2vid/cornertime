import { Challenge, courses, Rule } from './challenges';

const names = [
    'Short stillness hold', 'Uninterrupted quiet standing', 'Careful stillness hold', 'Two-part stillness duty', 'Four-part standing duty',
    'Stand in place', 'Keep your place', 'Return to attention', 'Four position checks', 'Hold your starting position',
    'Quiet time', 'Silent interval', 'Quiet reflection', 'Three quiet intervals', 'Four quiet intervals',
    'Silent corner', 'Stillness and silence', 'Stand and settle', 'Three-part corner duty', 'Full corner duty',
    'Extended stillness', 'Standing at attention', 'Close stillness check', 'Three standing checks', 'Four close standing checks',
    'Stay at your mark', 'Position duty', 'Two position checks', 'Three position checks', 'Extended position duty',
    'Extended silence', 'Quiet interval', 'Close silence check', 'Three silence checks', 'Four silence checks',
    'Still and silent', 'Silent position duty', 'Quiet standing duty', 'Close corner supervision', 'Final corner duty'
];

// Each original stage becomes a timed duty with the same required device.
function dutyRule(rule: Rule): Rule {
    switch (rule) {
        case 'still': case 'move': case 'measuredMotion': return 'still';
        case 'precision': case 'fineHold': case 'narrowMotion': return 'precision';
        case 'anchor': case 'shift': case 'lock': case 'exactHome': case 'closeOffset':
        case 'wideOffset': case 'offsetLock': return 'anchor';
        case 'quiet': case 'voice': case 'softBand': case 'middleBand': return 'quiet';
        case 'hush': case 'deepQuiet': case 'narrowBand': return 'hush';
        default: return 'combined';
    }
}
export const duties: Challenge[] = courses.map((c,i) => ({
    ...c, id: 'duty-' + c.id, name: names[i],
    brief: { Movement: 'Remain comfortably still until dismissed.', Position: 'Stay in your starting place until the timer finishes.',
        Sound: 'Observe quiet time until dismissed.', Mixed: 'Follow the instructions for each part of your corner time.' }[c.group],
    stages: c.stages.map(s => ({ rule:dutyRule(s.rule), seconds:(c.strict ? 36 : 30) * 60, streak:false }))
}));

export interface Discipline { violations: number; added: number; outside: number; recovery: number; warned: boolean; }
export const cleanRecord: Discipline = { violations:0, added:0, outside:0, recovery:0, warned:false };
export function assess(record: Discipline, met: boolean): Discipline {
    if (met) {
        const recovery = record.recovery + 1;
        return { ...record, outside:0, recovery, warned:record.warned && recovery < 2 };
    }
    const outside = record.outside + 1;
    if (outside === 2 && !record.warned) {
        return { violations:record.violations + 1, added:Math.min(30,record.added + (record.violations ? 5 : 0)),
            recovery:0, outside, warned:true };
    }
    return { ...record, outside, recovery:0 };
}
