import {classicMinutes,presets,schedule,typingLine,typingTasks} from './chain';

it.each(presets.map(p=>p.level))('allocates the exact preset %i budget and orders each randomized combination',level=>{
    for(const count of [3,presets[level-1].groups,30]){
        const legs=schedule(level,count);
        expect(legs.reduce((sum,l)=>sum+l.seconds,0)).toBe(level*3600);
        for(let group=1;group<=count;group++){
            const block=legs.filter(l=>l.group===group);
            expect(block[0].task).toBe(-1);expect(block[0].seconds).toBeGreaterThan(10);
            const tasks=block.slice(1);
            expect(tasks.length).toBeGreaterThanOrEqual(2);
            expect(new Set(tasks.map(t=>t.task)).size).toBe(tasks.length);
            expect(tasks.every(t=>t.task>=0 && t.task<typingTasks.length && t.seconds>0)).toBe(true);
        }
    }
});
it('accepts exact durations and includes both range endpoints',()=>{
    const spy=jest.spyOn(Math,'random');
    try{
        spy.mockReturnValue(0);expect(classicMinutes('2','4')).toBe(2);
        spy.mockReturnValue(.999999);expect(classicMinutes('2','4')).toBe(4);
        expect(classicMinutes('17','17')).toBe(17);
        for(const [a,b] of [['4','2'],['','2'],['2','x'],['1.5','3'],['0','2']]){expect(classicMinutes(a,b)).toBeNull();}
    }finally{spy.mockRestore();}
});
it('presents transformed prompts and rejects invalid combination counts',()=>{
    expect(typingLine(5,0)).toEqual({cue:'one two three four',target:'four three two one'});
    expect(typingLine(7,0).target).toBe('QUIET AND STEADY');
    expect(typingLine(1,3).target).toContain('004.');
    expect(()=>schedule(1,31)).toThrow();
});
