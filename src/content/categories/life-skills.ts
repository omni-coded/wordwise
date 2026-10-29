import { defineCategory } from '../author';

export default defineCategory({
  id: 'life-skills',
  name: 'Life Skills & Relationships',
  shortName: 'Life Skills',
  blurb: 'Consent, boundaries, emotional intelligence, and clear communication at home and at work.',
  glyph: '❖',
  references: [
    'APA Dictionary of Psychology (dictionary.apa.org)',
    'Goleman, D. — Emotional Intelligence (1995)',
    'The Gottman Institute research summaries (gottman.com)',
    'Harvard Program on Negotiation (pon.harvard.edu)',
  ],
  topics: [
    {
      id: 'relationships',
      name: 'Consent & Healthy Relationships',
      connection:
        'Consent and autonomy are the foundation: people decide about their own bodies, time, and choices. A boundary states those limits and assertiveness is how you voice them. Coercion and gaslighting undermine free choice, while reciprocity and vulnerability sustain trust and codependency and stonewalling erode it.',
      rows: [
        ['Consent', 'kun-SENT', 2, 'Clear, voluntary agreement to take part in something, given by someone able to decide and free to say no.', 'Consent can be withdrawn at any point, even after an activity has begun.', 'Health educators often summarize it as freely given, reversible, informed, enthusiastic, and specific.', 'Respecting it is the basis of ethical relationships, medical care, and workplace conduct.'],
        ['Boundary', 'BOWN-duh-ree', 2, 'A limit a person sets to protect their time, energy, body, or emotional wellbeing.', 'Not answering work messages on weekends is a boundary that protects rest.', 'Limits can be physical, emotional, digital, or time-based, and they describe what you will do, not what others must do.', 'Stating limits early and calmly prevents resentment and shows others how to treat you.'],
        ['Assertiveness', 'uh-SUR-tiv-nes', 3, 'Expressing your needs and views directly and respectfully, without giving in or attacking.', 'Assertiveness sounds like “I disagree, and here is why” rather than silence or shouting.', 'Communication teachers commonly place it between passive and aggressive styles.', 'It lets you protect your interests while keeping relationships intact.'],
        ['Autonomy', 'aw-TON-uh-mee', 3, 'The capacity to make your own informed choices about your life and body.', 'Respect for patient autonomy means doctors explain the options and let patients decide.', 'The word comes from Greek roots meaning “self-law,” and it is a core principle of modern medical ethics.', 'Honoring it is central to consent, healthcare, and healthy partnerships.'],
        ['Coercion', 'koh-UR-zhun', 3, 'Pressuring someone through threats, force, or manipulation to act against their will.', 'A choice made under coercion is not truly free, even if the person says yes.', 'In law and ethics, agreement obtained this way is generally not treated as valid consent.', 'Recognizing pressure tactics helps people protect themselves and others.'],
        ['Gaslighting', 'GAS-lyt-ing', 3, 'Manipulating someone so that they doubt their own memory, perception, or judgment.', 'Insisting “that never happened” to make a partner distrust their memory is gaslighting.', 'The term comes from the 1938 play Gas Light, in which a husband secretly dims the lights and denies it.', 'Naming the pattern helps people trust their perceptions and seek an outside view.'],
        ['Codependency', 'koh-dih-PEN-den-see', 4, 'A pattern in which a person’s sense of worth depends on meeting another’s needs, often at their own expense.', 'Always rescuing a partner from the consequences of their choices can be a sign of codependency.', 'The idea grew out of addiction-treatment circles in the 1970s and 1980s and is not a formal diagnosis.', 'Noticing the pattern helps people build balanced, mutual relationships.'],
        ['Reciprocity', 'res-ih-PROS-ih-tee', 3, 'A fair, mutual exchange in which both people give and receive support, effort, or kindness over time.', 'Friendships last when there is reciprocity, not just one person doing all the giving.', 'Anthropologists have found norms of mutual exchange in nearly every human society.', 'Balanced give-and-take builds trust and signals a healthy relationship.'],
        ['Stonewalling', 'STOHN-wawl-ing', 3, 'Shutting down and refusing to respond or engage during a disagreement.', 'Leaving the room without a word whenever conflict arises is stonewalling.', 'Researcher John Gottman listed it among four corrosive conflict patterns, alongside criticism, contempt, and defensiveness.', 'Taking a planned break and returning is healthier than going silent without explanation.'],
        ['Vulnerability', 'vul-nur-uh-BIL-ih-tee', 3, 'Willingness to show uncertainty, need, or feeling despite the risk of being hurt.', 'Sharing a worry with a friend takes vulnerability, and it often deepens trust.', 'Researcher Brené Brown has argued that openness, not perfection, builds connection.', 'Healthy closeness depends on showing real feelings at a pace that feels safe.'],
      ],
    },
    {
      id: 'emotional-intelligence',
      name: 'Emotional Intelligence',
      connection:
        'Self-awareness and self-regulation are the inward skills: noticing what you feel and choosing how to act. Granularity and alexithymia concern putting feelings into words, while empathy, validation, and compassion turn that awareness toward others. Equanimity helps you stay steady when catastrophizing or defensiveness take hold.',
      rows: [
        ['Self-awareness', 'self-uh-WAIR-nes', 3, 'The ability to notice and understand your own emotions, motives, and habits.', 'Self-awareness lets you notice irritation rising before you snap at a colleague.', 'Psychologist Daniel Goleman placed it first among the core skills of emotional intelligence.', 'You cannot manage what you do not notice, so it underpins every other people skill.'],
        ['Self-regulation', 'self-reg-yuh-LAY-shun', 3, 'The ability to manage your own emotions, impulses, and reactions so that they fit your goals.', 'Self-regulation means pausing for a breath before replying to an angry email.', 'Practices such as slow breathing and putting feelings into words are commonly used to dial down emotional intensity.', 'Managing reactions keeps small frustrations from becoming lasting damage.'],
        ['Empathy', 'EM-puh-thee', 2, 'The ability to understand and share another person’s feelings from their point of view.', 'Her empathy showed when she asked how he was coping instead of offering quick advice.', 'Psychologists distinguish cognitive empathy, understanding someone’s view, from affective empathy, feeling along with them.', 'It strengthens friendships, caregiving, teamwork, and leadership.'],
        ['Validation', 'val-ih-DAY-shun', 3, 'Acknowledging that someone’s feelings make sense given their situation, without necessarily agreeing with their actions.', 'Validation sounds like “That sounds really stressful” rather than “You shouldn’t feel that way.”', 'Psychologist Marsha Linehan made it a central skill in dialectical behavior therapy.', 'Feeling understood calms people and makes difficult conversations easier.'],
        ['Catastrophizing', 'kuh-TAS-truh-fy-zing', 4, 'Assuming the worst possible outcome and treating it as likely.', 'Catastrophizing turns one critical comment into “I’m going to be fired.”', 'Psychologist Albert Ellis used the term in the 1960s, and cognitive-behavioral therapy treats it as a common thinking trap.', 'Testing a feared outcome against the evidence reduces needless anxiety.'],
        ['Granularity', 'gran-yuh-LAIR-ih-tee', 4, 'The ability to tell similar feelings apart and name them precisely.', 'Emotional granularity lets you say you feel disappointed or embarrassed, not just bad.', 'Psychologist Lisa Feldman Barrett and colleagues have studied how finer emotion words relate to coping.', 'Precise names for feelings make them easier to understand and manage.'],
        ['Alexithymia', 'uh-lek-sih-THY-mee-uh', 4, 'Persistent difficulty identifying and describing your own emotions.', 'Someone with alexithymia may sense tension in the body yet struggle to say what they feel.', 'Psychiatrist Peter Sifneos introduced the term in the early 1970s, from Greek roots meaning “no words for emotion.”', 'Knowing it exists helps people and partners respond with patience and seek support when needed.'],
        ['Equanimity', 'ee-kwuh-NIM-ih-tee', 4, 'Mental calmness and evenness of temper, especially in difficult situations.', 'She faced the criticism with equanimity, listening before responding.', 'The word comes from the Latin aequanimitas, meaning “evenness of mind.”', 'A steady mind makes clearer decisions and resists impulsive reactions.'],
        ['Compassion', 'kum-PASH-un', 2, 'Concern for another’s suffering combined with a wish to help.', 'Compassion moves beyond sympathy by asking what would actually help.', 'The word comes from Latin roots meaning “to suffer with.”', 'It turns good intentions into helpful action in families, workplaces, and communities.'],
        ['Defensiveness', 'dih-FEN-siv-nes', 3, 'Reacting to feedback or criticism as an attack and responding by justifying, blaming, or withdrawing.', 'Defensiveness turns “the report had errors” into an argument about who is to blame.', 'It is a natural stress response, so it often appears before the person has fully taken in what was said.', 'Pausing to ask a clarifying question keeps conversations productive.'],
      ],
    },
    {
      id: 'workplace',
      name: 'Communication at Work',
      connection:
        'Feedback and candor keep work honest, accountability and transparency show who owns what, and diplomacy and mediation ease tension between people. Facilitation and retrospectives make meetings and teams more effective, while escalation and micromanagement show how decisions travel upward or get over-controlled.',
      rows: [
        ['Feedback', 'FEED-bak', 1, 'Information about how someone’s work or behavior is perceived, offered so they can improve.', 'Specific feedback such as “the summary was clear but lacked numbers” is more useful than “good job.”', 'Research on workplace learning suggests feedback tends to work best when it is specific, timely, and focused on the task rather than the person.', 'Giving and receiving it well speeds learning and stops small issues from growing.'],
        ['Candor', 'KAN-der', 3, 'Honest, direct communication delivered in a way that respects the other person.', 'Candor means telling a colleague the plan has a flaw, and offering to help fix it.', 'Executive coach Kim Scott popularized combining directness with personal care in her 2017 book Radical Candor.', 'Teams that speak honestly tend to catch problems earlier.'],
        ['Accountability', 'uh-kown-tuh-BIL-ih-tee', 3, 'Taking responsibility for your actions, decisions, and results, and being answerable for them.', 'Accountability means admitting a missed deadline and presenting a plan to recover.', 'The RACI chart used in project management names one accountable person for each task.', 'Clear ownership builds trust and keeps teams from pointing fingers.'],
        ['Facilitation', 'fuh-sil-ih-TAY-shun', 3, 'Guiding a group discussion so that everyone can contribute and the group reaches its goal.', 'Good facilitation keeps a meeting on topic and draws out quieter voices.', 'The word comes from the Latin facilis, meaning “easy,” because a facilitator makes the group’s work easier.', 'Well-run discussions produce better decisions and shorter meetings.'],
        ['Micromanagement', 'my-kroh-MAN-ij-ment', 3, 'Controlling the details of other people’s work too closely instead of trusting them with results.', 'Checking every email an employee sends is micromanagement.', 'The term combines the prefix micro-, from the Greek for “small,” with management.', 'Recognizing it helps managers delegate and helps employees ask for room to work.'],
        ['Escalation', 'es-kuh-LAY-shun', 2, 'Raising an issue to a higher level of authority when it cannot be resolved where it is.', 'After two weeks without a reply from the vendor, she turned to escalation and brought in her director.', 'Many companies define clear escalation paths so that urgent problems reach decision-makers quickly.', 'Knowing when to raise a problem prevents delays and surprises.'],
        ['Diplomacy', 'dih-PLOH-muh-see', 3, 'Handling sensitive situations with tact so that relationships stay intact.', 'Diplomacy turns “that idea won’t work” into “I see a risk here; can we explore another approach?”', 'The word traces back to the Greek diploma, a folded document, which referred to official papers carried by envoys.', 'Tact lets you disagree without damaging trust.'],
        ['Mediation', 'mee-dee-AY-shun', 3, 'A process in which a neutral third party helps disputing sides reach their own agreement.', 'The two managers agreed to mediation with an HR specialist instead of letting the conflict grow.', 'Unlike a judge or arbitrator, a mediator has no power to impose a decision.', 'It often resolves disputes faster and at lower cost than formal proceedings while preserving relationships.'],
        ['Retrospective', 'ret-roh-SPEK-tiv', 3, 'A structured team meeting held to reflect on what went well, what did not, and what to change.', 'After the launch, the team held a retrospective and agreed to shorten its review cycle.', 'The practice is a regular part of agile software development, where teams hold one after each work cycle.', 'Regular reflection turns mistakes into improvements.'],
        ['Transparency', 'trans-PAIR-un-see', 3, 'Openness about information, decisions, and the reasons behind them.', 'Transparency about budget cuts helped employees trust the company during a hard year.', 'The word comes from Latin roots meaning “to appear through.”', 'Explaining the reasoning behind a decision, not just the outcome, helps people trust and support it.'],
      ],
    },
  ],
});
