// Generate the public guides from the same stage rules used during a session.
const fs = require('fs');
const os = require('os');
const path = require('path');
const ts = require('typescript');
const escape = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const base = require('../package.json').homepage;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ct-guides-'));
try {
    for (const name of ['challenges', 'strict', 'duties', 'time']) {
        const source = fs.readFileSync(path.join('src', name + '.ts'), 'utf8');
        const js = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017}});
        fs.writeFileSync(path.join(dir, name + '.js'), js.outputText);
    }
    const { courses, instruction, target } = require(path.join(dir, 'challenges'));
    const { duties } = require(path.join(dir, 'duties'));
    const { durationLabel } = require(path.join(dir, 'time'));
    const groups = [...new Set(courses.map(c => c.group))];
    const urls = [base];
    fs.mkdirSync('public/guides', {recursive:true});
    for (const group of groups) {
        const file = group.toLowerCase() + '.html';
        const url = base + 'guides/' + file;
        urls.push(url);
        const selected = courses.filter(c => c.group === group);
        const title = group + ' Challenge Guide | Corner Time';
        const description = 'Explore ' + selected.length + ' ' + group.toLowerCase() + ' challenges, including strict courses. See stage targets, hold times and sensor requirements.';
        const dutyList = duties.filter(d => d.group === group).map(d =>
            '<li><a href="../index.html#challenge=' + d.id + '">' + escape(d.name) + '</a> · ' + durationLabel(target(d)) + ' on Standard</li>').join('');
        const contents = selected.map(c => {
            const stages = c.stages.map(s => '<li>' + escape(instruction(s.rule)) + ' Hold for ' + s.seconds + (s.streak ? ' consecutive' : ' total') + ' seconds.</li>').join('');
            return '<article id="' + c.id + '"><h3>' + escape(c.name) + '</h3><p>' + escape(c.brief) + '</p>' +
                (c.strict ? '<p><strong>Strict course.</strong> Every reading must qualify. A miss, pause or gap resets the current hold.</p>' : '') +
                '<ol>' + stages + '</ol><a href="../index.html#challenge=' + c.id + '">Open ' + escape(c.name) + ' in the studio</a></article>';
        }).join('\n');
        fs.writeFileSync('public/guides/' + file, '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + title +
            '</title><meta name="description" content="' + escape(description) + '"><link rel="canonical" href="' + url + '"><link rel="stylesheet" href="./guide.css"></head><body><main><a href="../index.html">← All activities</a><h1>' +
            group + ' challenges</h1><p>' + description + '</p><nav aria-label="Challenge categories">' +
            groups.map(g => '<a href="./' + g.toLowerCase() + '.html"' + (g === group ? ' aria-current="page"' : '') + '>' + g + '</a>').join(' ') + '</nav><h2>Timed duties</h2><p>Serve the hold. The first incident brings a warning and later incidents can add time.</p><ul>' + dutyList + '</ul><h2>Optional practice challenges</h2>' + contents + '</main></body></html>');
    }
    fs.writeFileSync('public/sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        urls.map(u => '  <url><loc>' + escape(u) + '</loc></url>').join('\n') + '\n</urlset>\n');
} finally {
    for (const file of fs.readdirSync(dir)) { fs.unlinkSync(path.join(dir,file)); }
    fs.rmdirSync(dir);
}
