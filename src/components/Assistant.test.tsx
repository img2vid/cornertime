import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {act} from 'react-dom/test-utils';
import Workspace from './Workspace';
import {respond} from '../assistant';

it('operates the mounted chain form and retrieves help without triggering a session',()=>{
    const host=document.createElement('div');
    document.body.appendChild(host);
    const layout=jest.spyOn(HTMLElement.prototype,'getClientRects').mockReturnValue([{}] as any);
    const scroll=jest.spyOn(window,'scrollTo').mockImplementation(()=>{});
    const change=jest.fn();
    const ask=(text:string)=>respond(text,change);
    try{
        window.history.replaceState(null,'','#chain');
        act(()=>{ReactDOM.render(<Workspace/>,host);});
        expect(ask('list controls')).toContain('Generate chain');
        expect(ask('How does continuous typing work?')).toBeUndefined();
        expect(ask('switch to dark mode')).toBeTruthy();
        expect(change).toHaveBeenCalledWith({mode:'dark'});
        expect(ask('set combinations to 4')).toMatch(/updated/i);
        expect((host.querySelector('input[type=number]') as HTMLInputElement).value).toBe('4');
        expect(ask('set combinations to 99')).toMatch(/range/);
        expect(ask("don't generate chain")).toBe('No action taken.');
        expect(ask('generate chain')).toMatch(/selected/i);
        expect(host.querySelector('details')).toBeTruthy();
        expect(ask('open assigned plan')).toMatch(/selected/i);
        expect(host.querySelector('details')!.open).toBe(true);
        expect(host.querySelector('footer')!.textContent).toContain('Made with ❤️ by Aishik Dutta © 2026');
    }finally{
        ReactDOM.unmountComponentAtNode(host);host.remove();scroll.mockRestore();layout.mockRestore();
        window.history.replaceState(null,'','/');localStorage.clear();
    }
});
