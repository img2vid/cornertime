import { assess, cleanRecord, duties } from './duties';
import { scoreSecond, target } from './challenges';

it('offers forty duties achievable from a still, quiet starting position', () => {
    expect(new Set(duties.map(d => d.name)).size).toBe(40);
    for (const d of duties) {
        for (const stage of d.stages) {
            expect(scoreSecond(d,stage.rule,Array(10).fill({motion:.03,noise:-45,shifted:false}),true)).toBe(true);
        }
    }
});
it('warns once per incident, allows recovery and caps extra time', () => {
    let record = assess(cleanRecord,false);
    expect(record.violations).toBe(0);
    record = assess(record,false);
    expect(record.violations).toBe(1);
    expect(record.added).toBe(0);
    for (let i=0;i<10;i++) { record = assess(record,false); }
    expect(record.violations).toBe(1);
    for (let i=0;i<9;i++) {
        for (const ok of [true,true,false,false]) { record=assess(record,ok); }
        expect(record.added).toBe(Math.min((i+1)*5,30));
    }
});

it('schedules every duty and all three difficulty levels between half an hour and six hours', () => {
    const times = duties.map(target);
    expect(Math.min(...times)).toBe(30 * 60);
    expect(Math.max(...times)).toBe(3 * 3600);
    for (const time of times) {
        for (const scale of [1, 1.5, 2]) {
            expect(time * scale).toBeGreaterThanOrEqual(1800);
            expect(time * scale).toBeLessThanOrEqual(21600);
        }
    }
});
