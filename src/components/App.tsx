import * as React from 'react';
import PunishmentStateMachine from '../state';
import SessionMonitor from './SessionMonitor';
import TypingSession from './TypingSession';
import SchoolAssignments from './SchoolAssignments';
import WelcomeScreen from './WelcomeScreen';
import PunishmentSetup from './PunishmentSetup';
import PunishmentLoader from './PunishmentLoader';
import ReportCard from './ReportCard';
import ReportViewer from './ReportViewer';

import 'bootstrap/dist/css/bootstrap.css';
import { formatDuration } from '../time';


type SetupScreen = 'default' | 'custom' | 'report' | 'preset' | 'school' | 'continuous' | 'chain';

function linkedScreen(): SetupScreen {
    switch(window.location.hash) {
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

    schoolRoute = () => {
        if (this.fsm.state !== 'waiting') { return; }
        const screen=linkedScreen();
        if(screen!=='default' || ['continuous','school','chain'].includes(this.state.setupScreen)){ this.setState({setupScreen:screen}); }
    }

    componentDidMount() {
        window.addEventListener('hashchange',this.schoolRoute);
        this.fsm.addListener(this.handleFsmUpdate);

        // Debug globals
        if (typeof window !== 'undefined') {
            const anyWindow: any = window;
            anyWindow.cornertime = anyWindow.cornertime || {};
            anyWindow.cornertime.fsm = this.fsm;
        }
    }

    componentWillUnmount() {
        window.removeEventListener('hashchange',this.schoolRoute);
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
                    case 'school':
                        return <SchoolAssignments />;
                    case 'custom':
                        return <PunishmentSetup fsm={fsm} onBack={this.returnToWelcomeScreen} />;
                    case 'preset':
                        return <PunishmentLoader fsm={fsm} onBack={this.returnToWelcomeScreen} />;
                    case 'report':
                        return <ReportViewer onBack={this.returnToWelcomeScreen} />;
                    default:
                        return (
                            <WelcomeScreen
                                fsm={fsm}
                                onCustom={this.setUpCustom}
                                onPreset={this.loadPreset}
                                onReport={this.viewReport}
                            />
                        );
                }

            case 'preparation':
            case 'punishment':
            case 'cooldown':
                const preparing = fsm.state === 'preparation';
                return <>
                    <h1 className="display-2 my-5 text-center">
                        {preparing ? 'The punishment will start in ' + formatDuration(-fsm.currentTime) :
                            formatDuration(fsm.timeLeft)}
                    </h1>
                    <SessionMonitor preparing={preparing} onMotion={this.handleMotionUpdate} />
                </>;

            case 'finished':
                return <ReportCard report={fsm.report()} showMessage={true} />;

            default:
                return null;
        }
    }

    setUpCustom = () => this.setState({ setupScreen: 'custom' });
    viewReport = () => this.setState({ setupScreen: 'report' });
    loadPreset = () => this.setState({ setupScreen: 'preset' });
    returnToWelcomeScreen = () => this.setState({ setupScreen: 'default' });

    handleFsmUpdate = () => {
        this.forceUpdate();
    }

    handleMotionUpdate = (magnitude: number) => this.fsm.handleMotionUpdate(magnitude);
}

export default App;
