import * as React from 'react';
import App from './App';
import {readLocal, saveLocal} from '../storage';

const modes=['System','Light','Dark'];
const palettes=['Forest','Ocean','Plum'];
interface Appearance {mode:string; palette:string;}
const initial:Appearance={mode:'system',palette:'forest'};
function preference() {
    const saved=readLocal('appearance',initial);
    return {mode:modes.some(m=>m.toLowerCase()===saved.mode)?saved.mode:initial.mode,
        palette:palettes.some(p=>p.toLowerCase()===saved.palette)?saved.palette:initial.palette};
}
export default function Workspace(){
    const [appearance,setAppearance]=React.useState(preference);
    const [showAppearance,setShowAppearance]=React.useState(false);
    React.useEffect(()=>{
        document.documentElement.dataset.mode=appearance.mode;
        document.documentElement.dataset.palette=appearance.palette;
        saveLocal('appearance',appearance);
    },[appearance]);
    function change(patch:Partial<Appearance>){setAppearance(prev=>({...prev,...patch}));}
    return <>
        <div className="workspace-tools"><div className="tool-switches">
            <button aria-expanded={showAppearance} onClick={()=>setShowAppearance(!showAppearance)}>Appearance</button>
        </div>
        {showAppearance && <section aria-label="Appearance" className="preferences">
            <label>Mode <select value={appearance.mode} onChange={e=>change({mode:e.target.value})}>{modes.map(v=><option value={v.toLowerCase()} key={v}>{v}</option>)}</select></label>
            <label>Color theme <select value={appearance.palette} onChange={e=>change({palette:e.target.value})}>{palettes.map(v=><option value={v.toLowerCase()} key={v}>{v}</option>)}</select></label>
        </section>}
</div>
        <App/>
        <footer className="site-footer"><span>Made with <span role="img" aria-label="love">❤️</span> by Aishik Dutta © 2026</span><a href="https://github.com/img2vid/cornertime">Source code ↗</a></footer>
    </>;
}
