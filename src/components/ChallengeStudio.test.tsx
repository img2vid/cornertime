import * as React from 'react';
import * as ReactDOM from 'react-dom';
import ChallengeStudio from './ChallengeStudio';
import { Reading, courses, evaluate } from '../challenges';

let mockRead: (reading: Reading) => void;
jest.mock('./SessionMonitor', () => (props: any) => {
    mockRead = props.onReading;
    return null;
});

it('launches a course, waits for sensors, pauses, resumes and stores the completed result', () => {
    jest.useFakeTimers();
    localStorage.clear();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const click = (label: string) => {
        const button = Array.from(host.querySelectorAll('button')).find(b => b.textContent === label);
        expect(button).toBeDefined();
        button!.click();
    };
    const second = () => {
        for (let i = 0; i < 10; i++) { mockRead({ motion:0, shifted:false }); }
        jest.advanceTimersByTime(1000);
    };
    try {
        ReactDOM.render(<ChallengeStudio />, host);
        if (host.textContent!.includes('Practice challenges')) { click('Practice challenges'); }
        click('☆ Save'); click('Saved');
        expect(host.querySelectorAll('.cards button').length).toBe(1);
        click('Start challenge →');
        jest.advanceTimersByTime(3000);
        expect(host.querySelector('.digits')!.textContent).toBe('5s');
        for (let i = 0; i < 5; i++) { second(); }
        click('Pause'); second(); click('Resume');
        expect(host.querySelector('.digits')!.textContent).toBe('0 / 10s');
        for (let i = 0; i < 10; i++) { second(); }
        expect(host.textContent).toContain('SESSION COMPLETE');
        click('Back to studio');
        expect(host.textContent).toContain('Personal best 0:10');
        expect(host.textContent).toContain('Recent sessions (1)');
    } finally {
        ReactDOM.unmountComponentAtNode(host);
        document.body.removeChild(host);
        jest.useRealTimers();
    }
});

it('finds all strict courses and resets a strict hold on outliers, gaps and pause', () => {
    jest.useFakeTimers();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const click = (label: string) => Array.from(host.querySelectorAll('button')).find(b => b.textContent === label)!.click();
    const tick = (count: number, last = 0) => {
        for (let i = 0; i < count; i++) { mockRead({motion:i === count - 1 ? last : 0}); }
        jest.advanceTimersByTime(1000);
    };
    try {
        ReactDOM.render(<ChallengeStudio />, host);
        if (host.textContent!.includes('Practice challenges')) { click('Practice challenges'); }
        click('Strict');
        expect(host.querySelectorAll('.cards button')).toHaveLength(20);
        host.querySelector<HTMLButtonElement>('.cards button')!.click();
        click('Start challenge →');
        for (let i = 0; i < 6; i++) { tick(10); }
        const progress = () => host.querySelector('.digits')!.textContent;
        expect(progress()).toBe('1 / 15s');
        tick(10,.05);
        expect(progress()).toBe('0 / 15s');
        tick(10); tick(7);
        expect(progress()).toBe('0 / 15s');
        tick(10); click('Pause'); click('Resume');
        expect(progress()).toBe('0 / 15s');
        for (let i = 0; i < 15; i++) { tick(10); }
        expect(host.textContent).toContain('SESSION COMPLETE');
    } finally {
        ReactDOM.unmountComponentAtNode(host);
        document.body.removeChild(host);
        jest.useRealTimers();
    }
});

it('announces a loss and retries the same course and difficulty from a clean attempt', () => {
    jest.useFakeTimers();
    localStorage.clear();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const spoken: string[] = [];
    const voice = { speak: (u: SpeechSynthesisUtterance) => spoken.push(u.text), cancel: jest.fn() };
    const w = window as any;
    const previous = [w.speechSynthesis, w.SpeechSynthesisUtterance];
    w.speechSynthesis = voice;
    w.SpeechSynthesisUtterance = class { constructor(public text: string) {} };
    const click = (label: string) => Array.from(host.querySelectorAll('button')).find(b => b.textContent === label)!.click();
    const second = (motion: number) => {
        for (let i = 0; i < 10; i++) { mockRead({motion}); }
        jest.advanceTimersByTime(1000);
    };
    try {
        ReactDOM.render(<ChallengeStudio />, host);
        if (host.textContent!.includes('Practice challenges')) { click('Practice challenges'); }
        const level = host.querySelector('select')!;
        level.value = '1';
        level.dispatchEvent(new Event('change', {bubbles:true}));
        click('Start challenge →');
        for (let i = 0; i < 5; i++) { second(0); }
        second(1); second(1); second(0);
        expect(spoken).toContain('Back on target.');
        second(1); second(1); second(1);
        expect(host.textContent).toContain('ATTEMPT LOST');
        expect(spoken.join(' ')).toContain('Attempt lost.');
        expect(localStorage.getItem('ct.history')).toBeNull();
        click('Try again');
        for (let i = 0; i < 5; i++) { second(0); }
        expect(host.querySelector('.digits')!.textContent).toBe('0 / 15s');
        for (let i = 0; i < 15; i++) { second(0); }
        expect(host.textContent).toContain('SESSION COMPLETE');
        expect(spoken.join(' ')).toContain('Challenge complete.');
        expect(JSON.parse(localStorage.getItem('ct.history')!)).toHaveLength(1);
    } finally {
        ReactDOM.unmountComponentAtNode(host);
        document.body.removeChild(host);
        [w.speechSynthesis, w.SpeechSynthesisUtterance] = previous;
        jest.useRealTimers();
    }
});

it.each(courses.map(c => c.id))('can lose and retry %s without navigating', id => {
    const course = courses.find(c => c.id === id)!;
    const rule = course.stages[0].rule;
    const candidates = [
        {motion:1, shifted:true, tiles:100, noise:0},
        {motion:0, shifted:false, tiles:0, noise:-60}
    ];
    const miss = candidates.find(r => evaluate(rule, r) === false)!;
    expect(miss).toBeDefined();
    jest.useFakeTimers();
    const host = document.createElement('div');
    document.body.appendChild(host);
    window.location.hash = 'challenge=' + id;
    const click = (label: string) => Array.from(host.querySelectorAll('button')).find(b => b.textContent === label)!.click();
    try {
        ReactDOM.render(<ChallengeStudio />, host);
        if (host.textContent!.includes('Practice challenges')) { click('Practice challenges'); }
        click('Start challenge →');
        for (let second = 0; second < 8; second++) {
            for (let i = 0; i < 10; i++) { mockRead(miss); }
            jest.advanceTimersByTime(1000);
        }
        expect(host.textContent).toContain('ATTEMPT LOST');
        click('Try again');
        expect(host.querySelector('h1')!.textContent).toBe(course.name);
        expect(host.querySelector('.digits')!.textContent).toBe('5s');
    } finally {
        ReactDOM.unmountComponentAtNode(host);
        document.body.removeChild(host);
        window.location.hash = '';
        jest.useRealTimers();
    }
});

it('serves a traditional duty with a warning and five seconds of added time', () => {
    jest.useFakeTimers();
    const host = document.body.appendChild(document.createElement('div'));
    try {
        ReactDOM.render(<ChallengeStudio />, host);
        Array.from(host.querySelectorAll('button')).find(b => b.textContent === 'Begin duty')!.click();
        const tick = (motion: number) => {
            for (let n=0;n<10;n++) { mockRead({motion}); }
            jest.advanceTimersByTime(1000);
        };
        for(let n=0;n<5;n++) { tick(0); }
        tick(1); tick(1);
        expect(host.textContent).toContain('Warning issued');
        tick(0); tick(0); tick(1); tick(1);
        expect(host.textContent).toContain('Five seconds added');
        expect(host.querySelector('.digits')!.textContent).toBe('30:03');
        for(let n=0;n<1803;n++) { tick(0); }
        expect(host.textContent).toContain('SESSION COMPLETE');
        expect(host.textContent).toContain('5sTime added');
    } finally {
        ReactDOM.unmountComponentAtNode(host);
        host.remove();
        jest.useRealTimers();
    }
});
