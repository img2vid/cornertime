import * as React from 'react';
import App from './App';
import {Appearance, respond} from '../assistant';
import {readLocal, saveLocal} from '../storage';

const modes=['System','Light','Dark'];
const palettes=['Forest','Ocean','Plum'];
const initial:Appearance={mode:'system',palette:'forest'};
function preference() {
    const saved=readLocal('appearance',initial);
    return {mode:modes.some(m=>m.toLowerCase()===saved.mode)?saved.mode:initial.mode,
        palette:palettes.some(p=>p.toLowerCase()===saved.palette)?saved.palette:initial.palette};
}
export default function Workspace(){
    const [appearance,setAppearance]=React.useState(preference);
    const [panel,setPanel]=React.useState('');
    const [input,setInput]=React.useState('');
    const [history,setHistory]=React.useState<Array<{from:string;text:string}>>([]);
    const [notice,setNotice]=React.useState('');
    const [listening,setListening]=React.useState(false);
    const [pack,setPack]=React.useState(false);
    const [speak,setSpeak]=React.useState(false);
    const [busy,setBusy]=React.useState(false);
    const recognition=React.useRef<any>(null);
    const voiceRun=React.useRef(0);
    const model=React.useRef<any>(null);
    const log=React.useRef<HTMLDivElement>(null);
    React.useEffect(()=>{
        document.documentElement.dataset.mode=appearance.mode;
        document.documentElement.dataset.palette=appearance.palette;
        saveLocal('appearance',appearance);
    },[appearance]);
    React.useEffect(()=>{if(log.current){log.current.scrollTop=log.current.scrollHeight;}},[history,panel]);
    React.useEffect(()=>()=>{voiceRun.current++;if(recognition.current){recognition.current.abort();}if(model.current){model.current.destroy();}},[]);
    function change(patch:Partial<Appearance>){setAppearance(prev=>({...prev,...patch}));}
    function stop(){
        voiceRun.current++;
        if(recognition.current){recognition.current.abort();recognition.current=null;}
        setListening(false);
    }
    function toggle(name:string){stop();setPanel(panel===name?'':name);setNotice('');}
    async function send(raw:string){
        const query=raw.trim();
        if(!query || busy){return;}
        stop();setInput('');setNotice('');setBusy(true);
        setHistory(h=>h.concat({from:'You',text:query}).slice(-40));
        let answer='';
        try{
            answer=respond(query,change)||'';
            if(!answer){
                const engine=(window as any).LanguageModel;
                const options={expectedInputs:[{type:'text',languages:['en']}],expectedOutputs:[{type:'text',languages:['en']}]};
                if(engine && await engine.availability(options)==='available'){
                    if(!model.current){model.current=await engine.create({...options,initialPrompts:[{role:'system',content:'Answer briefly in English. You can answer questions, but cannot perform actions or see the page.'}]});}
                    answer=await model.current.prompt(query);
                }else{answer='I can help with Corner Time. Try “list controls” or ask about a timer, preset, typing, or chain. Broader questions require an installed browser language model.';}
            }
        }catch{answer='I could not finish that request. Try “list controls” for actions on this screen.';}
        setHistory(h=>h.concat({from:'Assistant',text:answer}).slice(-40));setBusy(false);
        if(speak){
            const synth=window.speechSynthesis;
            const voices=synth?synth.getVoices().filter(v=>v.localService):[];
            const voice=voices.find(v=>/^en/i.test(v.lang)) || voices[0];
            if(voice){const utter=new SpeechSynthesisUtterance(answer);utter.voice=voice;synth.speak(utter);}
            else{setNotice('No installed speech voice is available. The reply is shown above.');}
        }
    }
    async function listen(){
        if(listening){stop();return;}
        const id=++voiceRun.current;
        const win=window as any;
        const Engine=win.SpeechRecognition || win.webkitSpeechRecognition;
        try{
            if(!Engine || !('processLocally' in Engine.prototype)){setNotice('This browser lacks on-device dictation. Type a command below.');return;}
            setListening(true);
            const opts={langs:['en-US'],processLocally:true};
            if(pack){
                setNotice('Installing the English speech pack…');
                if(!await Engine.install(opts)){throw Error('The browser could not install the English speech pack.');}
                if(id!==voiceRun.current){return;}
                setPack(false);
            }
            if(Engine.available){
                const state=await Engine.available(opts);
                if(id!==voiceRun.current){return;}
                if(state!=='available'){
                    setPack(state==='downloadable' && !!Engine.install);
                    setNotice(state==='downloadable'?'Install the English speech pack to use Listen.':state==='downloading'?'Speech pack is downloading. Try Listen again shortly.':'On-device English recognition is unavailable. Type your command below.');
                    setListening(false);return;
                }
            }
            const rec=new Engine();recognition.current=rec;rec.lang='en-US';rec.processLocally=true;
            rec.continuous=false;rec.interimResults=false;
            rec.onresult=(e:any)=>{if(id===voiceRun.current){send(e.results[0][0].transcript);}};
            rec.onerror=(e:any)=>{if(id===voiceRun.current){setNotice('Dictation stopped ('+e.error+'). You can type your command.');}};
            rec.onend=()=>{if(id===voiceRun.current){setListening(false);recognition.current=null;}};
            rec.start();setNotice('Listening for one command…');
        }catch(e){if(id===voiceRun.current){stop();setNotice(e.message || 'Dictation is unavailable. Type your command.');}}
    }
    return <>
        <div className="workspace-tools"><div className="tool-switches">
            <button aria-expanded={panel==='appearance'} onClick={()=>toggle('appearance')}>Appearance</button>
            <button aria-expanded={panel==='chat'} onClick={()=>toggle('chat')}>Local assistant</button>
        </div>
        {panel==='appearance' && <section aria-label="Appearance" className="preferences">
            <label>Mode <select value={appearance.mode} onChange={e=>change({mode:e.target.value})}>{modes.map(v=><option value={v.toLowerCase()} key={v}>{v}</option>)}</select></label>
            <label>Color theme <select value={appearance.palette} onChange={e=>change({palette:e.target.value})}>{palettes.map(v=><option value={v.toLowerCase()} key={v}>{v}</option>)}</select></label>
        </section>}
        {panel==='chat' && <section className="assistant-panel" aria-label="Local assistant">
            <h2>Local assistant</h2>
            <p>Ask about an activity or tell me what to do. Try “open chain challenge” or “list controls”.</p>
            <div className="chat-log" role="log" ref={log}>{history.map((message,i)=><p key={i}><strong>{message.from}</strong> {message.text}</p>)}</div>
            <form onSubmit={e=>{e.preventDefault();send(input);}}><label htmlFor="assistant-command">Message</label>
            <div className="chat-entry"><input id="assistant-command" value={input} maxLength={3000} onChange={e=>setInput(e.target.value)}/><button disabled={busy || !input.trim()}>Send</button></div></form>
            <div className="voice-tools"><button disabled={busy} onClick={listen}>{listening?'Stop listening':pack?'Install English speech pack':'Listen'}</button>
            <label><input type="checkbox" checked={speak} onChange={e=>{setSpeak(e.target.checked);if(window.speechSynthesis){window.speechSynthesis.getVoices();if(!e.target.checked){window.speechSynthesis.cancel();}}}}/> Speak replies</label></div>
            <div role="status">{busy?'Thinking…':notice}</div>
        </section>}</div>
        <App/>
        <footer className="site-footer"><span>Made with <span role="img" aria-label="love">❤️</span> by Aishik Dutta © 2026</span><a href="https://github.com/img2vid/cornertime">Source code ↗</a></footer>
    </>;
}
