import * as React from 'react';
import { Leg, presets, schedule, typingLine, typingTasks } from '../chain';
import { readLocal, saveLocal } from '../challenges';
import { defaultPreset, State } from '../models';
import Machine from '../state';
import { durationLabel, formatDuration } from '../time';
import SessionMonitor from './SessionMonitor';

interface Snapshot { state:State; currentTime:number; totalDuration:number; cooldownEndTime:number; violations:number; }
interface Progress {
    legs:Leg[]; level:number; index:number; line:number; draft:string; furthest:number; activeMs:number;
    classic:Snapshot|null;
}
function nextLeg(p:Progress):Progress {
    return {...p,index:p.index+1,line:0,draft:'',furthest:0,activeMs:0,classic:null};
}
function label(leg:Leg){return leg.task<0?'Classic corner time':typingTasks[leg.task].name;}
function snapshot(m:Machine):Snapshot {
    return {state:m.state,currentTime:m.currentTime,totalDuration:m.totalDuration,cooldownEndTime:m.cooldownEndTime,violations:m.violations};
}
export default class TypingSession extends React.Component<{chain:boolean}> {
    private get key(){return this.props.chain?'combo-session-v1':'continuous-session-v1';}
    state={level:1,count:'3',task:0,minutes:30,run:readLocal<Progress|null>(this.key,null),running:false,message:''};
    private machine:Machine|null=null;
    private timer=0;
    private lastKey:number|null=null;
    private field=React.createRef<HTMLInputElement>();
    componentDidMount(){document.addEventListener('visibilitychange',this.visibility);}
    componentWillUnmount(){this.stop();document.removeEventListener('visibilitychange',this.visibility);}
    private visibility=()=>{if(document.hidden && this.state.running){this.pause();}};
    private stop(){
        window.clearInterval(this.timer);
        this.lastKey=null;
        if(this.machine){this.machine.stopClock();this.machine=null;}
    }
    private pause=()=>{this.stop();this.setState({running:false,message:'Paused. Your place is saved.'});};
    private save(p:Progress){saveLocal(this.key,p);this.setState({run:p});}
    private prepare=()=>{
        const {level,count,task,minutes}=this.state;
        if(this.props.chain && (!Number.isInteger(Number(count)) || Number(count)<3 || Number(count)>30)){
            this.setState({message:'Enter a whole number from 3 to 30.'});return;
        }
        const legs=this.props.chain?schedule(level,Number(count)):[{group:1,task,seconds:minutes*60}];
        const p={legs,level,index:0,line:0,draft:'',furthest:0,activeMs:0,classic:null};
        this.stop();this.save(p);this.setState({running:false,message:'Ready. Review your assigned time, then begin.'});
    }
    private activate=(p:Progress)=>{
        this.stop();
        const leg=p.legs[p.index];
        if(!leg){this.setState({running:false,message:'Session complete.'});return;}
        if(leg.task<0){
            const machine=new Machine();
            const seconds=leg.seconds-10;
            machine.loadPreset({...defaultPreset,durationRange:{minimum:seconds,maximum:seconds}});
            if(p.classic){Object.assign(machine,p.classic);}
            else {machine.getReady(false);}
            this.machine=machine;
            this.save({...p,classic:snapshot(machine)});
            this.timer=window.setInterval(()=>{
                if(document.hidden){this.pause();return;}
                machine.tick();
                const current=this.state.run!;
                if(machine.state==='finished'){this.advance(current);}
                else {this.save({...current,classic:snapshot(machine)});}
            },1000);
        }else{
            this.timer=window.setInterval(()=>{
                if(document.hidden){this.pause();return;}
                if(this.lastKey!==null && performance.now()-this.lastKey>5000){
                    this.lastKey=null;this.setState({message:'Time held. Continue typing to resume credit.'});
                }
            },1000);
        }
        this.setState({running:true,message:leg.task<0?'Classic session in progress.':'Type the prompted text to earn time.'},()=>{
            if(this.field.current){this.field.current.focus();}
        });
    }
    private advance=(p:Progress)=>{
        const updated=nextLeg(p);this.save(updated);this.activate(updated);
    }
    private type=(value:string)=>{
        const p=this.state.run;
        if(!p || !this.state.running || document.hidden){return;}
        const leg=p.legs[p.index], target=typingLine(leg.task,p.line).target;
        if(value.length<=p.draft.length && target.startsWith(value)){
            this.lastKey=null;this.save({...p,draft:value});return;
        }
        if(value.length!==p.draft.length+1 || !value.startsWith(p.draft) || !target.startsWith(value)){
            this.lastKey=null;this.setState({message:'Match the next character, including spaces and capitals.'});return;
        }
        const now=performance.now();
        const gap=this.lastKey===null?0:now-this.lastKey;
        const activeMs=Math.min(leg.seconds*1000,p.activeMs+(value.length>p.furthest && gap<=5000?Math.max(0,gap):0));
        this.lastKey=now;
        const finished=value===target;
        if(finished && activeMs>=leg.seconds*1000){this.advance(p);return;}
        this.save({...p,activeMs,line:p.line+Number(finished),draft:finished?'':value,furthest:finished?0:Math.max(value.length,p.furthest)});
        this.setState({message:activeMs>=leg.seconds*1000?'Finish this line to complete the penalty.':'Typing time in progress.'});
    }
    private clear=()=>{this.stop();saveLocal(this.key,null);this.setState({run:null,running:false,message:''});};
    render(){
        const {chain}=this.props;
        const {run:p,level,count,task,minutes,running,message}=this.state;
        const leg=p && p.legs[p.index];
        const name=chain?'Chain challenge':'Continuous typing penalties';
        return <main className="studio"><header className="mast"><div className="wordmark">Corner Time</div><a href="#studio">Return to studio</a></header>
            <div className="studio-title"><h1>{name}</h1></div>
            {!p ? <section className="feature"><h2>{chain?'Plan a challenge':'Choose a typing duty'}</h2>
                {chain?<><p>Each combination starts with a randomly timed Classic session, followed by two or more different continuous typing duties. The plan is saved as soon as you generate it.</p>
                    <label>Difficulty preset <select value={level} onChange={e=>{
                        const choice=Number(e.target.value);this.setState({level:choice,count:String(presets[choice-1].groups)});
                    }}>{presets.map(s=><option key={s.level} value={s.level}>Preset {s.level} · {durationLabel(s.seconds)} · {s.groups} combinations</option>)}</select></label>
                    <label>Combinations (3–30) <input type="number" min="3" max="30" step="1" value={count} onChange={e=>this.setState({count:e.target.value})}/></label>
                    <p>Assigned time includes Classic preparation. Pauses, movement penalties, typing errors and idle time can extend the finish time.</p></>:
                <><p>Type continuously with no wait between lines. Only time between correct, advancing keystrokes up to five seconds apart counts. Finish the final line to complete each duty.</p>
                    <label>Typing duty <select value={task} onChange={e=>this.setState({task:Number(e.target.value)})}>{typingTasks.map((t,i)=><option key={t.name} value={i}>{t.name}</option>)}</select></label>
                    <p>{typingTasks[task].tip}</p><label>Assigned time <select value={minutes} onChange={e=>this.setState({minutes:Number(e.target.value)})}>
                        {[30,45,60,90,120,180].map(m=><option key={m} value={m}>{durationLabel(m*60)}</option>)}</select></label></>}
                <button className="action" onClick={this.prepare}>{chain?'Generate chain':'Prepare typing duty'}</button></section>:
            !leg ? <section className="feature"><h2>Session complete</h2><p>Completed {p.legs.length} {p.legs.length===1?'stage':'stages'}.</p><button onClick={this.clear}>Choose a new session</button></section>:
            <><section className="feature"><small>{chain?'PRESET '+p.level+' · COMBINATION '+leg.group+' OF '+p.legs[p.legs.length-1].group:'CONTINUOUS TYPING'}</small>
                <h2>{label(leg)}</h2><p>Stage {p.index+1} of {p.legs.length} · Assigned {durationLabel(leg.seconds)}</p>
                <div className="digits">{formatDuration(leg.task<0 ? p.classic ? p.classic.totalDuration-p.classic.currentTime : leg.seconds : Math.ceil(leg.seconds-p.activeMs/1000))}</div>
                {leg.task<0?<p>{p.classic && p.classic.state==='preparation'?'Preparation':'Classic corner time'} · Movement incidents: {p.classic?p.classic.violations:0}</p>:
                <><p>{typingTasks[leg.task].tip} Time holds after five seconds idle. Finish the last line when the timer reaches zero.</p>
                    <p className="typing-cue"><strong>{typingLine(leg.task,p.line).cue}</strong></p>
                    <label htmlFor="continuous-entry">Line {p.line+1}</label><input ref={this.field} id="continuous-entry" className="continuous-entry"
                        disabled={!running} value={p.draft} onChange={e=>this.type(e.target.value)} autoComplete="off" autoCapitalize="off" spellCheck={false}
                        onPaste={e=>e.preventDefault()} onDrop={e=>e.preventDefault()}/></>}
                <div className="launch"><button className="action" onClick={running?this.pause:()=>this.activate(p)}>{running?'Pause':'Begin or resume'}</button>
                {!running && <button onClick={()=>{if(window.confirm('End this session and clear its saved progress?')){this.clear();}}}>End session</button>}</div></section>
                {running && leg.task<0 && <SessionMonitor key={p.index} preparing={!!p.classic && p.classic.state==='preparation'}
                    onMotion={v=>{if(this.machine){this.machine.handleMotionUpdate(v);}}}/>}
                {chain && <details className="stage-list"><summary>Assigned plan · {durationLabel(p.legs.reduce((sum,l)=>sum+l.seconds,0))}</summary>
                    <ol>{p.legs.map((l,i)=><li key={i}>{i<p.index?'Completed · ':''}Combination {l.group} · {label(l)} · {durationLabel(l.seconds)}</li>)}</ol></details>}</>}
            <p className="my-3" role="status">{message}</p></main>;
    }
}
