import * as React from 'react';
import * as ReactDOM from 'react-dom';
import ChallengeStudio from './ChallengeStudio';
import { Reading } from '../challenges';

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
