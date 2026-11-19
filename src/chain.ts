import { randomInteger } from './random';

export const typingTasks = [
    {name:'Continuous lines', tip:'Copy each line exactly.', lines:['I will complete this line with care.','I will keep a steady typing pace.']},
    {name:'Numbered register',tip:'Include the number and punctuation.',lines:['Entry received.','Entry acknowledged.']},
    {name:'Case changes',tip:'Match upper and lower case.',lines:['Quiet | QUIET | quiet','Steady | STEADY | steady']},
    {name:'Punctuation copies',tip:'Match each mark and space.',lines:['Read, pause; proceed.','Ready? Yes. Continue!']},
    {name:'Alternating refrain',tip:'Follow the changing refrain.',lines:['One line at a time.','One word at a time.','One letter at a time.']},
    {name:'Reverse order',tip:'Type the displayed words in reverse order.',lines:['one two three four','read check enter','red green blue']},
    {name:'Paired brackets',tip:'Include the matching brackets and spaces.',lines:['[ stay steady ] ( continue )','( line checked ) [ ready ]']},
    {name:'Alternating capitals',tip:'Type the displayed words in uppercase.',lines:['quiet and steady','ready to continue','keep typing']},
    {name:'Separator changes',tip:'Use the separators shown.',lines:['left / centre / right','left : centre : right','left - centre - right']},
    {name:'Mirrored register',tip:'Copy the complete mirrored sequence.',lines:['A B C | C B A','1 2 3 | 3 2 1','up down | down up']},
    {name:'Double-space copies',tip:'Preserve the two spaces between each pair.',lines:['line  by  line','slow  and  steady']},
    {name:'Serial receipt',tip:'Include the changing receipt number.',lines:['Time entered.','Record checked.','Receipt closed.']}
];
export function typingLine(task:number,index:number) {
    const spec=typingTasks[task];
    const cue=spec.lines[index%spec.lines.length];
    let target=cue;
    if (task===5) { target=cue.split(' ').reverse().join(' '); }
    if (task===7) { target=cue.toUpperCase(); }
    if (task===1 || task===11) { target=String(index+1).padStart(task===1?3:4,'0')+'. '+cue; }
    return {cue:task===5 || task===7 ? cue : target,target};
}

export interface Leg { group:number; task:number; seconds:number; } // task -1 is Classic; seconds includes preparation.
export const presets=Array.from({length:10},(_,i)=>({level:i+1,groups:(i+1)*3,seconds:(i+1)*3600}));
export function schedule(level:number,count:number):Leg[] {
    if (!Number.isInteger(level) || level<1 || level>10 || !Number.isInteger(count) || count<3 || count>30) {
        throw new Error('Choose a preset and 3–30 combinations.');
    }
    let remaining=presets[level-1].seconds;
    const legs:Leg[]=[];
    for(let group=1;group<=count;group++) {
        const budget=Math.floor(remaining/(count-group+1));
        remaining-=budget;
        const classic=randomInteger(Math.ceil(budget*.24),Math.floor(budget*.50)+1);
        legs.push({group,task:-1,seconds:classic});
        let typing=budget-classic;
        const pool=typingTasks.map((_,i)=>i);
        const parts=randomInteger(2,level<4?4:level<8?5:6);
        for(let i=0;i<parts;i++){
            const average=Math.floor(typing/(parts-i));
            const seconds=i===parts-1?typing:randomInteger(Math.ceil(average*.7),Math.floor(average*1.3)+1);
            typing-=seconds;
            legs.push({group,task:pool.splice(randomInteger(0,pool.length),1)[0],seconds});
        }
    }
    return legs;
}

export function classicMinutes(a:string,b:string) {
    const min=Number(a), max=Number(b);
    if (!/^\d+$/.test(a) || !/^\d+$/.test(b) || !Number.isSafeInteger(min) || !Number.isSafeInteger(max*60) || min<1 || max<min) {return null;}
    return randomInteger(min,max+1);
}
