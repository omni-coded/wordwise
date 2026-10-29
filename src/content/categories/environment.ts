import { defineCategory } from '../author';

export default defineCategory({
  id: 'environment',
  name: 'Environment & Sustainability',
  shortName: 'Environment',
  blurb: 'Climate, ecosystems, and the resources a living planet depends on.',
  glyph: '❦',
  references: [
    'IPCC Assessment Reports (ipcc.ch)',
    'NASA Climate (climate.nasa.gov)',
    'UN Environment Programme (unep.org)',
    'IPBES Global Assessment (ipbes.net)',
  ],
  topics: [
    {
      id: 'climate',
      name: 'Climate & Atmosphere',
      connection:
        'The atmosphere and the greenhouse effect keep Earth warm, while emissions strengthen that effect and aerosols and albedo adjust how much sunlight is absorbed. Permafrost shows how warming can feed itself, the Anthropocene names humanity’s role, and mitigation, adaptation, and sequestration are the three main kinds of response.',
      rows: [
        ['Albedo', 'al-BEE-doh', 4, 'The fraction of incoming sunlight that a surface reflects rather than absorbs.', 'Fresh snow has a high albedo, reflecting most sunlight, while dark ocean water absorbs it.', 'As sea ice melts, the darker ocean it exposes absorbs more heat, which speeds further warming in a feedback loop.', 'Such changes are a key reason the Arctic is warming faster than the global average.'],
        ['Mitigation', 'mit-ih-GAY-shun', 3, 'Actions that reduce or prevent greenhouse gas emissions in order to limit climate change.', 'Switching to wind and solar power is a major mitigation strategy.', 'Mitigation targets the causes of climate change, while adaptation prepares for its effects.', 'Both approaches are needed because some warming is already locked in.'],
        ['Adaptation', 'ad-ap-TAY-shun', 3, 'Adjusting systems and behavior to cope with the current or expected effects of climate change.', 'Building sea walls and planting heat-tolerant crops are examples of adaptation.', 'In biology, the same word describes traits that evolve to help organisms survive in their environments.', 'Communities that plan early can protect lives and money.'],
        ['Sequestration', 'see-kwes-TRAY-shun', 4, 'The capture and long-term storage of carbon dioxide so that it stays out of the atmosphere.', 'Forests contribute to carbon sequestration by storing carbon in wood and soil.', 'Oceans, soils, and forests are natural stores, and engineers are also developing ways to pump carbon dioxide into deep rock formations.', 'It is one tool among many and works best alongside cutting emissions.'],
        ['Emissions', 'ih-MISH-unz', 2, 'Gases and particles released into the air, for example from vehicles, factories, and power plants.', 'Electric vehicles produce no tailpipe emissions, though generating their electricity may still create some.', 'Carbon dioxide is the largest contributor to human-caused warming, followed by methane.', 'Tracking them is the first step to cutting them.'],
        ['Anthropocene', 'AN-throh-puh-seen', 4, 'A proposed geological epoch in which human activity has become a dominant force shaping Earth’s climate and ecosystems.', 'Plastic pollution and radioactive fallout are among the traces that could mark the Anthropocene in rock layers.', 'In 2024 a geological committee rejected a proposal to make it a formal epoch, though the term remains widely used.', 'The concept captures how humans have become a geological force.'],
        ['Permafrost', 'PUR-muh-frost', 3, 'Ground that stays frozen for at least two consecutive years, common in polar regions.', 'Thawing permafrost can destabilize buildings and roads as well as release stored carbon.', 'It holds the remains of ancient plants and animals, which decompose and release carbon as the ground thaws.', 'It is a potential feedback loop: warming thaws it, which releases gases that cause more warming.'],
        ['Aerosol', 'AIR-uh-sol', 3, 'Tiny solid or liquid particles suspended in the air.', 'Volcanic eruptions inject aerosol particles that can temporarily cool the planet by reflecting sunlight.', 'The 1991 eruption of Mount Pinatubo cooled global temperatures by about half a degree Celsius for a year or two.', 'These particles affect climate, air quality, and health, and they complicate climate models.'],
        ['Greenhouse', 'GREEN-hows', 1, 'A glass-walled building that traps warmth for growing plants; also the name for the heat-trapping effect of certain gases in the air.', 'The greenhouse effect keeps Earth warm enough for life, but extra gases strengthen it.', 'Joseph Fourier first described the idea in the 1820s, and John Tyndall measured how gases absorb heat in the 1850s.', 'Without any such effect, Earth’s average temperature would be far below freezing.'],
        ['Atmosphere', 'AT-muh-sfeer', 1, 'The layer of gases surrounding a planet, held in place by gravity.', 'Earth’s atmosphere is about 78 percent nitrogen and 21 percent oxygen.', 'Most weather occurs in the lowest layer, the troposphere.', 'It protects life by absorbing harmful radiation and moderating temperature.'],
      ],
    },
    {
      id: 'ecosystems',
      name: 'Ecosystems & Life',
      connection:
        'A habitat is where a species lives, a biome is a large region of similar habitats, and an ecosystem is the web of life and environment within them. Biodiversity measures its richness, keystone species and pollinators hold it together, wetlands buffer it, and invasive species, eutrophication, and extinction show how it can unravel.',
      rows: [
        ['Biodiversity', 'by-oh-dy-VUR-sih-tee', 3, 'The variety of life on Earth, including the diversity of species, genes, and ecosystems.', 'Tropical rainforests hold remarkable biodiversity despite covering a small fraction of the land.', 'Scientists have named roughly two million species, but estimates of the total range far higher, so much remains undiscovered.', 'Diverse ecosystems tend to be more stable and provide services such as pollination and clean water.'],
        ['Habitat', 'HAB-ih-tat', 1, 'The natural environment in which a plant or animal lives.', 'Destroying a wetland removes the habitat of birds, fish, and amphibians.', 'Land-use change that destroys habitat is considered the leading driver of species decline worldwide.', 'Protecting living space is the most effective way to protect the species within it.'],
        ['Keystone', 'KEE-stohn', 3, 'Describing a species that has a disproportionately large effect on its ecosystem relative to its numbers.', 'Sea otters are a keystone species because they keep sea urchins from destroying kelp forests.', 'The term comes from the keystone of an arch, the stone that holds the others in place.', 'Losing one can cause a chain reaction that reshapes the entire ecosystem.'],
        ['Ecosystem', 'EE-koh-sis-tum', 2, 'A community of living things interacting with one another and with their physical environment.', 'A pond is a small ecosystem of plants, insects, fish, and microbes.', 'The term was coined in 1935 by British ecologist Arthur Tansley.', 'Seeing nature as connected systems helps predict how changes will ripple outward.'],
        ['Extinction', 'ik-STINK-shun', 2, 'The permanent disappearance of a species.', 'The dodo’s extinction in the 17th century followed the arrival of sailors and the animals they brought.', 'Scientists have identified five mass extinctions in Earth’s history, and many warn that a sixth may be under way.', 'Each loss removes unique genes and can weaken the ecosystems that depended on that species.'],
        ['Wetland', 'WET-land', 2, 'An area of land saturated with water, such as a marsh or swamp, that supports specially adapted plants.', 'A wetland absorbs floodwater like a sponge and filters pollutants before they reach rivers.', 'Peatlands, a kind of wetland, hold roughly a third of the world’s soil carbon.', 'They protect coasts, clean water, and shelter wildlife, yet large areas have been drained.'],
        ['Pollinator', 'POL-ih-nay-ter', 2, 'An animal, such as a bee or butterfly, that carries pollen between flowers, enabling plants to reproduce.', 'Each pollinator that visits a flower helps fruit and seeds form.', 'About three-quarters of the world’s leading food crops benefit at least in part from animal pollination.', 'Declines in these animals threaten food production and natural plant communities.'],
        ['Eutrophication', 'yoo-troh-fih-KAY-shun', 5, 'Excess nutrients in a body of water that fuel algae blooms and deplete oxygen.', 'Fertilizer runoff caused eutrophication that turned the lake green and killed fish.', 'When the algae die and decompose, bacteria use up the oxygen, creating dead zones where fish cannot survive.', 'It is one of the main threats to lakes, rivers, and coastal waters.'],
        ['Biome', 'BY-ohm', 2, 'A large region defined by its climate and the kinds of plants and animals that live there.', 'Desert, tundra, grassland, and rainforest are each an example of a biome.', 'These regions are shaped mainly by temperature and rainfall.', 'Maps of them help conservation planners decide where to focus protection.'],
        ['Invasive', 'in-VAY-siv', 3, 'Describing a non-native species that spreads aggressively and harms the environment, economy, or health.', 'The invasive zebra mussel clogs water pipes and outcompetes native shellfish.', 'Many such species arrive accidentally, in ships’ ballast water, on boots, or in imported goods.', 'Preventing arrivals is cheaper than removing a species once it is established.'],
      ],
    },
    {
      id: 'resources',
      name: 'Resources & Sustainability',
      connection:
        'Renewable energy, such as geothermal power, replaces fossil fuels, while recycling, composting, and biodegradable materials reduce waste. Watersheds and aquifers supply water, deforestation threatens forests and climate, and conservation and sustainability describe the goal: using the planet’s resources so that they last.',
      rows: [
        ['Renewable', 'rih-NOO-uh-bul', 2, 'Describing a resource that is naturally replenished on a human timescale, such as sunlight, wind, or flowing water.', 'Solar and wind are renewable sources that do not run out when used.', 'Wind, solar, and hydropower supply a rapidly growing share of the world’s electricity.', 'Shifting to them lowers emissions and reduces dependence on imported fuels.'],
        ['Compost', 'KOM-pohst', 1, 'Decayed organic matter, such as food scraps and leaves, used to enrich soil.', 'Adding compost to a garden returns nutrients to the soil.', 'Food waste in landfills produces methane, a potent greenhouse gas, but composting it avoids much of that.', 'It reduces waste and builds healthier soil.'],
        ['Watershed', 'WAW-ter-shed', 2, 'The entire area of land that drains into a particular river, lake, or sea.', 'What happens in a watershed, from farming to factories, affects the quality of the river downstream.', 'Everyone lives in one, and large ones can span many states or countries.', 'Managing the whole drainage area is the best way to protect drinking water.'],
        ['Aquifer', 'AK-wih-fur', 3, 'An underground layer of rock or sediment that holds groundwater and lets it be pumped out.', 'Farmers across the plains rely on an aquifer for irrigation.', 'The Ogallala Aquifer beneath the U.S. Great Plains is being drained faster than rain refills it in many places.', 'Groundwater supplies drinking water for billions of people, and overuse can dry up wells and make land sink.'],
        ['Geothermal', 'jee-oh-THUR-mul', 3, 'Relating to heat from within the Earth.', 'Iceland uses geothermal energy to heat most of its homes.', 'Plants using this heat run day and night, unlike wind and solar.', 'It provides steady, low-emission power wherever underground heat is accessible.'],
        ['Recycling', 'ree-SY-kling', 1, 'Collecting used materials and processing them into new products.', 'Recycling aluminum uses far less energy than making new aluminum from ore.', 'Recycled aluminum saves roughly 95 percent of the energy needed to make it from raw ore.', 'It reduces waste, saves energy, and conserves raw materials.'],
        ['Conservation', 'kon-sur-VAY-shun', 2, 'The careful protection and management of natural resources and ecosystems.', 'Conservation efforts helped the bald eagle recover from near disappearance in much of the United States.', 'It can mean preserving land untouched or using resources wisely so they last.', 'Protecting resources today keeps options open for future generations.'],
        ['Sustainability', 'suh-stay-nuh-BIL-ih-tee', 3, 'Meeting present needs without compromising the ability of future generations to meet their own.', 'Sustainability means using resources at a rate that nature can replenish.', 'The most-cited definition comes from the 1987 Brundtland Report, issued by a United Nations commission.', 'It links environmental health with economic and social well-being.'],
        ['Deforestation', 'dee-for-ih-STAY-shun', 3, 'The clearing of forests, usually to make room for farming, grazing, or building.', 'Deforestation in the Amazon is often driven by cattle ranching and soy farming.', 'Forests absorb carbon dioxide, so clearing them releases stored carbon and removes a natural sink.', 'Slowing it protects biodiversity, climate, and the livelihoods of forest communities.'],
        ['Biodegradable', 'by-oh-dih-GRAY-duh-bul', 4, 'Capable of being broken down by bacteria, fungi, or other living organisms.', 'Paper and food scraps are biodegradable, but many plastics are not.', 'A label saying so does not reveal how long breakdown takes or what conditions it needs, such as an industrial composter.', 'Reading the fine print prevents wasteful or misleading choices.'],
      ],
    },
  ],
});
