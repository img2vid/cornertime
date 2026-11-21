// Small nearest-neighbour retriever. Terms shared by many candidates carry less weight.
function words(text:string) {
    return Array.from(new Set(text.toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/)
        .filter(w=>w && !/^(the|a|an|my|please|can|you|me|to|of|is|how|what|does|do|i|it|for|on|work|works)$/.test(w))));
}
interface Choice<T> { name:string; value:T; }
function match<T>(query:string, choices:Array<Choice<T>>) {
    const terms=words(query);
    const rows=choices.map(c=>({...c,terms:words(c.name)}));
    const weight=(term:string)=>1+Math.log((1+rows.length)/(1+rows.filter(r=>r.terms.includes(term)).length));
    const norm=(ts:string[])=>Math.sqrt(ts.reduce((sum,t)=>sum+weight(t)*weight(t),0));
    const exact=rows.filter(r=>r.name.toLowerCase()===query.toLowerCase());
    if(exact.length===1){return exact[0].value;}
    const ranked=rows.map(r=>({value:r.value,score:terms.filter(t=>r.terms.includes(t)).reduce((sum,t)=>sum+weight(t)*weight(t),0)/(norm(terms)*norm(r.terms)||1)})).sort((a,b)=>b.score-a.score);
    if(ranked.length && ranked[0].score>=0.48 && (!ranked[1] || ranked[0].score-ranked[1].score>.08)){return ranked[0].value;}
    return undefined;
}
const topics=[
    ['chain challenge combinations presets plan stages','Choose a difficulty and 3–30 combinations, then Generate chain to preview the order. Each combination starts with Classic corner time and continues with typing. Preset 1 assigns one hour.'],
    ['continuous typing idle keystrokes credit','Only correct advancing keystrokes within five seconds of the previous one earn time. Finish the current line when time runs out.'],
    ['school penalties entries rounds assignments','Choose an assignment and begin the duty. Each round requires a minute and its displayed entries. Pause to save your place.'],
    ['classic timer duration minutes random fixed','In Classic corner time, choose Fixed duration or Random duration, enter the minutes, then select Start Classic session.'],
    ['design import preset custom phrases','Design preset lets you customize timing and spoken phrases. Import preset accepts a saved preset code.'],
    ['view report results','View report reads a saved Classic session report. Paste the entire report code into its field.'],
    ['voice listen microphone privacy speech local','Listen takes one spoken command using English on-device recognition. A compatible browser and its English speech pack are required. Spoken replies use an installed local voice.'],
    ['theme appearance dark light colors','Use Appearance to choose System, Light or Dark and a color palette. Choices are saved in this browser.'],
    ['help commands controls assistant','Try “open chain challenge”, “set combinations to 4”, “generate chain”, “what can I do here?” or “how does continuous typing work?”']
];
const routes=[
    ['chain challenge','chain'],['continuous typing','continuous'],['school penalties','school'],
    ['design preset','custom'],['import preset','preset'],['view report','report'],['home all activities','home'],['classic timer','classic']
];
function visible(el:HTMLElement) {
    return !el.closest('[hidden]') && (!el.closest('details:not([open])') || el.tagName==='SUMMARY') && el.getClientRects().length>0;
}
function label(el:HTMLElement) {
    const field=el as HTMLInputElement;
    const parent=field.labels && field.labels[0];
    if(parent){const copy=parent.cloneNode(true) as HTMLElement;Array.from(copy.querySelectorAll('select,input,textarea')).forEach(e=>e.remove());return (copy.textContent||'').trim();}
    return (el.getAttribute('aria-label') || (el.querySelector('strong')||el).textContent || '').trim();
}
export interface Appearance { mode:string; palette:string; }
export function respond(input:string, appearance:(patch:Partial<Appearance>)=>void):string|undefined {
    const main=document.querySelector('main');
    if(!main){return 'The activity screen is loading.';}
    const controls=Array.from(main.querySelectorAll<HTMLElement>('button:not(:disabled), summary, a[href^="#"], input:not(:disabled),select:not(:disabled),textarea:not(:disabled)')).filter(visible);
    const buttons=controls.filter(el=>el.matches('button,summary,a'));
    const choices=buttons.map(el=>({name:label(el),value:el}));
    const text=input.trim().replace(/[.?!]+$/,'').replace(/^(?:(?:please|could you|can you|would you|take me to|i want to)\s+)+/i,m=>/take me to/i.test(m)?'open ':'');
    const question=/^(what|when|why|how|where|who|which|explain|tell me|describe|help|can i|is |are |do |does )/i.test(text) || (input.trim().endsWith('?') && !/^(open|set|switch|pause|resume|generate|show)\b/i.test(text));
    if(/^(what can i do here|list controls|show controls|available actions)/i.test(text)){
        return 'On this screen: '+controls.map(label).filter(Boolean).join(', ')+'.';
    }
    if(/^(status|where am i|how much time|time left|read screen|what.*remaining)/i.test(text)){
        return Array.from(main.querySelectorAll('h1,.feature h2,.digits,.numbers span,[role=status]')).map(e=>e.textContent).filter(Boolean).join(' · ');
    }
    if(question){return match(text,topics.map(([name,value])=>({name,value})));}
    if(/^(do not|don.t|never|avoid|cancel)\b/i.test(text)){return 'No action taken.';}
    const theme=text.match(/^(?:(?:switch|change|set|use|enable|turn on)\s+(?:(?:the |my )?(?:theme|mode|palette|appearance)\s+)?(?:to\s+)?)?(dark|light|system|forest|ocean|plum)(?:\s+(?:mode|theme|palette))?$/i);
    if(theme){const value=theme[1].toLowerCase();appearance(/^(dark|light|system)$/.test(value)?{mode:value}:{palette:value});return 'Appearance set to '+value+'.';}
    const timer=text.match(/^(?:start|begin|run) (?:a |an )?(\d+)[ -]minutes? (?:classic |corner time )?(?:timer|session)$/i);
    if(timer){
        const form=main.querySelector('.classic-duration');
        if(!form){return 'Open Classic timer first, then repeat your request.';}
        if(Number(timer[1])<1 || !Number.isSafeInteger(Number(timer[1]))){return 'Enter a positive whole number of minutes.';}
        form.dispatchEvent(new CustomEvent('classic-timer',{detail:timer[1]}));
        return 'Starting a '+timer[1]+'-minute Classic session.';

    }
    const update=text.match(/^set (.+?) to (.+)$/i);
    if(update){
        const fields=controls.filter(el=>el.matches('input,textarea,select'));
        const el=match(update[1],fields.map(f=>({name:label(f),value:f}))) as HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement|undefined;
        if(!el){return 'Which field? Available fields: '+fields.map(label).join(', ');}
        let value=update[2];
        if(el instanceof HTMLSelectElement){
            const option=Array.from(el.options).find(o=>o.value===value) || match(value,Array.from(el.options).map(o=>({name:o.text,value:o})));
            if(!option){return 'Choose one of: '+Array.from(el.options).map(o=>o.text).join(', ');}
            value=option.value;
        }
        if(el instanceof HTMLInputElement && el.type==='number'){
            const probe=el.cloneNode() as HTMLInputElement;probe.value=value;
            if(!probe.value || !probe.checkValidity()){return 'That value is outside the allowed range for '+label(el)+'.';}
        }
        const setter=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value');
        if(!setter || !setter.set){return 'This field cannot be changed here.';}
        setter.set.call(el,value);el.dispatchEvent(new Event(el instanceof HTMLSelectElement?'change':'input',{bubbles:true}));
        return 'Updated '+label(el)+'.';
    }
    const nav=text.match(/^(?:open|go to|navigate to|visit|show) (.+)$/i);
    if(nav){
        const route=match(nav[1],routes.map(([name,value])=>({name,value})));
        if(route){
            if(main.classList.contains('classic-live')){return 'Classic is running. Navigation is available after the session.';}
            if(main.querySelector('a[href="./"]')){window.location.assign('./#'+route);}
            else {window.location.hash=route;}
            return 'Opening '+routes.find(r=>r[1]===route)![0]+'.';
        }
    }
    const target=text.replace(/^(?:click|press|select|choose|activate|open)\s+/i,'');
    // Free-form questions and unrelated text must never activate a partial button match.
    const action=choices.find(c=>c.name.toLowerCase()===target.toLowerCase());
    const el=action ? action.value : /^(?:click|press|select|choose|activate|open|start|begin|resume|pause|generate|prepare)\b/i.test(text) ? match(target,choices) : undefined;
    if(el){
        const name=label(el);
        if(el.tagName==='SUMMARY'){
            const details=el.parentElement as HTMLDetailsElement;
            details.open=/^open /i.test(text) || !details.open;
        }else{el.click();}
        return 'Selected '+name+'.';
    }
    return match(text,topics.map(([name,value])=>({name,value})));
}
