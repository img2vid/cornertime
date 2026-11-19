import { assess, cleanRecord, duties } from './duties';
import { scoreSecond } from './challenges';

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
