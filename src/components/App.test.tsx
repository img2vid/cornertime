import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';

it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<App />, div);
});

it('opens the activity directory, preset tools, practice and existing challenge links', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const previousScroll = window.scrollTo;
    window.scrollTo = jest.fn();
    function visit(hash: string) {
        window.history.replaceState(null, '', hash);
        window.dispatchEvent(new Event('hashchange'));
        return host.querySelector('main h1')!.textContent;
    }
    try {
        ReactDOM.render(<App/>, host);
        expect(visit('#home')).toBe('Session studio');
        expect(host.querySelectorAll('.mode-grid a')).toHaveLength(5);
        expect(host.querySelector('.classic-duration')).toBeTruthy();
        expect(visit('#custom')).toBe('Design a Classic preset');
        expect(visit('#practice')).toBe('Practice challenges');
        expect(host.querySelector('#selected-challenge')!.textContent).toBe('Steady hand');
        expect(visit('#challenge=duty-steady')).toBe('Traditional duties');
        expect(host.querySelector('#selected-challenge')!.textContent).toBe('Short stillness hold');
        expect(visit('#continuous')).toBe('Continuous typing penalties');
        expect(visit('#chain')).toBe('Chain challenge');
        expect(visit('#school')).toBe('School penalties');
    } finally {
        ReactDOM.unmountComponentAtNode(host);
        document.body.removeChild(host);
        window.history.replaceState(null, '', '/');
        window.scrollTo = previousScroll;
    }
});
