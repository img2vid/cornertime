import StudioHeader from './StudioHeader';
import * as React from 'react';
import { Assignment, canEnter, fresh, promptFor, quota, schoolTasks, updateRound, Work } from '../school';
import { readLocal, saveLocal } from '../storage';
import { durationLabel, formatDuration } from '../time';

const groups = ['All', ...Array.from(new Set(schoolTasks.map(t => t.group)))];
const storageKey = 'school-device-duties-v1';

export default class SchoolAssignments extends React.Component {
    state = { selected: null as Assignment | null, work:fresh(), running:false, feedback:'',
        group:'All', search:'', records:readLocal<{[id:string]:Work}>(storageKey,{}) };
    private archived = readLocal<{[id:string]:{answers:string[];draft:string}}>('school-work',{});
    private heading = React.createRef<HTMLHeadingElement>();
    private input = React.createRef<HTMLInputElement>();
    private tick = 0;
    componentDidMount() { document.addEventListener('visibilitychange',this.visibility); }
    componentWillUnmount() { window.clearInterval(this.tick); document.removeEventListener('visibilitychange',this.visibility); }
    private visibility = () => { if (document.hidden) { this.pause(); } }
    private pause = () => { window.clearInterval(this.tick); this.setState({running:false}); }
    private open = (selected:Assignment) => {
        this.pause();
        const records = readLocal(storageKey,this.state.records);
        this.setState({selected,records,work:records[selected.id] || fresh(),feedback:''},this.focusHeading);
    }
    private focusHeading = () => { if (this.heading.current) { this.heading.current.focus(); } }
    private save(work:Work) {
        const t = this.state.selected;
        if (!t) { return; }
        const next = updateRound(t,work);
        const records = {...readLocal(storageKey,this.state.records),[t.id]:next};
        saveLocal(storageKey,records);
        this.setState({work:next,records});
        if (next.rounds === t.minutes) { this.pause(); }
    }
    private start = () => {
        window.clearInterval(this.tick);
        this.setState({running:true,feedback:''},this.focusInput);
        this.tick = window.setInterval(()=>{
            if (document.hidden) { this.pause(); return; }
            const w = this.state.work;
            if (w.elapsed < 60) { this.save({...w,elapsed:w.elapsed+1}); }
        },1000);
    }
    private focusInput = () => { if (this.input.current) { this.input.current.focus(); } }
    private submit(value:string) {
        const {selected:t,work:w,running} = this.state;
        if (!t || !running || !canEnter(t,w)) { return; }
        if (value !== promptFor(t,w)) { this.setState({feedback:'Try again. Match the displayed prompt exactly.'},this.focusInput); return; }
        this.save({...w,entered:w.entered+1,draft:''});
        this.setState({feedback:''},this.focusInput);
    }
    render() {
        const {selected:t,work:w,records,group,search,running,feedback} = this.state;
        const matching = schoolTasks.filter(item=>(group === 'All' || item.group === group) && item.name.toLowerCase().includes(search.trim().toLowerCase()));
        const allowed = !!t && running && canEnter(t,w);
        return <main className="studio school"><StudioHeader section="School penalties"/>
            {t ? <><div className="studio-title"><h1 ref={this.heading} tabIndex={-1}>{t.name}</h1>
                <button onClick={()=>{this.pause();this.setState({selected:null,feedback:''},this.focusHeading);}}>All school penalties</button></div>
                <section className="feature"><small>{t.group.toUpperCase()} · {durationLabel(t.minutes*60)} minimum</small>
                {w.rounds === t.minutes ? <><h2>Assignment complete</h2><p>All {t.minutes} timed rounds are served.</p>
                    <button onClick={()=>this.save(fresh())}>Do this assignment again</button></> :
                <><h2>Round {w.rounds+1} of {t.minutes}</h2><p>{t.instructions}</p>
                    <div className="numbers"><span><b>{formatDuration((t.minutes-w.rounds)*60-w.elapsed)}</b>Duty time remaining</span>
                    <span><b>{60-w.elapsed}s</b>Round time remaining</span><span><b>{w.entered} / {quota(t)}</b>Entries this round</span></div>
                    <button onClick={running ? this.pause : this.start}>{running ? 'Pause' : w.rounds || w.elapsed || w.entered ? 'Resume duty' : 'Begin duty'}</button>
                    {w.entered === quota(t) ? <p className="my-3">Entries accepted. The next round opens when this minute ends.</p> :
                    <><p className="my-3" id="school-prompt"><strong>{t.style === 'sequence' ? 'Tap' : 'Copy'} · {promptFor(t,w)}</strong></p>
                    {t.style === 'sequence' ? <><p>Order: {t.prompts.join(' → ')}</p>
                        {Array.from(new Set(t.prompts)).map(word=><button key={word} className={word === promptFor(t,w) ? 'action' : undefined} disabled={!allowed}
                            onClick={()=>this.submit(word)}>{word}</button>)}</> :
                        <form onSubmit={e=>{e.preventDefault();this.submit(w.draft);}}>
                            <label htmlFor="school-answer">Your entry</label><input id="school-answer" ref={this.input}
                                aria-describedby="school-prompt" disabled={!allowed} autoCapitalize="off" autoComplete="off" spellCheck={false}
                                value={w.draft} onChange={e=>{this.save({...w,draft:e.target.value});this.setState({feedback:''});}}/>
                            <button className="action" disabled={!allowed}>Submit entry</button></form>}
                    {t.style === 'check' && w.elapsed < 50 && <p>Entry opens in {50-w.elapsed} seconds.</p>}</>}
                    {w.elapsed === 60 && <p>Minute served. Complete the remaining entries to move on.</p>}<p role="status">{feedback}</p></>}
                </section><p className="my-3">Progress saves on this device. Leaving the duty or hiding the tab pauses the timer.</p></> :
                <><div className="studio-title"><h1 ref={this.heading} tabIndex={-1}>School penalties</h1>
                    <input type="search" aria-label="Search assignments" placeholder="Search assignments" value={search} onChange={e=>this.setState({search:e.target.value})}/></div>
                <p>Choose one of 36 on-screen duties, from 30 minutes to 3 hours. Each round requires one minute and the displayed entries. You can pause and resume later.</p>
                <div className="filters">{groups.map(g=><button key={g} aria-pressed={group===g} onClick={()=>this.setState({group:g})}>{g}</button>)}</div>
                <div className="cards">{matching.map(item=>{
                    const saved = records[item.id];
                    return <button key={item.id} onClick={()=>this.open(item)}><span><strong>{item.name}</strong>
                        <small>{item.group} · {durationLabel(item.minutes*60)}{saved ? saved.rounds===item.minutes ? ' · Complete' : ' · Resume' : ''}</small></span></button>;
                })}</div>{!matching.length && <p>No matching assignments.</p>}
                {Object.keys(this.archived).length > 0 && <details className="stage-list"><summary>Archived work from earlier assignments</summary>
                    {Object.keys(this.archived).map(id=><section key={id}><h3>{id.replace(/-/g,' ')}</h3>
                        <ol>{this.archived[id].answers.map((text,i)=><li key={i}>{text}</li>)}</ol>
                        {this.archived[id].draft && <p>Draft: {this.archived[id].draft}</p>}</section>)}</details>}</>}
        </main>;
    }
}
