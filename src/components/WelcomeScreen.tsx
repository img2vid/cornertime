import * as React from 'react';
import PunishmentStateMachine from '../state';
import ClassicDuration from './ClassicDuration';
import StudioHeader from './StudioHeader';

const sections = [
    {title:'On-device activities', links:[
        ['school','School penalties','Type or tap a set of entries each minute.'],
        ['continuous','Continuous typing','Copy or transform lines at a steady pace.']
    ]},
    {title:'Monitored activities', links:[
        ['duties','Traditional duties','Serve timed holds with movement, position or sound checks.'],
        ['practice','Practice challenges','Try shorter sensor challenges and track your results.'],
        ['chain','Chain challenge','Alternate monitored Classic sessions with a randomized set of typing duties.']
    ]}
];

export default function WelcomeScreen({fsm}: {fsm:PunishmentStateMachine}) {
    return <main className="studio home"><StudioHeader/>
        <div className="studio-title"><h1>Session studio</h1></div>
        <section id="classic" className="classic-panel">
            <div><h2>Classic corner time</h2><p>Set a timer for a single monitored session.</p></div>
            <ClassicDuration fsm={fsm}/>
            <button className="quick-start" onClick={()=>fsm.getReady()}>Start 10–15 minute session</button>
        </section>
        {sections.map(section=><section className="directory" key={section.title}><h2>{section.title}</h2>
            <div className="mode-grid">{section.links.map(([id,name,description])=><a href={'#'+id} key={id}>
                <strong>{name}</strong><span>{description}</span><b aria-hidden="true"/></a>)}</div>
        </section>)}
        <aside className="resources">
            <section><h2>Classic tools</h2><nav aria-label="Classic tools"><a href="#custom">Design preset</a><a href="#preset">Import preset</a><a href="#report">View report</a></nav></section>
            <section><h2>Challenge guides</h2><nav aria-label="Challenge guides">
                {['Movement','Position','Sound','Mixed'].map(group=><a key={group} href={'./guides/'+group.toLowerCase()+'.html'}>{group}</a>)}
            </nav></section>
        </aside>
        <footer>Camera and microphone processing stays on this device. <a href="https://github.com/img2vid/cornertime">Source code ↗</a></footer>
    </main>;
}
