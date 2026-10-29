/**
 * Themed Journeys: eight stepping-stone puzzles through one subject, then a mastery challenge.
 * Steps are data, so a new journey is one more object in JOURNEYS (its topic ids are checked by tests).
 */

export interface JourneyStep {
  title: string;
  blurb: string;
  /** Topic to emphasise; omitted for "mixed" steps that draw on the whole subject. */
  topicId?: string;
}

export interface Journey {
  id: string;
  name: string;
  tagline: string;
  categoryId: string;
  steps: JourneyStep[];
  mastery: { title: string; blurb: string };
}

/** Difficulty level used for step i (0-based): a gentle climb from Medium toward Medium-Hard. */
export function journeyStepLevel(step: number): number {
  return 4 + step * 3;
}

/** The mastery challenge is a harder grid plus a fact challenge. */
export const MASTERY_LEVEL = 32;
export const MASTERY_QUESTIONS = 8;
export const MASTERY_PASS_RATIO = 0.7;

export const JOURNEYS: Journey[] = [
  {
    id: 'psychology',
    name: 'Psychology',
    tagline: 'How minds think, feel, and influence one another.',
    categoryId: 'psychology',
    steps: [
      { title: 'Everyday Thinking', topicId: 'cognition', blurb: 'Shortcuts, biases, and the habits behind how we decide.' },
      { title: 'Feelings and Drives', topicId: 'emotion-motivation', blurb: 'What moves us, and how emotion shapes behavior.' },
      { title: 'People Together', topicId: 'social', blurb: 'How groups, norms, and other people change what we do.' },
      { title: 'Three Lenses', blurb: 'Thinking, feeling, and social forces in a single grid.' },
      { title: 'Under the Hood', topicId: 'cognition', blurb: 'Deeper ideas about memory, attention, and judgment.' },
      { title: 'Inner Weather', topicId: 'emotion-motivation', blurb: 'Stress, motivation, and how people recover.' },
      { title: 'The Social Mind', topicId: 'social', blurb: 'Conformity, stereotypes, and the pull of the crowd.' },
      { title: 'Putting It Together', blurb: 'A full survey of the field before the mastery challenge.' },
    ],
    mastery: { title: 'Psychology Mastery', blurb: 'A demanding grid across the whole subject, then a fact challenge on what you have learned.' },
  },
  {
    id: 'money',
    name: 'Money Mastery',
    tagline: 'Saving, borrowing, and the economy behind your wallet.',
    categoryId: 'finance',
    steps: [
      { title: 'Building the Base', topicId: 'saving-investing', blurb: 'Saving, interest, and how money grows over time.' },
      { title: 'Borrowing Wisely', topicId: 'credit-debt', blurb: 'Credit, debt, and the true cost of borrowing.' },
      { title: 'The Big Picture', topicId: 'economy', blurb: 'Inflation, markets, and the forces behind prices.' },
      { title: 'Money Mix', blurb: 'Personal finance and the wider economy together.' },
      { title: 'Growing Wealth', topicId: 'saving-investing', blurb: 'Diversification, compounding, and long-term thinking.' },
      { title: 'Debt Decoded', topicId: 'credit-debt', blurb: 'Mortgages, collateral, and the fine print.' },
      { title: 'Economic Cycles', topicId: 'economy', blurb: 'Recessions, deflation, and how policy responds.' },
      { title: 'Full Portfolio', blurb: 'A complete tour of personal and public finance.' },
    ],
    mastery: { title: 'Money Mastery Challenge', blurb: 'A demanding grid across personal and public finance, then a fact challenge.' },
  },
  {
    id: 'science',
    name: 'Science Explorer',
    tagline: 'From atoms and cells to galaxies.',
    categoryId: 'science',
    steps: [
      { title: 'Matter in Motion', topicId: 'matter-energy', blurb: 'Atoms, forces, and the energy that drives them.' },
      { title: 'The Living World', topicId: 'life', blurb: 'Cells, genes, and the machinery of life.' },
      { title: 'Earth and Sky', topicId: 'cosmos-earth', blurb: 'Our planet, our star, and the universe beyond.' },
      { title: 'Lab Mix', blurb: 'Physics, biology, and astronomy in one grid.' },
      { title: 'Energy and Elements', topicId: 'matter-energy', blurb: 'Deeper ideas about matter and energy.' },
      { title: 'Cells to Ecosystems', topicId: 'life', blurb: 'How living systems work at every scale.' },
      { title: 'Deep Space', topicId: 'cosmos-earth', blurb: 'Stars, galaxies, and the structure of the cosmos.' },
      { title: 'Grand Survey', blurb: 'A wide look at the sciences before the mastery challenge.' },
    ],
    mastery: { title: 'Science Mastery', blurb: 'A demanding grid across the sciences, then a fact challenge.' },
  },
  {
    id: 'history',
    name: 'History Archive',
    tagline: 'Empires, revolutions, and the ideas that shaped them.',
    categoryId: 'history',
    steps: [
      { title: 'Dawn of Civilization', topicId: 'ancient', blurb: 'Early writing, cities, and the first empires.' },
      { title: 'Crowns and Crusades', topicId: 'medieval-early-modern', blurb: 'Feudal Europe, trade, and a changing world.' },
      { title: 'The Modern Age', topicId: 'modern', blurb: 'Industry, revolution, and global conflict.' },
      { title: 'Across the Eras', blurb: 'Ancient, medieval, and modern history side by side.' },
      { title: 'Empires and Writing', topicId: 'ancient', blurb: 'How early states ruled and recorded their world.' },
      { title: 'Reform and Renaissance', topicId: 'medieval-early-modern', blurb: 'Ideas that remade Europe.' },
      { title: 'Revolutions and Rivalries', topicId: 'modern', blurb: 'Nations, empires, and the struggles over both.' },
      { title: 'The Long View', blurb: 'A broad survey before the mastery challenge.' },
    ],
    mastery: { title: 'History Mastery', blurb: 'A demanding grid across the ages, then a fact challenge.' },
  },
  {
    id: 'technology',
    name: 'Technology Frontier',
    tagline: 'How machines learn, compute, and connect.',
    categoryId: 'computing',
    steps: [
      { title: 'How Machines Learn', topicId: 'ai-ml', blurb: 'Algorithms, models, and the basics of AI.' },
      { title: 'Inside the Machine', topicId: 'systems', blurb: 'Kernels, caches, and how computers run.' },
      { title: 'The Connected World', topicId: 'data-web', blurb: 'Data, the web, and staying secure online.' },
      { title: 'Tech Mix', blurb: 'AI, systems, and the web in one grid.' },
      { title: 'Models and Mistakes', topicId: 'ai-ml', blurb: 'Overfitting, hallucination, and the limits of AI.' },
      { title: 'Systems Under the Hood', topicId: 'systems', blurb: 'Latency, compilers, and virtualization.' },
      { title: 'Data, Privacy and Security', topicId: 'data-web', blurb: 'Cookies, metadata, phishing, and encryption.' },
      { title: 'Frontier Survey', blurb: 'A wide look at technology before the mastery challenge.' },
    ],
    mastery: { title: 'Technology Mastery', blurb: 'A demanding grid across computing, then a fact challenge.' },
  },
  {
    id: 'critical-thinking',
    name: 'Critical Thinking',
    tagline: 'Reason well, spot weak arguments, and think about thinking.',
    categoryId: 'philosophy',
    steps: [
      { title: 'Sound Reasoning', topicId: 'logic-reasoning', blurb: 'Premises, deduction, and what makes an argument valid.' },
      { title: 'Right and Wrong', topicId: 'ethics-mind', blurb: 'Ethics, virtue, and the study of the mind.' },
      { title: 'Spotting Weak Arguments', topicId: 'critical-thinking', blurb: 'Fallacies, bias, and how to question a claim.' },
      { title: 'Mind Mix', blurb: 'Logic, ethics, and skepticism in one grid.' },
      { title: 'The Logic Toolkit', topicId: 'logic-reasoning', blurb: 'Induction, inference, and the structure of proof.' },
      { title: 'Ethics in Practice', topicId: 'ethics-mind', blurb: 'Competing moral frameworks and how they differ.' },
      { title: 'Thinking About Thinking', topicId: 'critical-thinking', blurb: 'Evidence, falsifiability, and intellectual humility.' },
      { title: 'Full Reasoning', blurb: 'A broad survey before the mastery challenge.' },
    ],
    mastery: { title: 'Critical Thinking Mastery', blurb: 'A demanding grid across reasoning and ethics, then a fact challenge.' },
  },
];

export function getJourney(id: string): Journey | undefined {
  return JOURNEYS.find((j) => j.id === id);
}
