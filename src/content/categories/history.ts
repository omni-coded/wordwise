import { defineCategory } from '../author';

export default defineCategory({
  id: 'history',
  name: 'History & World Civilizations',
  shortName: 'History',
  blurb: 'Empires, ideas, and turning points that built the modern world.',
  glyph: '⌛',
  references: [
    'Encyclopaedia Britannica (britannica.com)',
    'World History Encyclopedia (worldhistory.org)',
    'Oxford Reference (oxfordreference.com)',
    'Library of Congress digital collections (loc.gov)',
  ],
  topics: [
    {
      id: 'ancient',
      name: 'Ancient Worlds',
      connection:
        'Mesopotamian cuneiform and Egyptian papyrus show writing at work, while pharaohs and dynasties describe how power was organized. Athens experimented with democracy, Rome ran a republic and an empire through its Senate and legions, aqueducts kept its cities alive, and the Hellenistic world spread Greek culture across three continents.',
      rows: [
        ['Mesopotamia', 'mes-uh-puh-TAY-mee-uh', 3, 'The ancient region between the Tigris and Euphrates rivers, in present-day Iraq and neighboring areas.', 'Cities such as Ur and Babylon flourished in Mesopotamia, often called a cradle of civilization.', 'The name comes from Greek words meaning “between rivers.”', 'Early writing, large cities, and written law codes all appear here, shaping later civilizations.'],
        ['Pharaoh', 'FAIR-oh', 2, 'The title of the ruler of ancient Egypt, regarded as both king and divine intermediary.', 'The pharaoh Ramses II ruled Egypt for about 66 years.', 'The word comes from an Egyptian term meaning “great house,” originally referring to the royal palace.', 'Pharaonic rule organized Egypt’s monuments, irrigation, and administration for roughly three thousand years.'],
        ['Papyrus', 'puh-PY-russ', 2, 'A writing material made from the pith of a reed that grows along the Nile.', 'Scribes recorded tax records and stories on rolls of papyrus.', 'The English word paper comes from papyrus, although paper is made by a different process.', 'Papyrus made record-keeping and long-distance administration practical across the ancient Mediterranean.'],
        ['Cuneiform', 'kyoo-NEE-ih-form', 4, 'One of the earliest writing systems, using wedge-shaped marks pressed into clay tablets.', 'Archaeologists have found cuneiform tablets recording everything from grain deliveries to epic poems.', 'It was used for roughly three thousand years and was adapted to write many different languages.', 'It shows how writing began as practical accounting before becoming literature.'],
        ['Aqueduct', 'AK-wuh-dukt', 2, 'A bridge or channel built to carry water over long distances.', 'The Roman aqueduct carried fresh water into the city from hills many miles away.', 'Roman engineers relied on gravity, giving aqueducts a gentle downward slope, and many of their structures are still standing.', 'Reliable water let ancient cities grow and supported public baths and sanitation.'],
        ['Dynasty', 'DY-nus-tee', 2, 'A sequence of rulers from the same family.', 'The Han dynasty ruled China for roughly four centuries.', 'Historians of ancient Egypt and China organize long stretches of history by dynasties.', 'Dynastic cycles help explain how power was inherited, contested, and lost.'],
        ['Democracy', 'dih-MOK-ruh-see', 2, 'A system of government in which power rests with the people, who rule directly or through elected representatives.', 'Athens developed an early form of direct democracy in the fifth century BCE.', 'The word comes from the Greek demos, “people,” and kratos, “power”; in Athens only adult male citizens could vote.', 'Comparing ancient and modern democracy shows how citizenship has expanded over time.'],
        ['Legion', 'LEE-jun', 2, 'The main unit of the Roman army, made up of several thousand soldiers.', 'A legion included engineers who could build roads, bridges, and fortified camps.', 'Roman soldiers were also builders; many roads, forts, and bridges across Europe were constructed by the army.', 'Its organization and discipline helped Rome expand and hold its empire.'],
        ['Hellenistic', 'hel-uh-NIS-tik', 4, 'Relating to the period of Greek cultural influence that followed the death of Alexander the Great in 323 BCE.', 'Alexandria, with its famous library, became a center of Hellenistic science and scholarship.', "Alexander's conquests spread Greek language and ideas from Egypt to the edge of India, where they mixed with local cultures.", 'The Hellenistic world carried Greek science and philosophy across three continents.'],
        ['Senate', 'SEN-it', 2, 'An assembly of leaders who advise on or make laws; in ancient Rome, a council of senior statesmen.', 'In the Roman Republic, the Senate controlled finances and foreign policy.', 'The word comes from the Latin senex, meaning “old man,” reflecting a council of elders.', 'Many modern legislatures, such as the U.S. Senate, take their name from Rome.'],
      ],
    },
    {
      id: 'medieval-early-modern',
      name: 'Middle Ages to Early Modern',
      connection:
        'Feudalism and chivalry organized medieval society, guilds structured its towns, and handwritten manuscripts preserved its learning. The Crusades linked Europe to the wider world, the Renaissance and humanism renewed classical learning, the Reformation reshaped religion, mercantilism guided trade, and the Enlightenment put reason in the spotlight.',
      rows: [
        ['Feudalism', 'FYOO-duh-liz-um', 3, 'A medieval system in which land was held in exchange for loyalty and military service.', 'Under feudalism, a lord granted land to a vassal who promised to fight for him.', 'Historians debate how uniform it really was, since arrangements varied widely across regions and centuries.', 'It shaped property, obligation, and class structure in medieval Europe.'],
        ['Chivalry', 'SHIV-ul-ree', 3, 'The medieval code of conduct for knights, emphasizing bravery, loyalty, and courtesy.', 'Tales of chivalry celebrated knights who protected the weak and honored their word.', 'The word comes from the French chevalerie, from cheval, “horse,” because knights were mounted warriors.', 'Chivalric ideals still echo in modern ideas of honor and courtesy.'],
        ['Crusade', 'kroo-SAYD', 2, 'One of a series of religious military campaigns launched by European Christians, mostly aimed at controlling Jerusalem and the Holy Land.', 'Pope Urban II called for the First Crusade in 1095.', 'The Crusades lasted for centuries and left lasting marks on trade, politics, and relations between Europe and the Middle East.', 'Understanding them helps explain medieval politics and enduring historical memories.'],
        ['Manuscript', 'MAN-yuh-skript', 2, 'A book or document written by hand, especially before the age of printing.', 'Monks spent months copying a single illuminated manuscript.', 'The Latin roots of the word mean “written by hand.”', 'Hand-copied manuscripts preserved classical and religious texts through the Middle Ages.'],
        ['Guild', 'GILD', 2, 'An association of craftspeople or merchants that set standards and protected the interests of its members.', "To open a shop in the city, a baker had to join the bakers' guild.", 'Guilds regulated quality, prices, and apprenticeship training in medieval towns.', 'They are often seen as forerunners of modern professional associations and trade unions.'],
        ['Renaissance', 'REN-uh-sahns', 2, 'The period of renewed interest in classical learning and the arts that began in Italy in the 14th century and spread across Europe.', 'Leonardo da Vinci, a painter, engineer, and anatomist, embodies the Renaissance ideal of broad curiosity.', 'The word means “rebirth” in French.', 'It reshaped art, science, and the way Europeans thought about human potential.'],
        ['Reformation', 'ref-or-MAY-shun', 3, 'The 16th-century movement to reform the Catholic Church that led to the creation of Protestant churches.', "Martin Luther's Ninety-five Theses in 1517 are often seen as the start of the Reformation.", 'The printing press helped reformers spread their ideas quickly across Europe.', 'It transformed religion, politics, and literacy across the continent.'],
        ['Humanism', 'HYOO-muh-niz-um', 3, 'An intellectual movement, central to the Renaissance, that emphasized human potential and the study of classical texts.', 'Humanism encouraged scholars to read ancient Greek and Latin authors directly rather than rely on summaries.', 'Petrarch, the 14th-century Italian poet, is often called the father of this movement.', 'Its focus on education and critical reading influenced modern universities.'],
        ['Mercantilism', 'MUR-kun-til-iz-um', 4, 'An economic theory that saw national wealth as a stock of gold and silver, to be built through exports and colonies.', 'Under mercantilism, European powers tried to export more than they imported and kept colonies as suppliers.', 'Adam Smith criticized it in The Wealth of Nations, published in 1776, arguing for freer trade.', 'It helps explain the rise of colonial empires and trade wars.'],
        ['Enlightenment', 'en-LYT-en-ment', 3, 'An 18th-century intellectual movement that championed reason, science, and individual rights.', 'Enlightenment thinkers such as Voltaire and Locke argued for tolerance and limits on government power.', 'Its ideas about liberty and equality influenced the American and French revolutions.', 'Many modern ideas of human rights, science, and democracy trace back to it.'],
      ],
    },
    {
      id: 'modern',
      name: 'The Modern World',
      connection:
        'Revolutions and nationalism redrew political maps, while suffrage and abolition widened who counted as a citizen. Colonialism and imperialism spread European power, decolonization ended it, and propaganda, armistices, and globalization describe how modern states fight wars, make peace, and connect.',
      rows: [
        ['Nationalism', 'NASH-uh-nuh-liz-um', 2, "Strong loyalty to one's nation and a belief that its interests should come first.", 'Nationalism fueled movements for independence in the 19th and 20th centuries.', 'It helped unify Italy and Germany in the 19th century and also contributed to the rivalries that preceded World War I.', 'It remains a powerful political force, for both unity and division.'],
        ['Armistice', 'AHR-mih-stiss', 3, 'An agreement to stop fighting, often a prelude to a peace treaty.', 'The armistice that ended fighting in World War I took effect on November 11, 1918.', 'The date is now commemorated as Armistice Day, Remembrance Day, or Veterans Day in different countries.', 'Distinguishing an armistice from a treaty clarifies how wars actually end.'],
        ['Suffrage', 'SUF-rij', 3, 'The right to vote in political elections.', 'New Zealand granted women suffrage in 1893, the first self-governing country to do so.', 'In many countries, women won the right to vote only in the 20th century after decades of campaigning.', 'The history of suffrage shows how democratic participation has expanded.'],
        ['Abolition', 'ab-uh-LISH-un', 3, 'The ending of a practice or institution, especially the legal end of slavery.', 'The abolition movement combined petitions, speeches, and boycotts to end slavery.', "Britain's Slavery Abolition Act, passed in 1833, ended slavery across most of the British Empire.", 'Abolition campaigns became models for later movements for rights and reform.'],
        ['Decolonization', 'dee-kol-uh-nih-ZAY-shun', 4, 'The process by which colonies gain independence from the powers that ruled them.', 'After World War II, decolonization transformed Africa and Asia as dozens of new nations emerged.', 'United Nations membership grew from 51 states in 1945 to nearly 200 today, largely through decolonization.', 'It reshaped the political map and continues to influence global relationships.'],
        ['Imperialism', 'im-PEER-ee-uh-liz-um', 3, "A policy of extending a nation's power through conquest or through political and economic control of other territories.", 'European imperialism in the late 19th century divided most of Africa among a few powers.', 'At the Berlin Conference of 1884–85, European powers set rules for claiming African territory without African participation.', 'Its legacy still shapes borders, economies, and international relations.'],
        ['Globalization', 'gloh-bul-ih-ZAY-shun', 3, 'The growing interconnection of economies, cultures, and people across the world through trade, technology, and travel.', 'Globalization means a single smartphone may contain parts made in many different countries.', 'Container shipping and the internet are among the technologies that sharply cut the cost of moving goods and information.', 'Understanding it helps explain trade, migration, and cultural change.'],
        ['Propaganda', 'prop-uh-GAN-duh', 3, 'Information, often biased or misleading, used to promote a political cause or point of view.', 'Wartime propaganda posters urged citizens to buy bonds and conserve food.', 'The term traces back to Propaganda Fide, a Catholic Church committee founded in 1622 whose name meant “propagating the faith.”', 'Recognizing propaganda techniques helps people evaluate news and political messaging.'],
        ['Revolution', 'rev-uh-LOO-shun', 2, 'A fundamental, often sudden change in political power or society, usually driven by popular uprising.', 'The French Revolution of 1789 ended the absolute monarchy and proclaimed the rights of citizens.', 'The word first described circular motion, like a planet’s revolution, before taking on its political meaning.', 'Studying revolutions reveals why societies break with the past and what follows.'],
        ['Colonialism', 'kuh-LOH-nee-uh-liz-um', 3, 'The practice of one country taking control of another territory, settling it, and exploiting it economically.', 'Colonialism redirected resources and labor from colonies toward the ruling powers.', 'Colonial rule drew many borders in Africa, Asia, and the Middle East that remain in place today.', 'Colonial history helps explain present-day inequality and political boundaries.'],
      ],
    },
  ],
});
