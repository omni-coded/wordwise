import { defineCategory } from '../author';

export default defineCategory({
  id: 'geography',
  name: 'Geography & World Cultures',
  shortName: 'Geography',
  blurb: 'Landscapes, climates, and the places where people live.',
  glyph: '◍',
  references: [
    'National Geographic Education (education.nationalgeographic.org)',
    'U.S. Geological Survey (usgs.gov)',
    'NOAA National Weather Service glossary (weather.gov/bgm/forecast_terms)',
    'United Nations World Urbanization Prospects (population.un.org/wup)',
  ],
  topics: [
    {
      id: 'landforms',
      name: 'Landforms',
      connection:
        'Peninsulas, isthmuses, archipelagos, and atolls describe how land and sea meet, while plateaus, escarpments, basins, and dunes show how land rises, falls, and is shaped by wind. Fjords and deltas are what glaciers and rivers leave behind.',
      rows: [
        ['Archipelago', 'ar-kih-PEL-uh-goh', 3, 'A chain or cluster of islands.', 'Indonesia is an archipelago of more than seventeen thousand islands.', 'The word originally referred to the Aegean Sea, dotted with islands, before it came to mean any island group.', 'Island chains shape fishing, shipping, cultures, and national borders.'],
        ['Peninsula', 'puh-NIN-suh-luh', 2, 'A piece of land almost surrounded by water and joined to a larger landmass.', "Italy's boot-shaped peninsula juts into the Mediterranean Sea.", 'Florida, Korea, and the Iberian Peninsula are well-known examples.', 'Peninsulas often become centers of trade and sea power because of their long coastlines.'],
        ['Isthmus', 'IS-mus', 3, 'A narrow strip of land connecting two larger landmasses and separating two bodies of water.', 'The Isthmus of Panama joins North and South America.', 'The Panama Canal cuts across the isthmus, letting ships avoid the long trip around South America.', 'Narrow land bridges are strategic chokepoints for trade and travel.'],
        ['Plateau', 'pla-TOH', 2, 'A broad, flat area of high ground that rises sharply above the surrounding land.', 'The Tibetan Plateau is so high that it is often called the roof of the world.', 'The Tibetan Plateau averages more than 4,500 meters above sea level.', 'Plateaus influence climate, river sources, and where people can farm or settle.'],
        ['Fjord', 'FEE-ord', 3, 'A long, narrow sea inlet with steep sides, carved by a glacier.', 'Norway is famous for dramatic fjord landscapes with cliffs rising straight from the water.', 'These inlets form when glaciers carve deep valleys that the sea later fills after the ice melts.', 'They are valuable for shipping and tourism, and they reveal the power of glacial erosion.'],
        ['Delta', 'DEL-tuh', 2, 'A landform created where a river slows and deposits sediment as it enters a larger body of water.', 'The Nile delta is a fertile triangle of farmland where the river meets the Mediterranean.', 'The name comes from the triangular Greek letter delta, which many river mouths resemble.', 'Deltas are rich farmland supporting hundreds of millions of people but are vulnerable to rising seas.'],
        ['Atoll', 'AT-ol', 3, 'A ring-shaped coral reef or chain of coral islands surrounding a lagoon.', 'The Maldives consist of coral atolls rising just above the sea.', 'Charles Darwin proposed that atolls form as volcanic islands sink while coral keeps growing upward, and later drilling supported the idea.', 'Low-lying atolls are among the places most exposed to sea-level rise.'],
        ['Escarpment', 'ih-SKARP-ment', 4, 'A long, steep slope or cliff that separates two areas of different elevation.', 'The Niagara Escarpment runs through Ontario, and Niagara Falls spills over it.', 'Such slopes form through faulting or through the erosion of differently resistant layers of rock.', 'They influence rainfall, drainage, and the routes of roads and railways.'],
        ['Basin', 'BAY-sun', 2, "An area of land that drains into a particular river or lake, or a large bowl-shaped depression in Earth's surface.", 'The Amazon basin collects water from rivers across several countries.', 'The Amazon basin holds the largest river system in the world by volume of water discharged.', 'River basins are the natural unit for managing water, floods, and ecosystems.'],
        ['Dune', 'DOON', 1, 'A mound or ridge of sand formed by wind.', 'Wind slowly pushes each dune across the desert, sometimes moving it several meters per year.', 'Some dunes in the Namib Desert rise more than 300 meters.', 'Dune movement affects roads, farms, and settlements in arid regions.'],
      ],
    },
    {
      id: 'climate-water',
      name: 'Climate & Water',
      connection:
        'Humidity and precipitation link air and water; monsoons and hurricanes are their great seasonal and stormy expressions, and drought is their absence. Glaciers, tributaries, and estuaries trace water’s journey to the sea, while tundra and savanna are the biomes that climate creates.',
      rows: [
        ['Monsoon', 'mon-SOON', 2, 'A seasonal reversal of wind direction that brings a distinct rainy season, notably to South Asia.', 'Farmers across South Asia time their planting around the arrival of the monsoon.', 'The word comes from the Arabic mawsim, meaning “season.”', 'Monsoon rains water the crops of hundreds of millions of people, while failed or excessive rains can cause famine or flooding.'],
        ['Tundra', 'TUN-druh', 2, 'A cold, treeless region where the subsoil stays frozen for much of the year.', 'Low shrubs, mosses, and lichens dominate the Arctic tundra.', 'The word comes from a Sami term, by way of Russian, for a treeless plain.', 'It stores huge amounts of carbon in frozen soil, which warming could release.'],
        ['Estuary', 'ES-choo-air-ee', 3, 'The wide, tidal mouth of a river where fresh water mixes with salt water from the sea.', 'Oyster beds and migrating fish thrive in the estuary where the river meets the sea.', 'Estuaries are among the most productive ecosystems on Earth, serving as nurseries for many fish species.', 'They filter pollutants, buffer storms, and support fisheries.'],
        ['Glacier', 'GLAY-sher', 2, 'A large, slowly moving mass of ice formed from compacted snow over many years.', 'The glacier carved a deep valley as it crept downhill over thousands of years.', "Ice sheets and glaciers hold about two-thirds of the world's fresh water.", 'Shrinking glaciers raise sea levels and reduce dry-season water supplies for many regions.'],
        ['Tributary', 'TRIB-yoo-tair-ee', 3, 'A stream or river that flows into a larger river or lake.', 'The Missouri is the longest tributary of the Mississippi River.', "Together, tributaries supply the water that makes up a main river's flow.", 'Tracing tributaries is key to flood forecasting and water management.'],
        ['Savanna', 'suh-VAN-uh', 2, 'A tropical grassland with scattered trees and a pronounced dry season.', 'Lions, zebras, and elephants roam the African savanna.', 'Fire and grazing help prevent savannas from turning into dense forest.', 'Savannas support wildlife and herding communities across Africa, Australia, and South America.'],
        ['Humidity', 'hyoo-MID-ih-tee', 2, 'The amount of water vapor in the air.', 'High humidity makes hot days feel hotter because sweat evaporates more slowly.', 'Relative humidity compares the moisture in the air with the most the air could hold at that temperature.', 'It affects comfort, health, weather, and how buildings and food are stored.'],
        ['Precipitation', 'prih-sip-ih-TAY-shun', 3, 'Water that falls from clouds to the ground as rain, snow, sleet, or hail.', 'The desert receives less than 250 millimeters of precipitation each year.', 'Meteorologists measure rain with gauges and express snow by its water equivalent.', 'Precipitation patterns determine where crops grow and where water is scarce.'],
        ['Drought', 'DROWT', 2, 'A prolonged period of abnormally low rainfall that causes water shortages.', 'The multi-year drought dried reservoirs and cut the harvest.', 'Droughts are classified as meteorological, agricultural, hydrological, or socioeconomic depending on what they affect.', 'Monitoring drought helps governments protect food and water supplies.'],
        ['Hurricane', 'HUR-ih-kayn', 2, 'A large, rotating tropical storm with sustained winds of at least 74 miles per hour.', 'Coastal communities evacuate when a hurricane approaches.', 'The same type of storm is called a typhoon in the northwest Pacific and a cyclone in the Indian Ocean and South Pacific.', 'Early warnings and evacuation plans save lives during these storms.'],
      ],
    },
    {
      id: 'people-places',
      name: 'People & Places',
      connection:
        'Latitude and longitude locate places, hemispheres divide the globe, topography describes its shape, and cartography turns all of that into maps. Demographics, migration, diaspora, urbanization, and the metropolis describe where and how people live.',
      rows: [
        ['Urbanization', 'ur-buh-nih-ZAY-shun', 3, 'The increasing share of a population living in cities and towns.', 'Rapid urbanization is turning farmland into suburbs around many fast-growing cities.', "The United Nations estimates that more than half of the world's people now live in urban areas.", 'Urban growth drives demand for housing, transport, jobs, and services.'],
        ['Demographics', 'dem-uh-GRAF-iks', 3, 'Statistical data about the characteristics of a population, such as age, income, and education.', 'Changing demographics, such as an aging population, affect healthcare and pension planning.', 'Governments gather this data through censuses, which many countries conduct every ten years.', 'Businesses and governments use demographics to plan schools, services, and markets.'],
        ['Diaspora', 'dy-AS-puh-ruh', 3, 'A population that has spread from its original homeland to other parts of the world, often keeping cultural ties.', 'The Indian diaspora spans every continent, with communities that share festivals and food.', 'The word comes from the Greek for “scattering” and was first used for dispersed Jewish communities.', 'Diasporas influence trade, politics, and culture in both their new homes and their homelands.'],
        ['Migration', 'my-GRAY-shun', 2, 'The movement of people, or of animals, from one place to another, usually to live or work.', 'Economic opportunity and conflict are major drivers of human migration.', 'Arctic terns migrate tens of thousands of kilometers each year between polar regions.', 'Migration reshapes economies, cultures, and political debates around the world.'],
        ['Metropolis', 'meh-TROP-uh-liss', 3, 'A very large, important city, often with surrounding suburbs and a major cultural or economic role.', 'Tokyo is a metropolis of more than thirty million people in its wider region.', 'The word comes from Greek and means “mother city,” the city that founded colonies.', 'Metropolitan areas drive national economies and face challenges like congestion and housing costs.'],
        ['Cartography', 'kar-TOG-ruh-fee', 3, 'The art and science of making maps.', 'Modern cartography blends satellite imagery, surveying, and software.', 'No flat map can show Earth without distortion; the Mercator map, for example, enlarges regions far from the equator.', 'Knowing how maps distort helps people read them critically.'],
        ['Latitude', 'LAT-ih-tood', 2, 'Distance north or south of the equator, measured in degrees.', 'Latitude strongly influences climate, since places near the equator receive more direct sunlight.', 'The equator is 0 degrees, and the poles are 90 degrees north and south.', 'It helps explain climate zones, seasons, and day length.'],
        ['Longitude', 'LON-jih-tood', 2, 'Distance east or west of the prime meridian, measured in degrees.', 'Longitude determines local time, since Earth rotates through 15 degrees of longitude every hour.', "Calculating longitude at sea was a major problem until John Harrison's marine clocks in the 18th century.", 'Latitude and longitude together can identify any place on Earth, which makes GPS possible.'],
        ['Topography', 'tuh-POG-ruh-fee', 3, 'The shape and features of the land surface, including its hills, valleys, and slopes.', 'A topography map uses contour lines to show elevation.', 'On such maps, lines packed closely together indicate steep terrain.', 'It determines where water flows, where roads can be built, and how hikers plan routes.'],
        ['Hemisphere', 'HEM-ih-sfeer', 2, 'One half of the Earth, divided by the equator into north and south or by the prime meridian into east and west.', 'Seasons are reversed between the northern hemisphere and the southern hemisphere.', "Roughly two-thirds of Earth's land lies in the Northern Hemisphere.", 'Hemispheres help describe seasons, climate patterns, and positions on maps.'],
      ],
    },
  ],
});
