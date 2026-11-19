import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Simulate } from 'react-dom/test-utils';
import SchoolAssignments from './SchoolAssignments';
import { schoolTasks } from '../school';

it.each(schoolTasks.map(t=>t.id))('completes school assignment %s, restores it and permits a fresh attempt', id => {
    jest.useFakeTimers();
    localStorage.clear();
    const task = schoolTasks.find(t=>t.id === id)!;
    const host = document.body.appendChild(document.createElement('div'));
    const click = (label:string) => {
        const button = Array.from(host.querySelectorAll('button')).find(b=>b.textContent === label)!;
        expect(button.disabled).toBe(false);
        button.click();
    };
    const open = () => (Array.from(host.querySelectorAll('.cards button')).find(b=>b.querySelector('strong')!.textContent===task.name) as HTMLButtonElement).click();
    try {
        ReactDOM.render(<SchoolAssignments />,host);
        expect(host.querySelectorAll('.cards button')).toHaveLength(36);
        open();
        task.steps.forEach((step,i)=>{
            const next = i+1 === task.steps.length ? 'Finish assignment' : 'Complete step';
            if (step.kind === 'write' || step.kind === 'answer') {
                click(next);
                expect(host.querySelector('[role=status]')!.textContent).not.toBe('');
                const field = host.querySelector('textarea')!;
                field.value = step.kind === 'write' ? Array(step.words).fill('word').join(' ') : step.answers[0];
                Simulate.change(field);
            } else if (step.kind === 'confirm') {
                host.querySelector('input[type=checkbox]')!.dispatchEvent(new MouseEvent('click',{bubbles:true}));
            } else {
                click('Start timer');
                jest.advanceTimersByTime(1000);
                click('Pause timer');
                const time = host.querySelector('.digits')!.textContent;
                jest.advanceTimersByTime(2000);
                expect(host.querySelector('.digits')!.textContent).toBe(time);
                click('Resume timer');
                jest.advanceTimersByTime((step.seconds-1)*1000);
            }
            click(next);
        });
        expect(host.textContent).toContain('Assignment complete');
        ReactDOM.unmountComponentAtNode(host);
        ReactDOM.render(<SchoolAssignments />,host);
        open();
        expect(host.textContent).toContain('Assignment complete');
        click('Do this assignment again');
        expect(host.textContent).toContain('Step 1 of');
    } finally {
        ReactDOM.unmountComponentAtNode(host);
        host.remove();
        jest.useRealTimers();
    }
});
