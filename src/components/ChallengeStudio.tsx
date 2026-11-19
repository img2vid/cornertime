import * as React from 'react';
import SessionMonitor from './SessionMonitor';
import { Challenge, courses, advance, scoreSecond, initialRun, instruction, Reading, readLocal, saveLocal, target } from '../challenges';

interface Result { id: string; level: string; seconds: number; hits: number; combo: number; date: string; }
const groups = ['All', 'Strict', 'Movement', 'Position', 'Sound', 'Mixed', 'Saved'];
const levels = ['Standard', 'Extended', 'Endurance'];
const icons = { Movement: '≈', Position: '⌖', Sound: '≋', Mixed: '◈' };
const clock = (s: number) => Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2);

export default class ChallengeStudio extends React.Component<{}, {}> {
    state = { selected: courses.find(c => window.location.hash === '#challenge=' + c.id) || courses[0], group: 'All', search: '', level: 0, active: false,
        done: false, paused: false, prep: 5, status: '', run: initialRun,
        saved: readLocal<string[]>('saved', []), history: readLocal<Result[]>('history', []),
        records: readLocal<{[key: string]: number}>('records', {}) };
    private samples: Reading[] = [];
    private timer = 0;
    private course = courses[0];
    componentWillUnmount() { window.clearInterval(this.timer); document.removeEventListener('visibilitychange', this.visibility); }
    private receive = (reading: Reading) => { if (this.samples.length < 15) { this.samples.push(reading); } }
    private breakHold() {
        const run = this.state.run;
        return this.course.strict ? { ...run, combo: 0, progress: 0 } : run;
    }
    private visibility = () => {
        if (document.hidden && this.state.active) {
            this.samples = [];
            this.setState({ paused: true, run: this.breakHold() });
        }
    }
    componentDidMount() { document.addEventListener('visibilitychange', this.visibility); }
    private start = () => {
        const c = this.state.selected;
        this.course = { ...c, stages: c.stages.map(s => ({ ...s, seconds: Math.ceil(s.seconds * (1 + this.state.level * .5)) })) };
        this.samples = [];
        this.setState({ active: true, done: false, paused: false, prep: 5, run: initialRun,
            status: 'Waiting for sensors' });
        window.clearInterval(this.timer);
        this.timer = window.setInterval(this.tick, 1000);
    }
    private tick = () => {
        const batch = this.samples;
        this.samples = [];
        const { prep, run, active, paused } = this.state;
        if (!active || paused) { return; }
        const c = this.course;
        const rule = c.stages[run.stage].rule;
        if (prep) {
            const ready = batch.filter(r => (c.group === 'Sound' || r.motion !== undefined) &&
                (c.group === 'Movement' || c.group === 'Position' || r.noise !== undefined));
            if (ready.length >= (c.strict ? 8 : 5)) {
                this.setState({ prep: prep - 1, status: 'Ready' });
            } else {
                this.setState({ status: 'Waiting for sensors. Check permissions and enable the microphone for sound goals.' });
            }
            return;
        }
        const hit = scoreSecond(c, rule, batch);
        if (hit === undefined) {
            this.setState({ run: this.breakHold(), status: c.strict ? 'Sensor gap · restart this hold' : 'Waiting for sensor readings' });
            return;
        }
        const next = advance(run, c, hit);
        if (next.stage === c.stages.length) {
            window.clearInterval(this.timer);
            const result = { id: c.id, level: levels[this.state.level], seconds: next.elapsed, hits: next.hits,
                combo: next.bestCombo, date: new Date().toISOString() };
            const history = [result, ...this.state.history].slice(0, 50);
            const key = c.id + '.' + result.level;
            const records = { ...this.state.records, [key]: Math.min(this.state.records[key] || Infinity, result.seconds) };
            saveLocal('history', history);
            saveLocal('records', records);
            this.setState({ run: next, done: true, active: false, history, records });
        } else {
            this.setState({ run: next, status: next.stage !== run.stage ? 'Stage complete' :
                hit ? 'On target' : c.stages[run.stage].streak ? 'Streak reset' : 'Outside target' });
        }
    }
    private leave = () => {
        window.clearInterval(this.timer);
        this.samples = [];
        this.setState({ active: false, done: false });
    }
    private select = (c: Challenge) => this.setState({ selected: c }, () => {
        const heading = document.getElementById('selected-challenge');
        if (heading) { heading.focus(); }
    });
    private pick = (daily: boolean) => {
        const now = new Date();
        const day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
        const pool = daily ? courses : courses.filter(c => c.id !== this.state.selected.id);
        const chosen = pool[daily ? day % pool.length : Math.floor(Math.random() * pool.length)];
        this.setState({ selected: chosen, group: 'All', search: '' });
    }
    private favorite = () => {
        const { selected, saved } = this.state;
        const changed = saved.includes(selected.id) ? saved.filter(id => id !== selected.id) : [...saved, selected.id];
        saveLocal('saved', changed);
        this.setState({ saved: changed });
    }
    render() {
        const { active, done, paused, selected, prep, run, status, group, search, level, saved, history, records } = this.state;
        if (done) {
            return <section className="feature result"><small>SESSION COMPLETE</small><h1>{selected.name}</h1>
                <div className="numbers"><span><b>{clock(run.elapsed)}</b>Finish time</span>
                <span><b>{Math.round(100 * run.hits / run.elapsed)}%</b>Accuracy</span>
                <span><b>{run.bestCombo}s</b>Best streak</span></div>
                <button className="action" onClick={this.start}>Try again</button> <button onClick={this.leave}>Back to studio</button></section>;
        }
        if (active) {
            const stage = this.course.stages[run.stage];
            return <section className="live"><div className="feature"><small>{paused ? 'PAUSED' : prep ? 'CALIBRATION' :
                'STAGE ' + (run.stage + 1) + ' / ' + this.course.stages.length}</small><h1>{selected.name}</h1>
                <p>{prep ? 'Settle into your starting position while the sensors get ready.' : instruction(stage.rule)}</p>
                <div className="digits">{prep ? prep + 's' : run.progress + ' / ' + stage.seconds + 's'}</div>
                <progress aria-label="Stage progress" value={prep ? 5 - prep : run.progress} max={prep ? 5 : stage.seconds} />
                <p>{status}</p><div className="numbers"><span><b>{clock(run.elapsed)}</b>Scored time</span><span><b>{run.combo}s</b>Current streak</span>
                <span><b>{prep ? '—' : stage.streak ? 'Streak' : 'Banked'}</b>Goal type</span></div>
                <button onClick={() => { this.samples = []; this.setState({ paused: !paused, run: this.breakHold() }); }}>{paused ? 'Resume' : 'Pause'}</button>{' '}
                <button onClick={this.leave}>End challenge</button></div>
                <SessionMonitor preparing={!!prep} cameraEnabled={selected.group !== 'Sound'} onReading={this.receive} onMotion={ignoreMotion} /></section>;
        }
        const visible = courses.filter(c => (group === 'All' || (group === 'Strict' && c.strict) || c.group === group || (group === 'Saved' && saved.includes(c.id))) &&
            (c.name + ' ' + c.brief).toLowerCase().includes(search.toLowerCase()));
        const best = records[selected.id + '.' + levels[level]];
        return <><div className="studio-title"><h1>Challenge studio</h1><div><button onClick={() => this.pick(true)}>Daily pick</button>{' '}
            <button onClick={() => this.pick(false)}>Shuffle</button></div></div>
            <section className="feature spotlight"><div><small>{selected.strict && 'STRICT · '}{selected.group.toUpperCase()} CHALLENGE</small><h2 id="selected-challenge" tabIndex={-1}>{selected.name}</h2>
                <p>{selected.brief}</p>{selected.strict && <p>Every reading must meet the target. A miss, pause or sensor gap restarts the current hold. Completed stages stay earned.</p>}<label>Difficulty <select value={level} onChange={e => this.setState({ level: Number(e.target.value) })}>
                    {levels.map((l,i) => <option key={l} value={i}>{l}</option>)}</select></label>
                <div className="launch"><button className="action" onClick={this.start}>Start challenge →</button>
                <button aria-pressed={saved.includes(selected.id)} onClick={this.favorite}>{saved.includes(selected.id) ? '★ Saved' : '☆ Save'}</button></div></div>
                <div className="dial"><div><strong>{selected.stages.reduce((n,s) => n + Math.ceil(s.seconds * (1 + level * .5)),0)}s</strong><span>Target time</span></div></div>
            </section><div className="detail-strip"><span className="mobile-target">{selected.stages.reduce((n,s) => n + Math.ceil(s.seconds * (1 + level * .5)),0)}s target</span><span>{selected.stages.length} {selected.stages.length === 1 ? 'stage' : 'stages'}</span>
                <span>{selected.group === 'Sound' ? 'Microphone' : selected.group === 'Mixed' ? 'Camera + microphone' : 'Camera'}</span>
                <span>{best ? 'Personal best ' + clock(best) : 'Personal best —'}</span></div>
            <details className="stage-list"><summary>Stage guide</summary><ol>{selected.stages.map((s,i) => <li key={i}>{instruction(s.rule)}{' '}
                {Math.ceil(s.seconds * (1 + level * .5))} {s.streak ? 'consecutive' : 'total'} seconds.</li>)}</ol></details>
            <div className="studio-title"><h2>Challenge library</h2><input type="search" aria-label="Search challenges" placeholder="Search challenges" value={search}
                onChange={e => this.setState({ search: e.target.value })}/></div>
            <div className="filters">{groups.map(g => <button aria-pressed={g === group} key={g} onClick={() => this.setState({group:g})}>{g}</button>)}</div>
            <div className="cards">{visible.map(c => <button key={c.id} aria-pressed={selected.id === c.id} onClick={() => this.select(c)}>
                <span className={'glyph ' + c.group} aria-hidden="true">{icons[c.group]}</span><span><strong>{c.name}</strong><small>{c.strict && 'Strict · '}{c.group} · {target(c)}s base</small></span></button>)}</div>
            {!visible.length && <p>No matching challenges.</p>}
            <details className="stage-list"><summary>Recent sessions ({history.length})</summary>
                {history.length === 0 ? <p>Completed challenges appear here.</p> : <ol>{history.map((r,i) => {
                    const c = courses.find(item => item.id === r.id);
                    return <li key={i}>{c ? c.name : r.id} · {r.level} · {clock(r.seconds)} · {new Date(r.date).toLocaleDateString()}</li>;
                })}</ol>}</details></>;
    }
}
function ignoreMotion() { /* Classic sessions use a separate movement timer. */ }
