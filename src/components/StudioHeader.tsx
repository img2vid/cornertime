import * as React from 'react';

export default function StudioHeader({section}: {section?:string}) {
    return <header className="mast">
        <a className="wordmark" href="#home"><i aria-hidden="true">◷</i>Corner Time</a>
        {section && <nav aria-label="Breadcrumb" className="trail"><a href="#home">All activities</a><span aria-hidden="true">/</span><span aria-current="page">{section}</span></nav>}
    </header>;
}
