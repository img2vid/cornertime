import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Simulate } from 'react-dom/test-utils';
import SchoolAssignments from './SchoolAssignments';
import { canEnter, fresh, promptFor, quota, schoolTasks, updateRound } from '../school';

it.each(schoolTasks.map(t=>t.id))('requires time and device work for every round of %s', id => {
    const t = schoolTasks.find(item=>item.id===id)!;
    expect(t.minutes).toBeGreaterThanOrEqual(30);
    expect(t.minutes).toBeLessThanOrEqual(180);
    let w = fresh();
    for(let i=0;i<t.minutes;i++) {
        expect(updateRound(t,{...w,entered:quota(t),elapsed:59}).rounds).toBe(i);
        w.elapsed=60;
        expect(updateRound(t,w).rounds).toBe(i);
        for(let entry=0;entry<quota(t);entry++){
            expect(canEnter(t,w)).toBe(true);
            expect(promptFor(t,w).length).toBeGreaterThan(0);
            w.entered++;
        }
        w=updateRound(t,w);
    }
    expect(w.rounds).toBe(t.minutes);
    expect(canEnter(t,w)).toBe(false);
});

it('opens check-ins at 50 seconds and numbers ledger entries across rounds',()=>{
    expect(new Set(schoolTasks.map(t=>t.id)).size).toBe(36);
    const check=schoolTasks.find(t=>t.style==='check')!;
    expect(canEnter(check,{...fresh(),elapsed:49})).toBe(false);
    expect(canEnter(check,{...fresh(),elapsed:50})).toBe(true);
    const ledger=schoolTasks.find(t=>t.style==='register')!;
    expect(promptFor(ledger,{...fresh(),rounds:1,entered:1})).toContain('004.');
});

it('rejects wrong lines, waits for the minute, resumes a draft and allows repeating a finished duty',()=>{
    jest.useFakeTimers();
    localStorage.clear();
    const host=document.body.appendChild(document.createElement('div'));
    const render=()=>ReactDOM.render(<SchoolAssignments />,host);
    const button=(label:string)=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent===label)!;
    const open=()=>host.querySelector<HTMLButtonElement>('.cards button')!.click();
    const field=()=>host.querySelector<HTMLInputElement>('#school-answer')!;
    const type=(value:string)=>{field().value=value;Simulate.change(field());};
    try {
        render();open();button('Begin duty').click();
        type('incorrect');Simulate.submit(host.querySelector('form')!);
        expect(host.textContent).toContain('Try again.');
        for(let i=0;i<3;i++){type(schoolTasks[0].prompts[0]);Simulate.submit(host.querySelector('form')!);}
        jest.advanceTimersByTime(59000);
        expect(host.textContent).toContain('Round 1 of 30');
        button('Pause').click();jest.advanceTimersByTime(60000);
        expect(host.textContent).toContain('Round 1 of 30');
        button('Resume duty').click();jest.advanceTimersByTime(1000);
        expect(host.textContent).toContain('Round 2 of 30');
        type('I will');ReactDOM.unmountComponentAtNode(host);render();open();
        expect(field().value).toBe('I will');expect(field().disabled).toBe(true);
        ReactDOM.unmountComponentAtNode(host);
        localStorage.setItem('ct.school-device-duties-v1',JSON.stringify({[schoolTasks[0].id]:{...fresh(),rounds:29,elapsed:59,entered:3}}));
        render();open();button('Resume duty').click();jest.advanceTimersByTime(1000);
        expect(host.textContent).toContain('Assignment complete');
        button('Do this assignment again').click();expect(host.textContent).toContain('Round 1 of 30');
    } finally {ReactDOM.unmountComponentAtNode(host);host.remove();jest.useRealTimers();}
});
