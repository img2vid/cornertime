import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Simulate} from 'react-dom/test-utils';
import TypingSession from './TypingSession';

jest.mock('./SessionMonitor',()=>()=>null);

it('advances a Classic stage, pauses across reload, and finishes continuous typing with advancing keystrokes',()=>{
    jest.useFakeTimers();
    localStorage.clear();
    const key='ct.combo-session-v1';
    const saved={level:1,legs:[{group:1,task:-1,seconds:11},{group:1,task:0,seconds:1},{group:1,task:1,seconds:1}],
        index:0,line:0,draft:'',furthest:0,activeMs:0,classic:null};
    localStorage.setItem(key,JSON.stringify(saved));
    const host=document.body.appendChild(document.createElement('div'));
    const render=()=>ReactDOM.render(<TypingSession chain={true}/>,host);
    const click=(name:string)=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent===name)!.click();
    const input=(value:string)=>{const f=host.querySelector('input')!;f.value=value;Simulate.change(f);};
    let time=100;
    const now=jest.spyOn(performance,'now').mockImplementation(()=>time);
    try{
        render();click('Begin or resume');jest.advanceTimersByTime(5000);click('Pause');
        const checkpoint=JSON.parse(localStorage.getItem(key)!);expect(checkpoint.classic.currentTime).toBe(-5);
        ReactDOM.unmountComponentAtNode(host);render();click('Begin or resume');jest.advanceTimersByTime(6000);
        expect(host.textContent).toContain('Continuous lines');
        input('I will');expect(JSON.parse(localStorage.getItem(key)!).draft).toBe('');
        input('I');time+=6000;input('I ');expect(JSON.parse(localStorage.getItem(key)!).activeMs).toBe(0);
        for(const target of ['I will complete this line with care.','001. Entry received.']){
            let text=JSON.parse(localStorage.getItem(key)!).draft;
            while(text.length<target.length){time+=150;text=target.slice(0,text.length+1);input(text);}
        }
        expect(host.textContent).toContain('Session complete');
        expect(JSON.parse(localStorage.getItem(key)!).index).toBe(3);
    }finally{ReactDOM.unmountComponentAtNode(host);host.remove();now.mockRestore();jest.useRealTimers();}
});
