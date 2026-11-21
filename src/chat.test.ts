import {messages,suggestion} from './chat';

it('passes real conversational turns and the active page to the model',()=>{
    const turns=messages([{from:'You',text:'Write a poem about a crane.'},{from:'Assistant',text:'A crane spreads silver wings.'}],'Translate that into French.','Chain challenge');
    expect(turns.map(t=>t.role)).toEqual(['system','user','assistant','user']);
    expect(messages([], 'Open the chain challenge', 'Chain challenge')[0].content).toContain('Chain challenge');
    expect(turns[2].content).toContain('silver wings');
});
it('extracts an explicit final action separately from conversational output',()=>{
    expect(suggestion('Shall we begin?\nACTION: open chain challenge')).toBe('open chain challenge');
    expect(suggestion('A poem about the word ACTION: is possible.')).toBe('');
});
