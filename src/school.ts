// The same step descriptions drive the catalogue, learner instructions and checks.
export type Step =
    { kind: 'answer'; prompt: string; answers: string[] } |
    { kind: 'write'; prompt: string; words: number } |
    { kind: 'confirm'; prompt: string } |
    { kind: 'timer'; prompt: string; seconds: number };
export interface Assignment { id: string; name: string; group: string; steps: Step[]; }
const answer = (prompt: string, ...answers: string[]): Step => ({kind:'answer', prompt, answers});
const write = (prompt: string, words = 10): Step => ({kind:'write', prompt, words});
const confirm = (prompt: string): Step => ({kind:'confirm', prompt});
const timer = (prompt: string, minutes: number): Step => ({kind:'timer', prompt, seconds:minutes * 60});
const task = (id: string, name: string, group: string, ...steps: Step[]): Assignment => ({id,name,group,steps});
const copy = (line: string) => answer('Copy exactly: ' + line, line);

export const schoolTasks = [
    task('lines','Assigned lines','Written work', ...Array.from({length:5}, () => copy('I will have my work ready when class begins.'))),
    task('copybook','Copybook passage','Written work', copy('A careful reader takes time to notice details.'),copy('A careful writer leaves time to check the page.'),copy('Both habits grow with practice.')),
    task('handwriting','Handwriting practice','Written work',confirm('On paper, write the alphabet once in lowercase and once in uppercase.'),confirm('Rewrite the five least legible letters three times each.'),confirm('Read both rows and check letter shapes and spacing.')),
    task('board-notes','Missed board notes','Written work',confirm('Choose a missed lesson and open the class notes.'),write('Enter the lesson heading and three key points.',15),write('Explain one point in your own words.')),
    task('outline','Chapter outline','Written work',write('Name a chapter and list three section headings.',6),write('Write one key idea under each heading.',15)),
    task('summary','Reading summary','Written work',confirm('Read a page from your assigned text.'),write('Summarize its main idea and two supporting details.',25)),

    task('spelling','Spelling corrections','Corrections',answer('Correct “recieve”.','receive'),answer('Correct “seperate”.','separate'),answer('Correct “definately”.','definitely')),
    task('punctuation','Punctuation repair','Corrections',answer('Add the missing punctuation: Where is my notebook','Where is my notebook?'),answer('Add the comma and full stop: After lunch we read','After lunch, we read.')),
    task('capitals','Capital letter corrections','Corrections',answer('Correct the capitals: delhi is in india.','Delhi is in India.'),answer('Correct the capitals: we study english on monday.','We study English on Monday.')),
    task('grammar','Grammar corrections','Corrections',answer('Fix the verb: She walk to school.','She walks to school.'),answer('Fix the verb: The boys was ready.','The boys were ready.')),
    task('proof','Proofreading duty','Corrections',answer('Remove the repeated word: We read the the book.','We read the book.'),answer('Correct both errors: i packed my pencill.','I packed my pencil.')),
    task('redo','Redo a marked problem','Corrections',write('Describe the original question and your mistake.'),write('Work out a corrected answer and explain the change.',15),confirm('Check the new answer against your notes or answer key.')),

    task('tables','Multiplication tables','Extra exercises',answer('7 × 6 =','42'),answer('8 × 7 =','56'),answer('9 × 8 =','72'),answer('12 × 9 =','108')),
    task('division','Division drill','Extra exercises',answer('72 ÷ 8 =','9'),answer('84 ÷ 7 =','12'),answer('96 ÷ 6 =','16')),
    task('fractions','Fraction reduction','Extra exercises',answer('Reduce 6/8 to lowest terms.','3/4'),answer('Reduce 15/25 to lowest terms.','3/5'),answer('Reduce 18/24 to lowest terms.','3/4')),
    task('units','Unit conversion sheet','Extra exercises',answer('How many centimetres are in 3 metres? Enter a number.','300'),answer('How many minutes are in 2.5 hours?','150'),answer('How many grams are in 1.25 kilograms?','1250')),
    task('alphabetize','Alphabetical filing','Extra exercises',answer('Put these words in order, separated by commas: pear, plum, peach','peach, pear, plum','peach,pear,plum'),answer('Do the same: chalk, chart, chair','chair, chalk, chart','chair,chalk,chart')),
    task('vocab','Vocabulary notebook','Extra exercises',write('Choose a word from class. Give its meaning in your own words.'),write('Use the word in a new sentence that shows its meaning.',8)),

    task('reflection','Reflection sheet','Reflection',write('Describe what happened using observable facts.'),write('What would you do differently if it happened again?')),
    task('rule','Rule explanation','Reflection',write('Choose a classroom rule and explain who it helps.'),write('Give an example of following that rule in class.')),
    task('letter','Private apology draft','Reflection',write('Draft a short apology describing the action and its effect.',15),write('Add a realistic way to put things right.',8)),
    task('plan','Behaviour improvement plan','Reflection',write('Choose one behaviour and name a cue that will remind you to act.'),write('Describe how you will check your progress after the next lesson.')),
    task('punctuality','Punctuality worksheet','Reflection',write('List the steps between waking up and arriving at school.'),write('Identify a delay and a specific change to your routine.')),
    task('homework','Missing homework plan','Reflection',write('List the unfinished work, materials and deadline.',8),write('Break the work into three steps and give each a time.')),

    task('desk','Desk duty','Classroom service',confirm('Clear your own work surface and sort the items.'),confirm('Return supplies to their places and recycle your scraps.'),confirm('Set out the materials for your next lesson.')),
    task('board','Board duty','Classroom service',confirm('Check which part of the board may be erased.'),confirm('Erase that area with the board eraser.'),confirm('Return the eraser and arrange the writing tools.')),
    task('shelf','Bookshelf duty','Classroom service',confirm('Choose a shelf you may organize and check its ordering system.'),confirm('Place misplaced books in the correct order.'),confirm('Read across the spines and check the sequence.')),
    task('supplies','Supply inventory','Classroom service',confirm('Choose a set of shared supplies you may count.'),write('Record each item and quantity.',3),confirm('Check the totals and return the items to their containers.')),
    task('papers','Worksheet sorting','Classroom service',confirm('Gather the blank worksheets you may organize.'),confirm('Separate them by lesson and arrange each set in page order.'),confirm('Count the sets and label the piles.')),
    task('station','Learning station reset','Classroom service',confirm('Check the station instructions and identify the materials it needs.'),confirm('Put reusable pieces back into their marked places.'),confirm('Check that the next learner has a complete set.')),

    task('detention','Seated study detention','Study periods',write('Name the work you will complete during detention.',5),timer('Work quietly on the chosen assignment.',30),write('Record what you completed and what remains.',8)),
    task('silent-reading','Silent reading period','Study periods',timer('Read a chosen school text quietly.',15),write('Record the pages and one idea worth remembering.',10)),
    task('catchup','Homework catch-up','Study periods',write('Identify one overdue exercise.',4),timer('Work through the overdue exercise.',20),confirm('Review the work and mark where to resume or submit it.')),
    task('revision','Lesson revision','Study periods',timer('Review the notes from one lesson.',10),write('Close the notes and recall three key points.',12)),
    task('recitation','Recitation practice','Study periods',confirm('Select a short passage and read it aloud once.'),timer('Practise the passage in small sections.',5),confirm('Recite it from memory and compare with the text.')),
    task('recall','Closed-book recall','Study periods',timer('Study a diagram, map or list from the lesson.',5),write('Close the source and write what you remember.',15),confirm('Reopen the source and mark omissions in your notes.'))
];

export function accepts(step: Step, input: string, checked: boolean, elapsed: number): boolean {
    const text = input.trim().replace(/\s+/g,' ');
    switch (step.kind) {
        case 'answer': return step.answers.includes(text);
        case 'write': return text !== '' && text.split(' ').length >= step.words;
        case 'confirm': return checked;
        case 'timer': return elapsed >= step.seconds;
    }
}
