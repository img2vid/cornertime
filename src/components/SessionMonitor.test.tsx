import * as React from 'react';
import * as ReactDOM from 'react-dom';
import SessionMonitor from './SessionMonitor';

it('requests only video and exposes no microphone or noise controls', () => {
    const host = document.createElement('div');
    const original = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices');
    const getUserMedia = jest.fn(() => new Promise<MediaStream>(() => {}));
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } });
    try {
        ReactDOM.render(<SessionMonitor preparing={true} onMotion={() => {}}/>, host);
        expect(getUserMedia.mock.calls).toHaveLength(1);
        expect(getUserMedia).toHaveBeenCalledWith({ video: true, audio: false });
        expect(host.textContent).not.toMatch(/microphone|noise level/i);
    } finally {
        ReactDOM.unmountComponentAtNode(host);
        if (original) { Object.defineProperty(navigator, 'mediaDevices', original); }
        else { Reflect.deleteProperty(navigator, 'mediaDevices'); }
    }
});
