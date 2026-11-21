export interface Turn {from:string; text:string;}
export interface Message {role:'system'|'user'|'assistant'; content:string;}

export function messages(history:Turn[], question:string, screen:string):Message[]{
    const instructions='You are a helpful assistant. Answer the latest question directly, using the conversation above when relevant.';
    const siteQuestion=/\b(timer|activities|activity|chain|website|screen|page|click|open|navigate|take me|theme|mode|session|preset|school penalt|typing|corner time|cornertime|command|control|button|field|start|pause|resume)\b/i.test(question);
    const system=siteQuestion ? instructions+' '+
        'For requests to operate the website, suggest one command on its own final line starting with ACTION: . '+
        'Commands include open chain challenge, open school penalties, open continuous typing, open classic timer, open home, start a 5-minute timer, switch to dark mode, click CONTROL, and set FIELD to VALUE. '+
        'The user can apply your suggestion. Never claim you have performed an action. For other questions, give a normal answer without an action. '+
        'Site facts: Chain combines Classic timers and typing. Preset 1 assigns one hour. Each combination starts with Classic. Continuous typing earns time between correct keys up to five seconds apart. '+
        'Current screen: '+screen.slice(0,850) : instructions;
    const recent:Message[]=[];
    let budget=4400;
    // Keep complete recent exchanges so a follow-up keeps its immediate context.
    for(let i=history.length-1;i>0;i-=2){
        const reply=history[i], user=history[i-1];
        if(reply.from!=='Assistant' || user.from!=='You'){break;}
        const size=reply.text.length+user.text.length;
        if(size>budget){if(!recent.length){recent.unshift({role:'user',content:user.text.slice(0,1300)},{role:'assistant',content:reply.text.slice(-2400)});}break;}
        recent.unshift({role:'user',content:user.text},{role:'assistant',content:reply.text});budget-=size;
    }
    return [{role:'system',content:system},...recent,{role:'user',content:question}];
}
export function suggestion(answer:string){
    const found=answer.match(/(?:^|\n)\s*ACTION:\s*([^\n]{1,180})\s*$/i);
    return found ? found[1].trim() : '';
}
