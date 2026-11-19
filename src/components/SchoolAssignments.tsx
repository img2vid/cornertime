import * as React from 'react';
import { Assignment, accepts, schoolTasks } from '../school';
import { readLocal, saveLocal } from '../challenges';
import { formatDuration } from '../time';

interface Work { answers: string[]; draft: string; checked: boolean; elapsed: number; }
const fresh = (): Work => ({answers:[], draft:'', checked:false, elapsed:0});
const groups = ['All', ...Array.from(new Set(schoolTasks.map(t => t.group)))];

export default class SchoolAssignments extends React.Component {
    state = { selected: null as Assignment | null, work:fresh(), running:false, feedback:'',
        group:'All', search:'', records:readLocal<{[id:string]: Work}>('school-work',{}) };
    private heading = React.createRef<HTMLHeadingElement>();
    private focusHeading = () => { if (this.heading.current) { this.heading.current.focus(); } }
    private timer = 0;
    componentDidMount() { document.addEventListener('visibilitychange',this.visibility); }
    componentWillUnmount() { this.stop(); document.removeEventListener('visibilitychange',this.visibility); }
    private stop() { window.clearInterval(this.timer); }
    private visibility = () => { if (document.hidden && this.state.running) { this.pause(); } }
    private pause = () => { this.stop(); this.setState({running:false}); }
    private save(work: Work, feedback = '') {
        const selected = this.state.selected;
        if (!selected) { return; }
        const records = { ...this.state.records, [selected.id]:work };
        saveLocal('school-work',records);
        this.setState({work,records,feedback});
    }
    private open = (selected: Assignment) => {
        this.stop();
        this.setState({selected,work:this.state.records[selected.id] || fresh(),running:false,feedback:''},this.focusHeading);
    }
    private startTimer = (limit: number) => {
        this.stop();
        this.setState({running:true});
        this.timer = window.setInterval(() => {
            if (document.hidden) { this.pause(); return; }
            const elapsed = Math.min(limit,this.state.work.elapsed + 1);
            this.save({...this.state.work,elapsed});
            if (elapsed >= limit) { this.pause(); }
        },1000);
    }
    private advance = () => {
        const {selected,work} = this.state;
        if (!selected) { return; }
        const step = selected.steps[work.answers.length];
        if (!step) { return; }
        if (!accepts(step,work.draft,work.checked,work.elapsed)) {
            this.setState({feedback: step.kind === 'answer' ? 'Check your answer and try again. Match any capitals and punctuation.' :
                step.kind === 'write' ? 'Add more detail to reach the word minimum.' : 'Finish this step first.'});
            return;
        }
        this.stop();
        const response = step.kind === 'confirm' ? 'Confirmed by you' : step.kind === 'timer' ? formatDuration(work.elapsed) + ' served' : work.draft.trim();
        this.save({...fresh(),answers:[...work.answers,response]});
        this.setState({running:false});
    }
    private back = () => {
        this.stop();
        this.setState({selected:null,running:false,feedback:''},this.focusHeading);
    }
    render() {
        const {selected,work,records,group,search,running,feedback} = this.state;
        const step = selected && selected.steps[work.answers.length];
        const matching = schoolTasks.filter(t => (group === 'All' || t.group === group) &&
            t.name.toLowerCase().includes(search.trim().toLowerCase()));
        return <main className="studio school"><header className="mast"><div className="wordmark">Corner Time</div>
            <a href="#studio">Return to studio</a></header>
            {selected ? <><div className="studio-title"><h1 ref={this.heading} tabIndex={-1}>{selected.name}</h1><button onClick={this.back}>All school penalties</button></div>
                <section className="feature"><small>{selected.group.toUpperCase()}</small>
                {step ? <><h2>Step {work.answers.length + 1} of {selected.steps.length}</h2><p id="school-prompt">{step.prompt}</p>
                    {step.kind === 'confirm' && <label><input type="checkbox" checked={work.checked}
                        onChange={e=>this.save({...work,checked:e.target.checked})}/> I completed this task in person.</label>}
                    {(step.kind === 'answer' || step.kind === 'write') && <>
                        <label htmlFor="school-answer">{step.kind === 'answer' ? 'Your answer' : 'Your written response'}</label>
                        <textarea id="school-answer" aria-describedby="school-prompt" rows={step.kind === 'write' ? 4 : 2} value={work.draft}
                            onChange={e=>this.save({...work,draft:e.target.value})}/>
                        {step.kind === 'write' && <p>{work.draft.trim() ? work.draft.trim().split(/\s+/).length : 0} words · minimum {step.words}. Review your own response.</p>}</>}
                    {step.kind === 'timer' && <><div className="digits">{formatDuration(step.seconds-work.elapsed)}</div>
                        <p>The timer pauses when you leave this page or hide the tab.</p>
                        {work.elapsed < step.seconds && <button onClick={running ? this.pause : () => this.startTimer(step.seconds)}>
                            {running ? 'Pause timer' : work.elapsed ? 'Resume timer' : 'Start timer'}</button>}</>}
                    <p role="status">{feedback}</p>
                    <button className="action" disabled={(step.kind === 'timer' && work.elapsed < step.seconds) || (step.kind === 'confirm' && !work.checked)}
                        onClick={this.advance}>{work.answers.length + 1 === selected.steps.length ? 'Finish assignment' : 'Complete step'}</button>
                </> : <><h2>Assignment complete</h2><p>You completed all {selected.steps.length} steps.</p>
                    <button className="action" onClick={()=>this.save(fresh())}>Do this assignment again</button></>}
                </section>
                {work.answers.length > 0 && <details className="stage-list"><summary>Review completed work ({work.answers.length})</summary>
                    <ol>{work.answers.map((response,i)=><li key={i}><strong>{selected.steps[i].prompt}</strong><p>{response}</p></li>)}</ol></details>}
                <p className="my-3">Your progress and written responses are saved in this browser on this device.</p>
            </> : <><div className="studio-title"><h1 ref={this.heading} tabIndex={-1}>School penalties</h1><input type="search" aria-label="Search assignments"
                placeholder="Search assignments" value={search} onChange={e=>this.setState({search:e.target.value})}/></div>
                <p>Choose from {schoolTasks.length} assignments. Complete written work here, serve a study timer, or follow a checklist for a classroom duty. You can leave and resume later.</p>
                <div className="filters">{groups.map(g=><button key={g} aria-pressed={group === g} onClick={()=>this.setState({group:g})}>{g}</button>)}</div>
                <div className="cards">{matching.map(t=>{
                    const saved = records[t.id];
                    const progress = saved ? saved.answers.length : 0;
                    return <button key={t.id} onClick={()=>this.open(t)}><span><strong>{t.name}</strong><small>{t.group} · {progress === t.steps.length ?
                        'Complete' : saved ? 'Resume · ' + progress + '/' + t.steps.length : t.steps.length + ' steps'}</small></span></button>;
                })}</div>{!matching.length && <p>No matching assignments.</p>}</>}
        </main>;
    }
}
