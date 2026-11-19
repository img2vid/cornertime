import * as React from 'react';
import PunishmentStateMachine from '../state';
import ClassicDuration from './ClassicDuration';
import ChallengeStudio from './ChallengeStudio';

interface Props {
    fsm: PunishmentStateMachine;
    onCustom(): void;
    onPreset(): void;
    onReport(): void;
}
export default class WelcomeScreen extends React.Component<Props> {
    render() {
        return <main className="studio"><header className="mast"><div className="wordmark"><i aria-hidden="true">◷</i> Corner Time</div>
            <nav className="classic-actions"><a href="#classic">Classic tools ↓</a><a href="#continuous">Continuous typing</a><a href="#chain">Chain challenge</a></nav></header>
            <section id="classic"><h2>Classic tools</h2><ClassicDuration fsm={this.props.fsm}/><div className="classic-actions">
                <button onClick={() => this.props.fsm.getReady()}>Start 10–15 minute session</button>
                <button onClick={this.props.onCustom}>Design preset</button><button onClick={this.props.onPreset}>Import preset</button>
                <button onClick={this.props.onReport}>View report</button></div></section>
            <ChallengeStudio />
            <nav className="guide-links" aria-label="Challenge guides"><h2>Challenge guides</h2>
                {(['Movement', 'Position', 'Sound', 'Mixed']).map(group => <a key={group} href={'./guides/' + group.toLowerCase() + '.html'}>{group} guide</a>)}
            </nav>
            <footer>Camera and microphone processing stays on this device. <a href="https://github.com/img2vid/cornertime">Source code ↗</a></footer></main>;
    }
}
