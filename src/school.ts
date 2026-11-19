// Each minute needs both foreground timer time and a completed on-screen task.
export type Style = 'lines' | 'alternate' | 'register' | 'format' | 'sequence' | 'check';
export interface Assignment {
    id: string; name: string; group: string; style: Style;
    minutes: number; entries: number; prompts: string[]; instructions: string;
}
const durations = [30,45,60,90,120,180];
function series(style: Style, group: string, instructions: string, entries: number,
                variants: Array<[string,string[]]>): Assignment[] {
    return variants.map(([name,prompts],i) => ({
        id:style+'-'+(i+1), name, group, instructions, style, entries, prompts, minutes:durations[i]
    }));
}
export const schoolTasks = [
    ...series('lines','Assigned lines','Type the displayed line three times each minute.',3,[
        ['Assigned lines',['I will take my time and type carefully.']],
        ['Quiet lines',['I can wait quietly until the timer ends.']],
        ['Careful copies',['I will check each line before I submit it.']],
        ['Complete lines',['I will finish one line before starting another.']],
        ['Steady lines',['I will keep a steady pace throughout this session.']],
        ['Long-form lines',['I will give each line the same care as the first.']]
    ]),
    ...series('alternate','Alternating lines','Copy the changing lines in the order shown, three entries per minute.',3,[
        ['Two-line rotation',['One line at a time.','One minute at a time.']],
        ['Pause and proceed',['Read the line.','Pause briefly.','Type with care.']],
        ['Opening and closing lines',['I begin this entry.','I close this entry.']],
        ['Three-line rotation',['Ready to begin.','Continuing steadily.','Entry complete.']],
        ['Quiet refrain',['A quiet start.','I will wait.','A quiet finish.','I will wait.']],
        ['Four-line rotation',['First, I read.','Next, I type.','Then, I check.','Finally, I submit.']]
    ]),
    ...series('register','Numbered entries','Copy each entry with its displayed serial number. Complete two entries per minute.',2,[
        ['Line register',['Line entered.']],['Time register',['Time served.']],['Silence register',['Quiet interval.']],
        ['Attendance register',['Present for this interval.']],['Entry ledger',['Entry opened.','Entry closed.']],
        ['Double-entry register',['First entry checked.','Second entry checked.']]
    ]),
    ...series('format','Exact copies','Match the displayed capitals, punctuation and internal spaces. Complete two copies per minute.',2,[
        ['Capital-letter lines',['QUIET TIME']],['Lowercase copies',['one line at a time']],
        ['Punctuation lines',['Pause. Wait. Continue.','Ready, steady, complete.']],
        ['Bracket copies',['[ line checked ]','( interval served )']],
        ['Spaced copies',['A / B / C','C / B / A']],['Case-change copies',['quiet | Quiet | QUIET','line | Line | LINE']]
    ]),
    ...series('sequence','Ordered taps','Tap the highlighted word to work through the displayed order once each minute.',1,[
        ['Two-mark duty',['Left','Right']],['Three-mark duty',['First','Middle','Last']],
        ['Return sequence',['Start','Far','Start']],['Four-mark duty',['Top','Right','Bottom','Left']],
        ['Alternating marks',['A','B','A','C']],['Mirror sequence',['Left','Centre','Right','Centre','Left']]
    ]),
    ...series('check','Timed acknowledgements','Wait for the last ten seconds of each minute, then type the displayed acknowledgement. Late responses are accepted.',1,[
        ['Minute acknowledgement',['Present']],['Quiet check-in',['Still here','Present']],
        ['Interval receipt',['Interval received']],['Alternating receipts',['Received','Acknowledged']],
        ['Three-part check-in',['Ready','Present','Continuing']],['Long detention register',['I acknowledge this interval.','I am ready for the next interval.']]
    ])
];
export interface Work { rounds:number; elapsed:number; entered:number; draft:string; }
export const fresh = (): Work => ({ rounds:0, elapsed:0, entered:0, draft:'' });
export function promptFor(t:Assignment,w:Work) {
    if (t.style === 'sequence') { return t.prompts[w.entered % t.prompts.length]; }
    const serial = w.rounds * t.entries + w.entered;
    const line = t.prompts[serial % t.prompts.length];
    return t.style === 'register' ? String(serial+1).padStart(3,'0') + '. ' + line : line;
}
export function quota(t:Assignment) { return t.style === 'sequence' ? t.prompts.length : t.entries; }
export function canEnter(t:Assignment,w:Work) {
    return w.rounds < t.minutes && w.entered < quota(t) && (t.style !== 'check' || w.elapsed >= 50);
}
export function updateRound(t:Assignment,w:Work):Work {
    if (w.rounds >= t.minutes) { return w; }
    return w.elapsed >= 60 && w.entered >= quota(t) ? {...fresh(),rounds:w.rounds+1} : w;
}
