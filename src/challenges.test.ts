import { advance, courses, evaluate, initialRun, scoreSecond, Reading, Rule, target } from './challenges';

const good: Record<Rule, Reading> = {
    fineHold:{motion:.03}, measuredMotion:{motion:.20}, narrowMotion:{motion:.11},
    exactHome:{tiles:1}, closeOffset:{tiles:4}, wideOffset:{tiles:12}, offsetLock:{tiles:5,motion:.03},
    deepQuiet:{noise:-50}, softBand:{noise:-35}, middleBand:{noise:-27}, narrowBand:{noise:-32},
    quietLock:{noise:-46,motion:.02}, voicedAnchor:{noise:-35,tiles:1}, quietOffset:{noise:-45,tiles:4},
    tripleLock:{noise:-49,tiles:0,motion:.02}, still:{motion:0}, precision:{motion:.05}, move:{motion:.3}, anchor:{shifted:false}, shift:{shifted:true},
    quiet:{noise:-32}, hush:{noise:-45}, voice:{noise:-25}, combined:{noise:-36,motion:.1}, lock:{shifted:false,motion:.03} };
it.each(courses.map(c => c.id))('can complete %s at its stated target', id => {
    const c = courses.find(item => item.id === id)!;
    let run = initialRun;
    c.stages.forEach(stage => {
        expect(evaluate(stage.rule, {})).toBeUndefined();
        for (let i = 0; i < stage.seconds; i++) {
            const hit = scoreSecond(c, stage.rule, Array(10).fill(good[stage.rule]));
            expect(hit).toBe(true);
            run = advance(run, c, hit!);
        }
    });
    expect(run.stage).toBe(c.stages.length);
    expect(run.elapsed).toBe(target(c));
});
it('resets consecutive holds and preserves banked seconds on a miss', () => {
    const partial = { ...initialRun, progress:3, combo:3 };
    expect(advance(partial,courses[0],false).progress).toBe(3);
    expect(advance(partial,courses[1],false).progress).toBe(0);
});
it('distinguishes silence from missing audio and rejects incomplete dual-sensor samples', () => {
    expect(evaluate('quiet',{noise:-Infinity})).toBe(true);
    expect(evaluate('voice',{noise:-Infinity})).toBe(false);
    expect(evaluate('combined',{motion:0})).toBeUndefined();
});
it('has 20 distinct strict courses and retains 20 original courses', () => {
    expect(new Set(courses.map(c => c.id)).size).toBe(40);
    expect(courses.filter(c => c.strict)).toHaveLength(20);
    for (const c of courses.filter(item => item.strict)) {
        expect(c.stages.every(stage => stage.streak)).toBe(true);
    }
});
it('requires a full strict window and rejects a single outlier', () => {
    const c = courses.find(item => item.id === 'stillpoint')!;
    const eight = Array(8).fill({motion:.04});
    expect(scoreSecond(c,'fineHold',eight)).toBe(true);
    expect(scoreSecond(c,'fineHold',eight.slice(1))).toBeUndefined();
    expect(scoreSecond(c,'fineHold',[...eight,{}])).toBeUndefined();
    expect(scoreSecond(c,'fineHold',[...eight,{motion:.05}])).toBe(false);
    expect(scoreSecond(courses[0],'still',[...eight,{motion:.3}])).toBe(true);
});
it('enforces both ends of bands and all channels of triple lock', () => {
    expect(evaluate('closeOffset',{tiles:2})).toBe(false);
    expect(evaluate('closeOffset',{tiles:9})).toBe(false);
    expect(evaluate('narrowBand',{noise:-35})).toBe(false);
    expect(evaluate('narrowBand',{noise:-30})).toBe(false);
    expect(evaluate('tripleLock',{tiles:1,noise:-47})).toBeUndefined();
    expect(evaluate('tripleLock',{tiles:2,noise:-47,motion:.03})).toBe(false);
});
