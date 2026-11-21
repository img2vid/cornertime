import * as React from 'react';
import { classicMinutes } from '../chain';
import { defaultPreset } from '../models';
import PunishmentStateMachine from '../state';

export default class ClassicDuration extends React.Component<{fsm:PunishmentStateMachine}> {
    state={mode:'fixed',fixed:'30',from:'10',to:'15',error:''};
    private start=(e:React.FormEvent)=>{
        e.preventDefault();
        const s=this.state;
        const minutes=s.mode==='fixed'?classicMinutes(s.fixed,s.fixed):classicMinutes(s.from,s.to);
        this.launch(minutes);
    }
    private launch=(minutes:number|null)=>{
        if(minutes===null){this.setState({error:'Enter positive whole minutes. The ending value must be at least the starting value.'});return;}
        const seconds=minutes*60;
        this.props.fsm.loadPreset({...defaultPreset,durationRange:{minimum:seconds,maximum:seconds}});
        this.props.fsm.getReady();
    }
    render(){
        const s=this.state;
        return <form className="classic-duration" onSubmit={this.start}><label>Classic duration <select value={s.mode}
            onChange={e=>this.setState({mode:e.target.value,error:''})}><option value="fixed">Fixed duration</option><option value="range">Random duration</option></select></label>
            {s.mode==='fixed'?<label>Minutes <input type="number" min="1" step="1" required value={s.fixed} onChange={e=>this.setState({fixed:e.target.value})}/></label>:
            <><label>From (minutes) <input type="number" min="1" step="1" required value={s.from} onChange={e=>this.setState({from:e.target.value})}/></label>
            <label>To (minutes) <input type="number" min="1" step="1" required value={s.to} onChange={e=>this.setState({to:e.target.value})}/></label></>}
            <button>Start Classic session</button>{s.error && <p role="alert">{s.error}</p>}</form>;
    }
}
