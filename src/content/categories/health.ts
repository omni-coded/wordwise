import { defineCategory } from '../author';

export default defineCategory({
  id: 'health',
  name: 'Health & Human Biology',
  shortName: 'Health',
  blurb: 'How the body works, what it needs, and how medicine keeps it well.',
  glyph: '✚',
  references: [
    'World Health Organization fact sheets (who.int)',
    'MedlinePlus, U.S. National Library of Medicine (medlineplus.gov)',
    'Centers for Disease Control and Prevention (cdc.gov)',
    'NHS health A to Z (nhs.uk)',
  ],
  topics: [
    {
      id: 'body-systems',
      name: 'Body Systems',
      connection:
        'Neurons and synapses carry fast electrical signals, while hormones such as insulin and cortisol carry slower chemical messages through the blood. Hemoglobin delivers oxygen, antibodies defend the body, and the cardiovascular system circulates it all. Metabolism powers the whole machine, and homeostasis keeps conditions stable.',
      rows: [
        ['Metabolism', 'meh-TAB-uh-liz-um', 2, 'All the chemical reactions in the body that convert food into energy and building materials.', 'Metabolism varies with age, body size, muscle mass, and genetics.', 'Even at rest the body uses energy for breathing, circulation, and cell repair; this baseline is called the basal metabolic rate.', 'Understanding metabolism helps explain energy needs, weight changes, and conditions such as diabetes.'],
        ['Hormone', 'HOR-mohn', 2, 'A chemical messenger released by glands into the bloodstream that regulates processes in distant organs.', 'The hormone insulin tells cells to absorb sugar from the blood.', 'The word comes from the Greek hormao, “to set in motion,” and was introduced in 1905.', 'These messengers control growth, mood, metabolism, and reproduction, so imbalances can have wide effects.'],
        ['Neuron', 'NOOR-on', 2, 'A nerve cell that transmits electrical and chemical signals in the brain and body.', 'Each neuron connects with thousands of others, forming vast networks.', 'The human brain contains roughly 86 billion neurons, according to a widely cited count.', 'Neurons underpin thought, sensation, and movement, and nerve damage can impair all three.'],
        ['Synapse', 'SIN-aps', 3, 'The tiny gap where one nerve cell passes a signal to another cell.', 'Chemical messengers cross each synapse in a fraction of a millisecond.', 'Learning strengthens some connections and weakens others, a flexibility known as plasticity.', 'Many medications for mood and neurological conditions work by influencing these junctions.'],
        ['Antibody', 'AN-tih-bod-ee', 2, 'A protein made by the immune system that recognizes and binds to a specific foreign substance.', 'After a vaccine, the body makes an antibody that can recognize the targeted germ.', 'These proteins are shaped like a Y, with tips that lock onto a particular target.', 'Vaccines, blood tests, and many modern drugs rely on them.'],
        ['Insulin', 'IN-suh-lin', 2, 'A hormone made by the pancreas that lets cells take up sugar from the blood.', 'People with type 1 diabetes must take insulin because their bodies cannot make enough.', 'It was first used to treat a patient in 1922, a breakthrough made by researchers in Toronto.', 'Its discovery turned type 1 diabetes from a fatal diagnosis into a manageable condition.'],
        ['Hemoglobin', 'HEE-muh-gloh-bin', 3, 'The iron-containing protein in red blood cells that carries oxygen around the body.', 'Low hemoglobin can leave a person feeling tired and short of breath.', 'It also gives blood its red color.', 'Hemoglobin tests help diagnose anemia and other conditions.'],
        ['Cortisol', 'KOR-tih-sol', 3, 'A hormone released by the adrenal glands that helps the body respond to stress and regulates metabolism.', 'Cortisol levels naturally peak in the morning and fall through the day.', 'Chronically high levels are linked to problems such as raised blood pressure and disrupted sleep.', 'It shows how a stress response that helps in short bursts can harm health when it never switches off.'],
        ['Homeostasis', 'hoh-mee-oh-STAY-sis', 4, "The body's process of keeping internal conditions, such as temperature and blood sugar, within a stable range.", 'Sweating when you are hot is homeostasis at work.', 'Physiologist Walter Cannon coined the term in the 1920s.', 'Many diseases can be understood as a failure of this balancing act.'],
        ['Cardiovascular', 'kar-dee-oh-VAS-kyuh-ler', 3, 'Relating to the heart and blood vessels.', 'Regular exercise improves cardiovascular health by strengthening the heart.', 'Cardiovascular disease is the leading cause of death worldwide, according to the World Health Organization.', 'Knowing risk factors such as blood pressure and cholesterol helps people prevent problems.'],
      ],
    },
    {
      id: 'nutrition-fitness',
      name: 'Nutrition & Fitness',
      connection:
        'Calories measure the energy in food, and macronutrients such as protein supply it, while fiber, electrolytes, and hydration keep the body running smoothly. Cholesterol and the glycemic response link diet to long-term health, and antioxidants and probiotics are popular topics where the evidence deserves a careful look.',
      rows: [
        ['Calorie', 'KAL-uh-ree', 1, 'A unit of energy; on food labels, the energy needed to raise one kilogram of water by one degree Celsius.', 'A calorie label tells you how much energy a serving of food provides.', 'Fat has about nine calories per gram, while carbohydrates and protein have about four.', 'Balancing energy intake and use is central to maintaining a healthy weight.'],
        ['Protein', 'PROH-teen', 1, 'A large molecule made of amino acids that builds and repairs tissue and performs many jobs in the body.', 'Beans, eggs, fish, and tofu are common sources of protein.', 'The body breaks dietary protein into amino acids and reassembles them as needed; nine of them are considered essential for adults.', 'Adequate protein supports muscle, immune function, and recovery.'],
        ['Fiber', 'FY-ber', 1, 'The part of plant foods that the body cannot fully digest, which aids digestion and gut health.', 'Oats, beans, vegetables, and fruit are rich in fiber.', 'Soluble types can help lower cholesterol, while insoluble types help food move through the gut.', 'Most adults eat less than recommended, so it is a simple dietary improvement for many people.'],
        ['Cholesterol', 'kuh-LES-tur-ol', 2, 'A waxy, fat-like substance in the blood that the body needs to build cells but that can build up in arteries at high levels.', 'A blood test can measure your LDL cholesterol, often called the bad kind.', 'The liver makes most of the cholesterol in the body, and diet supplies the rest.', 'High LDL levels are a major risk factor for heart disease, which makes screening worthwhile.'],
        ['Antioxidant', 'an-tee-OK-sih-dent', 3, 'A substance that can neutralize unstable molecules called free radicals before they damage cells.', 'Berries are often praised for their antioxidant content.', 'Large trials of antioxidant supplements have often failed to show clear protection against disease, so whole foods are the safer bet.', 'The word is frequently used in marketing, so knowing the evidence helps you judge claims.'],
        ['Electrolyte', 'ih-LEK-troh-lyte', 3, 'A mineral such as sodium, potassium, or calcium that carries an electric charge and helps nerves, muscles, and fluid balance work.', 'After a long run in the heat, an electrolyte drink can replace the salts lost in sweat.', 'Imbalances can cause muscle cramps, irregular heartbeat, and confusion.', 'Staying balanced matters most during illness, heavy sweating, or kidney problems.'],
        ['Probiotic', 'proh-by-OT-ik', 3, 'A live microorganism that may benefit health when eaten in adequate amounts.', 'Yogurt with live cultures is a common source of probiotic bacteria.', 'Benefits depend on the specific strain, and not every product on the shelf has been shown to work for every condition.', 'Understanding the evidence helps consumers avoid paying for unproven claims.'],
        ['Hydration', 'hy-DRAY-shun', 1, 'The process of providing the body with enough water to function properly.', 'Proper hydration helps regulate temperature and supports concentration.', "Water makes up roughly 60 percent of an adult's body weight.", 'Even mild dehydration can reduce energy and focus.'],
        ['Macronutrient', 'mak-roh-NOO-tree-unt', 4, 'A nutrient the body needs in large amounts, namely carbohydrate, protein, and fat.', 'Most diet plans adjust the balance of each macronutrient.', 'Alcohol also provides energy, about seven calories per gram, but is not considered an essential nutrient.', 'Understanding the mix of these nutrients on a food label helps you compare products.'],
        ['Glycemic', 'gly-SEE-mik', 4, 'Relating to the level of sugar in the blood; an index of this name ranks foods by how fast they raise it.', 'Lentils have a low glycemic index, so they raise blood sugar slowly.', 'The glycemic index was developed in the early 1980s by researchers studying diets for people with diabetes.', 'It can help people with diabetes plan meals, although portion size also matters.'],
      ],
    },
    {
      id: 'prevention-care',
      name: 'Prevention & Care',
      connection:
        'Epidemiology tracks how a pathogen spreads, vaccines and immunity protect against it, and antibiotics treat bacterial infections. Diagnosis and prognosis describe what is wrong and what to expect, triage sorts patients by urgency, chronic conditions need long-term care, and placebo-controlled trials show which treatments really work.',
      rows: [
        ['Vaccine', 'vak-SEEN', 1, 'A preparation that trains the immune system to recognize and fight a specific disease-causing germ.', 'A vaccine can prepare the body to respond quickly if it meets the real germ.', 'The word comes from the Latin vacca, “cow,” because Edward Jenner used cowpox in 1796 to protect against smallpox.', 'Vaccination eliminated smallpox worldwide and sharply reduced many other diseases.'],
        ['Epidemiology', 'ep-ih-dee-mee-OL-uh-jee', 4, 'The study of how diseases spread and what affects the health of populations.', 'Epidemiology helped John Snow link a contaminated London water pump to a cholera outbreak in 1854.', 'Snow plotted cases on a map, an early example of using data to find the source of a disease.', 'The same methods guide responses to outbreaks, vaccination programs, and public-health policy.'],
        ['Pathogen', 'PATH-uh-jen', 3, 'A microorganism, such as a bacterium, virus, or fungus, that can cause disease.', 'Handwashing helps remove each pathogen picked up from surfaces before it can spread.', 'Bacteria, viruses, fungi, and parasites can all be pathogens, and each calls for different treatments.', 'Knowing the type of germ guides whether to use antibiotics, antivirals, or other treatments.'],
        ['Chronic', 'KRON-ik', 2, 'Lasting a long time or recurring frequently, as with a disease or condition.', 'Diabetes and arthritis are common chronic conditions that need ongoing management.', 'Long-term noncommunicable diseases account for most deaths worldwide, according to the World Health Organization.', 'Managing them relies on long-term habits and regular check-ups.'],
        ['Triage', 'TREE-ahzh', 3, 'The process of sorting patients by urgency so that those most in need are treated first.', 'The emergency department used triage to treat the most critical patients before minor injuries.', 'The word comes from the French trier, “to sort,” and was first used for sorting wounded soldiers on battlefields.', 'It is how hospitals stretch limited resources to save the most lives.'],
        ['Placebo', 'pluh-SEE-boh', 3, 'An inactive treatment, such as a sugar pill, given to compare against a real treatment in a trial.', 'Half the volunteers received the drug and half received a placebo, so researchers could compare results.', 'Expectations can produce real improvements in symptoms such as pain, which is why trials need control groups.', 'Placebo-controlled trials are how doctors separate genuine treatments from false hope.'],
        ['Antibiotic', 'an-tih-by-OT-ik', 2, 'A medicine that kills bacteria or stops them from growing.', 'An antibiotic will not help a cold or the flu, which are caused by viruses.', 'Alexander Fleming noticed in 1928 that a mold killed bacteria, which led to the discovery of penicillin.', 'Misuse speeds up antibiotic resistance, one of the major global health threats.'],
        ['Diagnosis', 'dy-ag-NOH-sis', 2, 'The identification of an illness or condition from its signs, symptoms, and tests.', 'The doctor ordered blood tests to confirm her diagnosis.', 'The word comes from the Greek for “distinguishing” or “discerning.”', 'An accurate answer is the foundation for effective treatment.'],
        ['Prognosis', 'prog-NOH-sis', 3, 'A prediction of the likely course and outcome of a disease.', 'With early treatment, the prognosis for the condition is excellent.', 'It is a probability based on large groups of similar patients, not a guarantee for an individual.', 'Understanding what to expect helps patients plan treatment and life decisions.'],
        ['Immunity', 'ih-MYOO-nih-tee', 2, "The body's ability to resist or fight off an infection or toxin.", 'After recovering from chickenpox, most people have lasting immunity to it.', 'It can come from infection, from vaccination, or from antibodies passed from mother to baby.', 'It is why some diseases can be controlled when enough people are vaccinated.'],
      ],
    },
  ],
});
