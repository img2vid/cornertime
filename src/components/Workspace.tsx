import * as React from 'react';
import App from './App';
import {messages, suggestion, Turn} from '../chat';
import {Appearance, navigationSuggestion, respond} from '../assistant';
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
    const [history,setHistory]=React.useState<Turn[]>([]);
    const [notice,setNotice]=React.useState('');
    const [listening,setListening]=React.useState(false);
    const [pack,setPack]=React.useState(false);
    const [speak,setSpeak]=React.useState(false);
    const [busy,setBusy]=React.useState(false);
    const recognition=React.useRef<any>(null);
    const voiceRun=React.useRef(0);
    const worker=React.useRef<Worker|null>(null);
    const [draft,setDraft]=React.useState('');
    const [pending,setPending]=React.useState('');
    const [failed,setFailed]=React.useState('');
    const commandScreen=React.useRef('');
    const previousTurns=React.useRef<Turn[]>([]);
    const active=React.useRef(false);
    const log=React.useRef<HTMLDivElement>(null);
    React.useEffect(()=>{
        document.documentElement.dataset.mode=appearance.mode;
        document.documentElement.dataset.palette=appearance.palette;
        saveLocal('appearance',appearance);
    },[appearance]);
    React.useEffect(()=>{if(log.current){log.current.scrollTop=log.current.scrollHeight;}},[history,draft,panel]);
    React.useEffect(()=>()=>{voiceRun.current++;if(recognition.current){recognition.current.abort();}if(worker.current){worker.current.terminate();}},[]);
    function change(patch:Partial<Appearance>){setAppearance(prev=>({...prev,...patch}));}
    function stop(){
        voiceRun.current++;
        if(recognition.current){recognition.current.abort();recognition.current=null;}
        setListening(false);
    }
    function toggle(name:string){stop();setPanel(panel===name?'':name);setNotice('');}
    function stopGeneration(){
        if(worker.current){worker.current.terminate();worker.current=null;}
        active.current=false;setBusy(false);setDraft('');setNotice('Generation stopped.');
    }
    function say(answer:string){
        if(!speak){return;}
        const synth=window.speechSynthesis;
        const voices=synth?synth.getVoices().filter(v=>v.localService):[];
        const voice=voices.find(v=>/^en/i.test(v.lang)) || voices[0];
        if(voice){const utter=new SpeechSynthesisUtterance(answer);utter.voice=voice;synth.speak(utter);}
        else{setNotice('No installed speech voice is available.');}
    }
    function send(raw:string,retry=false){
        const query=raw.trim();
        if(!query || active.current){return;}
        stop();setInput('');setNotice('');setPending('');setDraft('');setFailed('');
        const past=retry?previousTurns.current:history.filter((turn,i)=>turn.from!=='You' || (history[i+1] && history[i+1].from==='Assistant'));
        previousTurns.current=past;
        const transcript=past.concat({from:'You',text:query}).slice(-39);
        setHistory(transcript);
        // Explicit interface commands stay immediate, including before the model download.
        // Free-form messages and questions always go through the generative model.
        const direct=/^(?:open |go to |click |press |switch to |start (?:a |an )?\d|set .+ to |generate chain$|pause$|begin or resume$|list controls$|time left$|use (forest|ocean|plum)$)/i.test(query)
            && !/[?]/.test(query) ? respond(query,change) : undefined;
        function finish(answer:string){
            setHistory(transcript.concat({from:'Assistant',text:answer}));setDraft('');active.current=false;setBusy(false);setNotice('');say(answer);
        }
        if(direct){finish(direct);return;}
        const navigation=navigationSuggestion(query);
        if(navigation){
            commandScreen.current=window.location.hash;
            setPending(navigation);
            finish('Choose Apply action to '+navigation+'.');return;
        }
        active.current=true;setBusy(true);setNotice('Loading the local AI runtime…');
        const context=[respond('read screen',change),respond('list controls',change)].join(' · ');
        commandScreen.current=window.location.hash;
        function fail(reason:string){
            stopGeneration();setFailed(query);
            setNotice('Could not generate a reply. '+reason+' Check your connection for the first download and available device memory, then retry.');
        }
        try{
            if(!worker.current){worker.current=new Worker(process.env.PUBLIC_URL+'/chat-worker.js',{type:'module'});}
            worker.current.onmessage=({data})=>{
                if(data.type==='token'){setDraft(prior=>prior+data.text);}
                else if(data.type==='status'){setNotice(data.text);}
                else if(data.type==='error'){fail(data.text);}
                else if(data.type==='done'){setPending(suggestion(data.text));finish(data.text);}
            };
            worker.current.onerror=(e)=>fail(e.message || 'The browser could not load the model worker.');
            worker.current.postMessage({messages:messages(past,query,context)});
        }catch(error){fail(error.message || String(error));}
    }
    function applySuggestion(){
        const feedback=window.location.hash!==commandScreen.current?'The screen changed. Ask again on this screen.':respond(pending,change) || 'That action is unavailable on this screen.';
        setPending('');setNotice(feedback);
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
            <h2>Generative AI chat</h2>
            <p>Chat with SmolLM2 on your device. The first AI reply downloads about 365 MB of model weights plus the runtime. Try “Write a four-line poem about rain”, then “Make the last line funny”.</p>
            <div className="chat-log" role="log" ref={log}>{history.map((message,i)=><p key={i}><strong>{message.from}</strong> {message.text}</p>)}{draft && <p aria-live="off"><strong>Assistant</strong> {draft}</p>}</div>
            {pending && <button onClick={applySuggestion}>Apply action · {pending}</button>}
            <form onSubmit={e=>{e.preventDefault();send(input);}}><label htmlFor="assistant-command">Message</label>
            <div className="chat-entry"><input id="assistant-command" value={input} maxLength={3000} onChange={e=>setInput(e.target.value)}/><button disabled={busy || !input.trim()}>Send</button></div></form>
            <div className="voice-tools"><button disabled={busy} onClick={listen}>{listening?'Stop listening':pack?'Install English speech pack':'Listen'}</button>
            <label><input type="checkbox" checked={speak} onChange={e=>{setSpeak(e.target.checked);if(window.speechSynthesis){window.speechSynthesis.getVoices();if(!e.target.checked){window.speechSynthesis.cancel();}}}}/> Speak replies</label></div>
            {busy && <button onClick={stopGeneration}>Stop generation</button>}
            {failed && !busy && <button onClick={()=>send(failed,true)}>Retry message</button>}
            {!!history.length && !busy && <button onClick={()=>{setHistory([]);setPending('');setFailed('');setNotice('');previousTurns.current=[];}}>New conversation</button>}
            <div role="status">{notice}</div>
        </section>}</div>
        <App/>
        <footer className="site-footer"><span>Made with <span role="img" aria-label="love">❤️</span> by Aishik Dutta © 2026</span><a href="https://github.com/img2vid/cornertime">Source code ↗</a></footer>
    </>;
}
