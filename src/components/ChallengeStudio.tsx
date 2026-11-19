import * as React from 'react';
import SessionMonitor from './SessionMonitor';
import { Challenge, courses, advance, scoreSecond, initialRun, instruction, Reading, readLocal, saveLocal, target } from '../challenges';

import { assess, cleanRecord, duties } from '../duties';

import { formatDuration as clock, durationLabel } from '../time';

interface Result { id: string; level: string; seconds: number; hits: number; combo: number; date: string; }
const groups = ['All', 'Strict', 'Movement', 'Position', 'Sound', 'Mixed', 'Saved'];
const levels = ['Standard', 'Extended', 'Endurance'];
const icons = { Movement: '≈', Position: '⌖', Sound: '≋', Mixed: '◈' };


export default class ChallengeStudio extends React.Component<{}, {}> {
    state = { traditional: window.location.hash !== '#practice' && !courses.some(c => window.location.hash === '#challenge=' + c.id), discipline: cleanRecord,
        selected: [...courses, ...duties].find(c => window.location.hash === '#challenge=' + c.id) || (window.location.hash === '#practice' ? courses[0] : duties[0]), group: 'All', search: '', level: 0, active: false,
        done: false, lost: false, misses: 0, attempt: 0, muted: readLocal<string>('voice', 'on') === 'off', paused: false, prep: 5, status: '', run: initialRun,
        saved: readLocal<string[]>('saved', []), history: readLocal<Result[]>('history', []),
        records: readLocal<{[key: string]: number}>('records', {}) };
    private samples: Reading[] = [];
    private utterance?: SpeechSynthesisUtterance;
    private quietUntil = 0;
    private interruptedAudio = false;
    private stopVoice() {
        if (this.utterance) {
            this.utterance.onend = null;
            this.utterance.onerror = null;
            this.utterance = undefined;
            window.speechSynthesis.cancel();
        }
        this.quietUntil = Date.now() + 300;
    }
    private say(message: string) {
        if (this.state.muted || !window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') { return; }
        this.stopVoice();
        const utterance = new SpeechSynthesisUtterance(message);
        this.utterance = utterance;
        this.quietUntil = Date.now() + 15000;
        const finish = () => {
            if (this.utterance === utterance) {
                this.utterance = undefined;
                this.quietUntil = Date.now() + 300;
            }
        };
        utterance.onend = finish;
        utterance.onerror = finish;
        try { window.speechSynthesis.speak(utterance); } catch { finish(); }
    }
    private voiceControl() {
        return <button aria-pressed={!this.state.muted} onClick={() => {
            const muted = !this.state.muted;
            this.stopVoice();
            saveLocal('voice', muted ? 'off' : 'on');
            this.setState({ muted }, () => { if (!muted) { this.say('Audio prompts on.'); } });
        }}>Audio prompts {this.state.muted ? 'off' : 'on'}</button>;
    }
    private pause = () => {
        const paused = !this.state.paused;
        this.samples = [];
        this.say(paused ? 'Challenge paused.' : 'Challenge resumed.');
        this.setState({ paused, discipline:{ ...this.state.discipline, outside:0, recovery:0 }, run: this.breakHold() });
    }
    private timer = 0;
    private course = courses[0];
    componentWillUnmount() { this.stopVoice(); window.clearInterval(this.timer); document.removeEventListener('visibilitychange', this.visibility); }
    private receive = (reading: Reading) => { if (Date.now() < this.quietUntil && (this.course.group === 'Sound' || this.course.group === 'Mixed')) {
        this.interruptedAudio = true;
        return;
    }
    if (this.samples.length < 15) { this.samples.push(reading); } }
    private breakHold() {
        const run = this.state.run;
        return !this.state.traditional && this.course.strict ? { ...run, combo: 0, progress: 0 } : run;
    }
    private visibility = () => {
        if (document.hidden && this.state.active && !this.state.paused) {
            this.samples = [];
            this.pause();
        }
    }
    componentDidMount() { document.addEventListener('visibilitychange', this.visibility); }
    private start = () => {
        const c = this.state.selected;
        this.course = { ...c, stages: c.stages.map(s => ({ ...s, seconds: Math.ceil(s.seconds * (1 + this.state.level * .5)) })) };
        this.samples = [];
        this.interruptedAudio = false;
        this.say('Get ready for ' + c.name + '.' + (c.group === 'Mixed' || c.group === 'Sound' ? ' Enable the microphone.' : ''));
        this.setState({ discipline: cleanRecord, active: true, done: false, lost: false, misses: 0, attempt: this.state.attempt + 1, paused: false, prep: 5, run: initialRun,
            status: 'Waiting for sensors' });
        window.clearInterval(this.timer);
        this.timer = window.setInterval(this.tick, 1000);
    }
    private tick = () => {
        const batch = this.samples;
        this.samples = [];
        const { prep, run, active, paused } = this.state;
        const voiceWindow = this.interruptedAudio;
        this.interruptedAudio = false;
        if (!active || paused || voiceWindow) { return; }
        const c = this.course;
        const rule = c.stages[run.stage].rule;
        if (prep) {
            const ready = batch.filter(r => (c.group === 'Sound' || r.motion !== undefined) &&
                (c.group === 'Movement' || c.group === 'Position' || r.noise !== undefined));
            if (ready.length >= (c.strict ? 8 : 5)) {
                if (prep === 1) { this.say('Stage one. ' + instruction(rule)); }
                this.setState({ prep: prep - 1, status: 'Ready' });
            } else {
                if (!this.state.status.startsWith('Waiting for sensors.')) { this.say('Waiting for sensors. Check device permissions.'); }
                this.setState({ status: 'Waiting for sensors. Check permissions and enable the microphone for sound goals.' });
            }
            return;
        }
        const hit = scoreSecond(c, rule, batch, this.state.traditional);
        if (hit === undefined) {
            if (!this.state.status.startsWith('Sensor gap') && this.state.status !== 'Waiting for sensor readings') {
                this.say('Waiting for sensor readings.');
            }
            this.setState({ discipline:{ ...this.state.discipline, outside:0, recovery:0 }, run: this.breakHold(), status: !this.state.traditional && c.strict ? 'Sensor gap · restart this hold' : 'Waiting for sensor readings' });
            return;
        }
        const traditional = this.state.traditional;
        const discipline = traditional ? assess(this.state.discipline, hit) : this.state.discipline;
        const extra = discipline.added - this.state.discipline.added;
        if (extra) { c.stages[run.stage].seconds += extra; }
        const newWarning = discipline.violations !== this.state.discipline.violations;
        const next = advance(run, c, hit);
        const misses = hit ? 0 : this.state.misses + 1;
        if (!traditional && misses >= 3) {
            window.clearInterval(this.timer);
            this.say('Attempt lost. Select Try again to restart this challenge.');
            this.setState({ active: false, lost: true, misses, run: next });
            return;
        }
        if (next.stage === c.stages.length) {
            window.clearInterval(this.timer);
            const result = { id: c.id, level: levels[this.state.level], seconds: next.elapsed, hits: next.hits,
                combo: next.bestCombo, date: new Date().toISOString() };
            const history = [result, ...this.state.history].slice(0, 50);
            const key = c.id + '.' + result.level;
            const records = { ...this.state.records, [key]: Math.min(this.state.records[key] || Infinity, result.seconds) };
            saveLocal('history', history);
            saveLocal('records', records);
            this.say(traditional ? 'Your time is served. You may leave.' : 'Challenge complete. Best streak ' + next.bestCombo + ' seconds.');
            this.setState({ discipline, run: next, done: true, active: false, history, records });
        } else {
            if (next.stage !== run.stage) { this.say('Stage complete. Next stage. ' + instruction(c.stages[next.stage].rule)); }
            else if (traditional) {
                if (newWarning) { this.say(extra ? 'Five seconds added. Resume your duty.' : 'Warning. Return to the instructed hold.'); }
                else if (hit && this.state.misses >= 2) { this.say('Timer resumed.'); }
            }
            else if (!hit) { this.say(misses === 2 ? 'Two misses. One more ends the attempt.' : 'Outside target. One miss.'); }
            else if (this.state.misses || next.progress === Math.ceil(c.stages[next.stage].seconds / 2)) {
                this.say(this.state.misses ? 'Back on target.' : 'Halfway through this stage.');
            }
            this.setState({ discipline, run: next, misses, status: traditional ?
                (hit ? 'Serving time' : extra ? 'Five seconds added' : newWarning ? 'Warning issued' : 'Timer held · resume your duty') : next.stage !== run.stage ? 'Stage complete' :
                hit ? 'On target' : c.stages[run.stage].streak ? 'Streak reset' : 'Outside target' });
        }
    }
    private leave = () => {
        window.clearInterval(this.timer);
        this.samples = [];
        this.stopVoice();
        if (this.state.active) { this.say('Challenge ended.'); }
        this.setState({ active: false, done: false, lost: false });
    }
    private select = (c: Challenge) => this.setState({ selected: c }, () => {
        const heading = document.getElementById('selected-challenge');
        if (heading) { heading.focus(); }
    });
    private pick = (daily: boolean) => {
        const now = new Date();
        const day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
        const catalog = this.state.traditional ? duties : courses;
        const pool = daily ? catalog : catalog.filter(c => c.id !== this.state.selected.id);
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
        const traditional = this.state.traditional;
        const catalog = traditional ? duties : courses;
        if (this.state.lost) {
            return <section className="feature result"><small>ATTEMPT LOST</small><h1>{selected.name}</h1>
                <p>Three scored seconds in a row missed the target on stage {run.stage + 1}.</p>
                <p>{instruction(this.course.stages[run.stage].rule)}</p>
                <button className="action" onClick={this.start}>Try again</button>{' '}
                <button onClick={this.leave}>Back to studio</button>{' '}{this.voiceControl()}</section>;
        }
        if (done) {
            return <section className="feature result"><small>SESSION COMPLETE</small><h1>{selected.name}</h1>
                <div className="numbers"><span><b>{clock(run.elapsed)}</b>Finish time</span>
                <span><b>{traditional ? this.state.discipline.violations : Math.round(100 * run.hits / run.elapsed) + '%'}</b>{traditional ? 'Warnings and penalties' : 'Accuracy'}</span>
                <span><b>{traditional ? this.state.discipline.added : run.bestCombo}s</b>{traditional ? 'Time added' : 'Best streak'}</span></div>
                <button className="action" onClick={this.start}>Try again</button> <button onClick={this.leave}>Back to studio</button></section>;
        }
        if (active) {
            const stage = this.course.stages[run.stage];
            return <section className="live"><div className="feature"><small>{paused ? 'PAUSED' : prep ? 'CALIBRATION' :
                'STAGE ' + (run.stage + 1) + ' / ' + this.course.stages.length}</small><h1>{selected.name}</h1>
                <p>{prep ? 'Settle into your starting position while the sensors get ready.' : instruction(stage.rule)}</p>
                <div className="digits">{prep ? prep + 's' : traditional ? clock(stage.seconds - run.progress) : run.progress + ' / ' + stage.seconds + 's'}</div>
                {traditional && !prep && this.course.stages.length > 1 && <p>Duty remaining: {clock(
                    this.course.stages.slice(run.stage).reduce((sum, s) => sum + s.seconds, 0) - run.progress
                )}</p>}
                <progress aria-label="Stage progress" value={prep ? 5 - prep : run.progress} max={prep ? 5 : stage.seconds} />
                <p>{status}{!traditional && !prep && this.state.misses > 0 && ` · Misses: ${this.state.misses} of 3`}</p><div className="numbers"><span><b>{clock(run.elapsed)}</b>{traditional ? 'Monitored time' : 'Scored time'}</span><span><b>{traditional ? this.state.discipline.added : run.combo}s</b>{traditional ? 'Time added' : 'Current streak'}</span>
                <span><b>{prep ? '—' : traditional ? 'Timed hold' : stage.streak ? 'Streak' : 'Banked'}</b>Goal type</span></div>
                <button onClick={this.pause}>{paused ? 'Resume' : 'Pause'}</button>{' '}
                <button onClick={this.start}>{traditional ? 'Restart duty' : 'Restart challenge'}</button>{' '}<button onClick={this.leave}>{traditional ? 'End duty' : 'End challenge'}</button>{' '}{this.voiceControl()}</div>
                <SessionMonitor key={this.state.attempt} preparing={!!prep} cameraEnabled={selected.group !== 'Sound'} onReading={this.receive} onMotion={ignoreMotion} /></section>;
        }
        const visible = catalog.filter(c => (group === 'All' || (group === 'Strict' && c.strict) || c.group === group || (group === 'Saved' && saved.includes(c.id))) &&
            (c.name + ' ' + c.brief).toLowerCase().includes(search.toLowerCase()));
        const plannedTime = durationLabel(selected.stages.reduce((sum, s) => sum + Math.ceil(s.seconds * (1 + level * .5)), 0));
        const best = records[selected.id + '.' + levels[level]];
        return <><div className="studio-title"><h1>{traditional ? 'Traditional duties' : 'Practice challenges'}</h1><div>
            <button onClick={() => {
                if (['#duties','#studio','#practice'].includes(window.location.hash) || window.location.hash.startsWith('#challenge=')) {
                    window.location.hash=traditional?'practice':'duties';
                } else { this.setState({ traditional: !traditional, selected: traditional ? courses[0] : duties[0], group:'All', search:'' }); }
            }}>
                {traditional ? 'Practice challenges' : 'Traditional duties'}</button>{' '}
            {!traditional && <><button onClick={() => this.pick(true)}>Daily pick</button>{' '}
            <button onClick={() => this.pick(false)}>Shuffle</button></>}</div></div>
            <button className="browse-catalog" onClick={()=>{const h=document.getElementById('catalog-heading');if(h){h.tabIndex=-1;h.focus();h.scrollIntoView();}}}>{traditional ? 'Browse all duties ↓' : 'Browse all challenges ↓'}</button>
            <section className="feature spotlight"><div><small>{selected.strict && 'STRICT · '}{selected.group.toUpperCase()} {traditional ? 'DUTY' : 'CHALLENGE'}</small><h2 id="selected-challenge" tabIndex={-1}>{selected.name}</h2>
                <p>{selected.brief}</p>{traditional ? <p>The timer runs while you follow the instruction. Two missed seconds bring a warning. Later incidents add five seconds each, up to thirty seconds total.</p> : <p>Three missed seconds in a row end the attempt. A good second clears the misses.</p>}{!traditional && selected.strict && <p>Every reading must meet the target. A miss, pause or sensor gap restarts the current hold. Completed stages stay earned.</p>}<label>Difficulty <select value={level} onChange={e => this.setState({ level: Number(e.target.value) })}>
                    {levels.map((l,i) => <option key={l} value={i}>{l}</option>)}</select></label>
                <div className="launch"><button className="action" onClick={this.start}>{traditional ? 'Begin duty' : 'Start challenge →'}</button>
                <button aria-pressed={saved.includes(selected.id)} onClick={this.favorite}>{saved.includes(selected.id) ? '★ Saved' : '☆ Save'}</button>{this.voiceControl()}</div></div>
                <div className="dial"><div><strong>{plannedTime}</strong><span>Target time</span></div></div>
            </section><div className="detail-strip"><span className="mobile-target">{plannedTime} target</span><span>{selected.stages.length} {selected.stages.length === 1 ? 'stage' : 'stages'}</span>
                <span>{selected.group === 'Sound' ? 'Microphone' : selected.group === 'Mixed' ? 'Camera + microphone' : 'Camera'}</span>
                {!traditional && <span>{best ? 'Personal best ' + clock(best) : 'Personal best —'}</span>}</div>
            <details className="stage-list"><summary>Stage guide</summary><ol>{selected.stages.map((s,i) => <li key={i}>{instruction(s.rule)}{' '}
                {durationLabel(Math.ceil(s.seconds * (1 + level * .5)))} {s.streak ? 'uninterrupted' : 'total'}.</li>)}</ol></details>
            <div className="studio-title"><h2 id="catalog-heading">{traditional ? 'Choose a duty' : 'Challenge library'}</h2><input type="search" aria-label="Search challenges" placeholder="Search challenges" value={search}
                onChange={e => this.setState({ search: e.target.value })}/></div>
            <div className="filters">{groups.map(g => <button aria-pressed={g === group} key={g} onClick={() => this.setState({group:g})}>{g}</button>)}</div>
            <div className="cards">{visible.map(c => <button key={c.id} aria-pressed={selected.id === c.id} onClick={() => this.select(c)}>
                <span className={'glyph ' + c.group} aria-hidden="true">{icons[c.group]}</span><span><strong>{c.name}</strong><small>{c.strict && 'Strict · '}{c.group} · {durationLabel(target(c))} base</small></span></button>)}</div>
            {!visible.length && <p>No matching challenges.</p>}
            <details className="stage-list"><summary>Recent sessions ({history.length})</summary>
                {history.length === 0 ? <p>Completed challenges appear here.</p> : <ol>{history.map((r,i) => {
                    const c = [...courses, ...duties].find(item => item.id === r.id);
                    return <li key={i}>{c ? c.name : r.id} · {r.level} · {clock(r.seconds)} · {new Date(r.date).toLocaleDateString()}</li>;
                })}</ol>}</details></>;
    }
}
function ignoreMotion() { /* Classic sessions use a separate movement timer. */ }
