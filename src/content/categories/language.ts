import { defineCategory } from '../author';

export default defineCategory({
  id: 'language',
  name: 'Literature & Language',
  shortName: 'Language',
  blurb: 'How words work, how stories are built, and how ideas are persuaded.',
  glyph: '¶',
  references: [
    'Merriam-Webster Dictionary (merriam-webster.com)',
    'Oxford English Dictionary (oed.com)',
    'Cambridge Dictionary (dictionary.cambridge.org)',
    'Purdue Online Writing Lab (owl.purdue.edu)',
  ],
  topics: [
    {
      id: 'grammar',
      name: 'How Language Works',
      connection:
        'Phonetics covers the sounds of speech, syllables and morphology build words from them, and syntax arranges words into sentences. Semantics and pragmatics explain how meaning arises, while the lexicon, dialects, idioms, and etymology show how vocabulary lives, varies, and changes.',
      rows: [
        ['Syntax', 'SIN-taks', 3, 'The rules for arranging words into well-formed sentences.', 'English syntax usually places the subject before the verb.', 'Noam Chomsky showed that a sentence can be perfectly grammatical in structure yet make no sense, separating form from meaning.', 'Understanding sentence structure improves clarity in writing and helps with learning other languages.'],
        ['Morphology', 'mor-FOL-uh-jee', 4, 'The study of how words are formed from smaller meaningful units such as roots, prefixes, and suffixes.', 'Morphology explains why unhappiness is built from un-, happy, and -ness.', 'The smallest meaningful unit of language is called a morpheme.', 'Knowing word parts helps decode unfamiliar vocabulary and spelling.'],
        ['Semantics', 'sih-MAN-tiks', 3, 'The study of meaning in language.', 'Semantics explains why big and large are interchangeable in some sentences but not in others.', 'In everyday speech, people dismiss a dispute as just semantics when it is only about the meanings of words.', 'Precise word meaning matters in law, contracts, science, and diplomacy.'],
        ['Phonetics', 'fuh-NET-iks', 3, 'The study of the physical sounds of human speech and how they are produced and perceived.', 'Phonetics uses a special alphabet to represent every sound in the world’s languages.', 'The International Phonetic Alphabet was first published in 1888.', 'It supports language teaching, speech therapy, and speech recognition technology.'],
        ['Etymology', 'et-ih-MOL-uh-jee', 3, 'The study of the origin of words and how their meanings have changed over time.', 'Etymology traces the word muscle back to a Latin word meaning little mouse.', 'The word itself comes from Greek roots meaning “true sense.”', 'Knowing origins makes vocabulary easier to remember and shows how cultures have interacted.'],
        ['Lexicon', 'LEK-sih-kon', 3, 'The vocabulary of a language, a person, or a field of knowledge.', 'New slang constantly enters the lexicon, while older terms fade away.', 'Estimates of the size of the English vocabulary run to hundreds of thousands of words, depending on how one counts.', 'A rich vocabulary allows more precise thinking and expression.'],
        ['Dialect', 'DY-uh-lekt', 2, 'A regional or social variety of a language with its own vocabulary, grammar, or pronunciation.', 'Each dialect of Spanish has its own favorite words and accents.', 'Linguists treat every dialect as a rule-governed system, not a corrupted form of a standard language.', 'Respecting variation supports inclusion and clearer communication.'],
        ['Syllable', 'SIL-uh-bul', 1, 'A unit of pronunciation that has one vowel sound, with or without surrounding consonants.', 'The word banana has three syllables.', 'English haiku are often taught as lines of five, seven, and five syllables, though the Japanese form counts sound units differently.', 'Counting syllables helps with poetry, rhythm, and pronunciation.'],
        ['Pragmatics', 'prag-MAT-iks', 4, 'The study of how context shapes the meaning of language in real situations.', 'Pragmatics explains why “Can you pass the salt?” is understood as a request, not a question about ability.', 'Philosopher H. P. Grice described conversational rules, such as being relevant and truthful, that listeners assume speakers follow.', 'Misreading tone and implication is a common source of workplace and cross-cultural misunderstandings.'],
        ['Idiom', 'ID-ee-um', 2, 'An expression whose meaning cannot be understood from the literal meanings of its words.', 'Saying someone kicked the bucket is an idiom that means they died.', 'These phrases are among the hardest parts of a new language because they must be learned as wholes.', 'Knowing them makes native speech easier to follow and your own writing livelier.'],
      ],
    },
    {
      id: 'literary-devices',
      name: 'Literary Devices',
      connection:
        'A protagonist drives the story, motifs and foreshadowing weave themes through it, and soliloquies reveal inner thoughts. Metaphor, hyperbole, and alliteration decorate language, while irony, satire, and allegory use indirection to say more than they appear to.',
      rows: [
        ['Allegory', 'AL-uh-gor-ee', 3, 'A story in which characters and events symbolize deeper moral, political, or spiritual ideas.', 'Orwell’s Animal Farm is an allegory of the Russian Revolution and the Soviet Union that followed.', 'Plato’s cave, in which prisoners mistake shadows for reality, is one of philosophy’s best-known allegories.', 'Recognizing this device reveals the ideas hiding beneath a narrative.'],
        ['Irony', 'EYE-ruh-nee', 3, 'A contrast between what is said or expected and what actually happens or is meant.', 'It is an irony that the fire station burned down.', 'Verbal, situational, and dramatic irony are the three types most commonly taught.', 'Spotting it helps in understanding tone in literature, humor, and everyday conversation.'],
        ['Alliteration', 'uh-lit-uh-RAY-shun', 3, 'The repetition of the same initial consonant sound in nearby words.', 'Brands such as Coca-Cola and Krispy Kreme use alliteration because it is memorable.', 'Tongue twisters rely heavily on this device.', 'Writers use it to create rhythm, emphasis, and memorability.'],
        ['Hyperbole', 'hy-PUR-buh-lee', 3, 'Deliberate exaggeration used for emphasis or effect, not meant literally.', 'Saying you have told someone a million times is hyperbole.', 'The word comes from Greek roots meaning “overshooting.”', 'It is a staple of advertising, humor, and persuasion.'],
        ['Foreshadowing', 'for-SHAD-oh-ing', 3, 'A hint early in a story about what will happen later.', 'The ominous storm clouds in the first chapter were foreshadowing of the tragedy to come.', 'Chekhov’s gun is a related principle: every element in a story should serve a purpose.', 'Noticing it deepens rereading and appreciation of craft.'],
        ['Satire', 'SAT-eye-er', 3, 'The use of humor, irony, or exaggeration to criticize people, institutions, or society.', 'The newspaper column used satire to mock a politician’s empty promises.', 'Jonathan Swift’s 1729 essay A Modest Proposal is a famous example, using shock to draw attention to poverty in Ireland.', 'It is a powerful tool for holding power to account, and it relies on readers recognizing its target.'],
        ['Soliloquy', 'suh-LIL-uh-kwee', 4, 'A speech in which a character alone on stage speaks their thoughts aloud to the audience.', 'The soliloquy lets the audience hear what a character will not say to anyone else.', 'The soliloquies in Shakespeare’s Hamlet are among the most famous in drama.', 'It gives playwrights a direct way to reveal inner conflict.'],
        ['Protagonist', 'proh-TAG-uh-nist', 3, 'The main character in a story, around whom the plot revolves.', 'In many novels, the protagonist must overcome an obstacle to reach a goal.', 'The word comes from the Greek protagonistes, the first actor in an ancient play.', 'Identifying the central character helps readers follow a story’s main conflict.'],
        ['Motif', 'moh-TEEF', 3, 'A recurring element, such as an image, sound, or idea, that develops a story’s theme.', 'Water appears as a motif of renewal throughout the novel.', 'Composers use the same term for a short musical idea that returns throughout a piece.', 'Tracking recurring elements shows how authors build meaning through repetition.'],
        ['Metaphor', 'MET-uh-for', 2, 'A figure of speech that describes one thing as if it were another to suggest a likeness.', 'Calling time a thief is a metaphor that suggests it steals our days.', 'Linguists George Lakoff and Mark Johnson argued in 1980 that metaphors shape everyday thought, not just poetry.', 'It makes abstract ideas concrete and strongly influences persuasion.'],
      ],
    },
    {
      id: 'communication',
      name: 'Rhetoric & Expression',
      connection:
        'Rhetoric and persuasion are the craft of influencing others, narrative and vernacular make messages relatable, and nuance and connotation make them precise. Jargon and euphemism show how language can obscure as well as clarify, and paraphrasing and plagiarism raise the ethics of using other people’s ideas.',
      rows: [
        ['Rhetoric', 'RET-er-ik', 3, 'The art of effective or persuasive speaking and writing.', 'Aristotle’s Rhetoric identifies three appeals: ethos, pathos, and logos.', 'Ethos appeals to credibility, pathos to emotion, and logos to logic.', 'Understanding the craft helps you build arguments and recognize manipulation.'],
        ['Persuasion', 'per-SWAY-zhun', 2, 'The process of convincing others to believe or do something.', 'Effective persuasion usually combines solid evidence with an appeal to what the audience values.', 'Psychologist Robert Cialdini identified principles including reciprocity, social proof, and scarcity.', 'Knowing the principles helps you communicate well and resist undue influence.'],
        ['Narrative', 'NAIR-uh-tiv', 2, 'An account of connected events, either spoken or written; a story.', 'A clear narrative makes a business pitch more memorable than a list of statistics.', 'People often remember information better when it is presented in story form.', 'Stories help people understand, remember, and care about information.'],
        ['Jargon', 'JAR-gun', 2, 'Specialized vocabulary used by a profession or group that outsiders may find hard to understand.', 'The report was so full of jargon that clients struggled to follow it.', 'It can be a useful shorthand among experts, but it excludes everyone else.', 'Writing without unnecessary specialist terms makes ideas accessible to wider audiences.'],
        ['Paraphrase', 'PAIR-uh-frayz', 2, 'To restate someone else’s meaning in different words.', 'Learning to paraphrase a source helps you explain ideas in your own voice while still crediting the author.', 'Even a well-reworded idea must be credited, because it is still someone else’s thinking.', 'Restating a text is a test of whether you have truly understood it.'],
        ['Euphemism', 'YOO-fuh-miz-um', 3, 'A mild or indirect expression used in place of one considered harsh or blunt.', 'Saying someone passed away is a common euphemism for death.', 'The word comes from Greek roots meaning “to speak well.”', 'Such phrases can be kind, but they can also hide the truth, so they are worth noticing.'],
        ['Connotation', 'kon-oh-TAY-shun', 3, 'The feelings or associations a word carries beyond its literal meaning.', 'Thrifty and cheap mean similar things, but cheap has a negative connotation.', 'The literal meaning of a word is called its denotation.', 'Choosing words with the right associations shapes tone and persuades more effectively.'],
        ['Nuance', 'NOO-ahns', 3, 'A subtle difference in meaning, expression, or tone.', 'A translator must capture every nuance of the original, not just its literal meaning.', 'The word comes from the French for “shade” or “gradation,” as in subtle variations of color.', 'Appreciating subtlety prevents oversimplified thinking and misunderstandings.'],
        ['Plagiarism', 'PLAY-juh-riz-um', 3, 'Presenting someone else’s words or ideas as your own without proper credit.', 'Universities use software to detect plagiarism in student papers.', 'The word comes from the Latin plagiarius, “kidnapper,” a term the Roman poet Martial applied to a writer who stole his work.', 'Citing sources respects other people’s work and protects your credibility.'],
        ['Vernacular', 'ver-NAK-yuh-ler', 4, 'The everyday language spoken by ordinary people in a region, as opposed to formal or literary language.', 'Dante wrote his Divine Comedy in the vernacular of Italy rather than in Latin.', 'Writing in everyday language helped spread literacy in Europe, as with Martin Luther’s German translation of the Bible.', 'Knowing the difference between everyday and formal language helps writers choose a fitting voice.'],
      ],
    },
  ],
});
