import * as React from 'react';
import PunishmentStateMachine from '../state';
import SessionMonitor from './SessionMonitor';
import StudioHeader from './StudioHeader';
import ChallengeStudio from './ChallengeStudio';
import TypingSession from './TypingSession';
import SchoolAssignments from './SchoolAssignments';
import WelcomeScreen from './WelcomeScreen';
import PunishmentSetup from './PunishmentSetup';
import PunishmentLoader from './PunishmentLoader';
import ReportCard from './ReportCard';
import ReportViewer from './ReportViewer';

import 'bootstrap/dist/css/bootstrap.css';
import { formatDuration } from '../time';


type SetupScreen = 'default' | 'custom' | 'report' | 'preset' | 'school' | 'continuous' | 'chain' | 'catalog';

function linkedScreen(): SetupScreen {
    if (/^#challenge=/.test(window.location.hash)) { return 'catalog'; }
    switch(window.location.hash) {
        case '#duties': case '#practice': case '#studio': return 'catalog';
        case '#custom': return 'custom';
        case '#preset': return 'preset';
        case '#report': return 'report';
        case '#school': return 'school';
        case '#continuous': return 'continuous';
        case '#chain': return 'chain';
        default: return 'default';
    }
}

interface AppState {
    setupScreen: SetupScreen;
}


class App extends React.Component<{}, AppState> {
    fsm = new PunishmentStateMachine();

    state: AppState = {
        setupScreen: linkedScreen(),
    };

    handleRouteChange = () => {
        if (this.fsm.state !== 'waiting') { return; }
        const screen=linkedScreen();
        this.setState({setupScreen:screen}, () => {
            const heading=document.querySelector<HTMLElement>(window.location.hash==='#classic' ? '#classic h2' : 'main h1');
            if (heading) { heading.tabIndex=-1; heading.focus(); }
            if (window.location.hash!=='#classic') { window.scrollTo(0,0); }
        });
    }

    componentDidMount() {
        window.addEventListener('hashchange',this.handleRouteChange);
        this.fsm.addListener(this.handleFsmUpdate);

        // Debug globals
        if (typeof window !== 'undefined') {
            const anyWindow: any = window;
            anyWindow.cornertime = anyWindow.cornertime || {};
            anyWindow.cornertime.fsm = this.fsm;
        }
    }

    componentWillUnmount() {
        window.removeEventListener('hashchange',this.handleRouteChange);
        this.fsm.stopClock();
        this.fsm.removeListener(this.handleFsmUpdate);
    }

    render() {
        const fsm = this.fsm;

        switch (fsm.state) {
            case 'waiting':
                switch (this.state.setupScreen) {
                    case 'chain': case 'continuous':
                        return <TypingSession key={this.state.setupScreen} chain={this.state.setupScreen === 'chain'} />;
                    case 'catalog':
                        return <main className="studio"><StudioHeader section="Monitored activities"/><ChallengeStudio key={window.location.hash}/></main>;
                    case 'school':
                        return <SchoolAssignments />;
                    case 'custom':
                    case 'preset':
                    case 'report':
                        const page=this.state.setupScreen;
                        return <main className="studio tool-page"><StudioHeader section="Classic tools"/>
                            {page==='custom' ? <PunishmentSetup fsm={fsm} onBack={this.returnToWelcomeScreen}/> :
                             page==='preset' ? <PunishmentLoader fsm={fsm} onBack={this.returnToWelcomeScreen}/> :
                             <ReportViewer onBack={this.returnToWelcomeScreen}/>}</main>;
                    default:
                        return <WelcomeScreen fsm={fsm}/>;
                }

            case 'preparation':
            case 'punishment':
            case 'cooldown':
                const preparing = fsm.state === 'preparation';
                return <main className="studio classic-live"><div className="feature"><small>CLASSIC CORNER TIME</small>
                    <h1 className="digits">
                        {preparing ? 'Starting in ' + formatDuration(-fsm.currentTime) :
                            formatDuration(fsm.timeLeft)}
                    </h1></div>
                    <SessionMonitor preparing={preparing} onMotion={this.handleMotionUpdate} />
                </main>;

            case 'finished':
                return <main className="studio tool-page"><ReportCard report={fsm.report()} showMessage={true}/><a href="./">Return to all activities</a></main>;

            default:
                return null;
        }
    }

    returnToWelcomeScreen = () => { window.location.hash='home'; };

    handleFsmUpdate = () => {
        this.forceUpdate();
    }

    handleMotionUpdate = (magnitude: number) => this.fsm.handleMotionUpdate(magnitude);
}

export default App;
