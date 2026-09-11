// =========================================================================
// KURUKSHETRA PS20: AGENTIC DISASTER RELIEF
// Historical Indian Disaster Knowledge Base (RAG Seed Data)
// FILE: lib/ai/historical-disasters.ts
// =========================================================================

export interface HistoricalDisaster {
  id: string;
  name: string;
  year: number;
  type: "flood" | "cyclone" | "earthquake" | "landslide" | "fire" | "cloudburst";
  location: string;
  state: string;
  severity: "critical" | "high" | "moderate";
  casualties: number;
  displaced: number;
  successful_measures: string[];
  lessons_learned: string[];
  tactical_precedent: string;
}

export const HISTORICAL_INDIAN_DISASTERS: HistoricalDisaster[] = [
  {
    id: "kerala-floods-2018",
    name: "Kerala Flash Inundation & Dam Overflows",
    year: 2018,
    type: "flood",
    location: "Periyar, Pamba, Chalakudy Basins",
    state: "Kerala",
    severity: "critical",
    casualties: 483,
    displaced: 1400000,
    successful_measures: [
      "Early mobilization of 4,500 civilian coastal fishermen with 669 motorized country boats",
      "Converting 3,200 schools and community halls into decentralized relief hubs within 12 hours",
      "Air-dropping 200,000 food packets and potable water sachets by Indian Navy Sea King helicopters",
      "Creation of state crowdsourcing portal (keralarescue.in) for precise GPS citizen rescue tracking"
    ],
    lessons_learned: [
      "Dam sluice gate releases required coordinated stepped discharge 8 hours earlier",
      "Cell towers collapsed within 18 hours; satellite communications needed at every district collectorate",
      "Submerged arterial roads blocked 10-ton military trucks; required shallow-draft inflatable rafts"
    ],
    tactical_precedent: "Kerala Floods 2018: 669 civilian fishing craft rescued 65,000 citizens from 2-meter deep waters where military trucks could not enter."
  },
  {
    id: "cyclone-fani-2019",
    name: "Extremely Severe Cyclonic Storm Fani",
    year: 2019,
    type: "cyclone",
    location: "Puri, Bhubaneswar, Cuttack Coastal Belt",
    state: "Odisha",
    severity: "critical",
    casualties: 89,
    displaced: 1200000,
    successful_measures: [
      "Mass proactive evacuation of 1.2 million citizens within 72 hours into 7,000 multi-purpose cyclone shelters",
      "Pre-positioning of 54 NDRF and ODRAF task forces with high-capacity diesel chainsaws",
      "Multi-channel warning dispatch: 2.6 million localized SMS broadcasts, public address sirens, and door-to-door siren trucks",
      "Pre-stocking 15 days of dry rations, chlorine tablets, and snake-venom antiserums at shelter sites"
    ],
    lessons_learned: [
      "Telecom grid destroyed across 4 districts taking 14 days to restore; required mobile COW (Cell on Wheels) generator trailers",
      "Overhead power lines sheared; underground conduit power transmission protected core hospital lines"
    ],
    tactical_precedent: "Cyclone Fani 2019: 1.2M citizens evacuated in 72h reduced potential fatalities by 95% compared to 1999."
  },
  {
    id: "chennai-floods-2015",
    name: "Chennai Urban Deluge & Reservoir Breach",
    year: 2015,
    type: "flood",
    location: "Adyar and Cooum River Corridors",
    state: "Tamil Nadu",
    severity: "critical",
    casualties: 470,
    displaced: 1800000,
    successful_measures: [
      "NDRF deployment of 50 inflatable rescue boats directly on submerged Mount Road and Velachery corridors",
      "Decentralized citizen volunteer geo-tagging via social media and SMS relays",
      "Emergency triage hospital boats evacuating bedridden patients from flooded ground-floor clinics"
    ],
    lessons_learned: [
      "Chembarambakkam reservoir outflow warning was issued without granular downstream contour maps",
      "Airport runway flooded due to Adyar river backwater; helipads needed on elevated hospital rooftops",
      "Mobile ATM vans and temporary cash distribution points needed when power grid collapsed"
    ],
    tactical_precedent: "Chennai Floods 2015: Rapid deployment of inflatable boat flotillas into narrow urban gullies saved 22,000 stranded residents."
  },
  {
    id: "bhuj-earthquake-2001",
    name: "Kutch Intraplate Mw 7.7 Earthquake",
    year: 2001,
    type: "earthquake",
    location: "Bhuj, Anjar, Bhachau, Kutch",
    state: "Gujarat",
    severity: "critical",
    casualties: 20085,
    displaced: 400000,
    successful_measures: [
      "Immediate establishment of Indian Armed Forces 200-bed tent field hospital within 6 hours",
      "Heavy earth-moving excavator convoys dispatched along cleared emergency bypass arteries",
      "Distribution of water purifying mobile purification units processing 10,000L/hour"
    ],
    lessons_learned: [
      "Collapse of district civil hospital killed medical staff; emergency triage command must be housed in seismic-grade geodesic dome tents",
      "First 24-hour 'Golden Hour' search-and-rescue efficiency dictates 80% of live extractions",
      "Need acoustic listening devices and thermal imaging cameras for trapped void detection"
    ],
    tactical_precedent: "Bhuj Earthquake 2001: Mobile tent surgical units deployed within 6 hours performed 3,400 life-saving amputations and trauma stabilizations."
  },
  {
    id: "cyclone-biparjoy-2023",
    name: "Very Severe Cyclonic Storm Biparjoy",
    year: 2023,
    type: "cyclone",
    location: "Kutch and Saurashtra Coastline",
    state: "Gujarat",
    severity: "high",
    casualties: 4,
    displaced: 108000,
    successful_measures: [
      "Zero-casualty targeted strategy achieved via preemptive evacuation of 108,000 citizens from 0-10km coastal band",
      "Preemptive shutdown of coastal industrial power grids to prevent live wire electrocutions",
      "Deployment of 30 specialized animal rescue squads saving 1,500 livestock from storm surge"
    ],
    lessons_learned: [
      "Port infrastructure cranes and cargo containers required tie-down anchoring 48 hours prior",
      "Salt pans flooded, requiring freshwater tanker mobilization for 30,000 salt-pan workers"
    ],
    tactical_precedent: "Cyclone Biparjoy 2023: Total power grid preemptive de-energization prevented electrocution fatalities completely."
  },
  {
    id: "uttarakhand-flashfloods-2013",
    name: "Kedarnath Glacial Lake Outburst & Cloudburst",
    year: 2013,
    type: "cloudburst",
    location: "Mandakini Valley, Kedarnath, Rudraprayag",
    state: "Uttarakhand",
    severity: "critical",
    casualties: 5700,
    displaced: 100000,
    successful_measures: [
      "IAF Operation Surya Hope & Operation Rahat: 45 helicopters flying 3,700 sorties evacuating 100,000 pilgrims",
      "Army engineering regiments building improvised footbridges across swollen torrents in under 8 hours",
      "Rope-and-pulley river traverses extracting survivors across 80-meter gorge torrents"
    ],
    lessons_learned: [
      "Single-artery mountain roads destroyed by landslides; required pre-positioned secondary helipads",
      "Lack of Doppler weather radar in mountain valleys delayed cloudburst alerts by 4 critical hours",
      "Satellite phones essential for high-altitude team leaders"
    ],
    tactical_precedent: "Kedarnath 2013: Operation Surya Hope evacuated 100,000 survivors via coordinated helicopter air-corridors over destroyed road networks."
  },
  {
    id: "cyclone-amphan-2020",
    name: "Super Cyclonic Storm Amphan",
    year: 2020,
    type: "cyclone",
    location: "Sundarbans, Kolkata, South 24 Parganas",
    state: "West Bengal & Odisha",
    severity: "high",
    casualties: 98,
    displaced: 3000000,
    successful_measures: [
      "Evacuation of 3 million citizens while maintaining pandemic shelter distancing and masks",
      "Immediate clearance of 15,000 uprooted trees in metro Kolkata by joint Army and NDRF teams",
      "Sundarbans riverine speedboats pre-positioned for island community rescue"
    ],
    lessons_learned: [
      "Saline seawater breached river embankments, destroying agricultural soil for 3 years",
      "Need rapid-assembly geotextile sandbag barriers along earthen dikes"
    ],
    tactical_precedent: "Cyclone Amphan 2020: Joint Army-NDRF road clearing taskforces cleared 15,000 arterial obstructions within 72 hours."
  },
  {
    id: "chamoli-disaster-2021",
    name: "Rishi Ganga Glacial Rock & Ice Avalanche",
    year: 2021,
    type: "flood",
    location: "Tapovan, Dhauliganga, Chamoli",
    state: "Uttarakhand",
    severity: "high",
    casualties: 204,
    displaced: 2500,
    successful_measures: [
      "Thermal drone scouting and ground-penetrating radar deployed to map Tapovan intake tunnel",
      "Simultaneous air-lifting of 12 heavy pumping sets by Mi-17 helicopters to dewater subterranean shafts",
      "Deployment of canine search squads for buried survivor scent detection"
    ],
    lessons_learned: [
      "Deep subterranean silt sludge hardened within 24 hours; required heavy hydraulic excavators flown in by Chinook helicopters",
      "Automated acoustic stream gauges needed upstream of hydro projects"
    ],
    tactical_precedent: "Chamoli 2021: Thermal drone mapping enabled pinpointing underground tunnel survivors without risking secondary collapses."
  },
  {
    id: "cyclone-hudhud-2014",
    name: "Very Severe Cyclonic Storm Hudhud",
    year: 2014,
    type: "cyclone",
    location: "Visakhapatnam, Vizianagaram, Srikakulam",
    state: "Andhra Pradesh",
    severity: "high",
    casualties: 124,
    displaced: 248000,
    successful_measures: [
      "Pre-positioning of amateur HAM radio operators at District Emergency Operation Centers (DEOC)",
      "Naval Base Eastern Naval Command deploying INS Satpura and INS Ranvir with disaster relief bricks",
      "Satellite telephone distribution to 40 mandal revenue officers"
    ],
    lessons_learned: [
      "Roofing sheets sheared by 200 km/h winds turned into dangerous flying debris; mandatory shelter anchoring codes",
      "Airport radar dome destroyed; required trailer-mounted mobile air traffic control units"
    ],
    tactical_precedent: "Cyclone Hudhud 2014: Amateur HAM radio networks maintained 100% uninterrupted comms when all commercial cellular networks failed."
  },
  {
    id: "assam-floods-2020",
    name: "Brahmaputra Basin Severe Monsoon Inundation",
    year: 2020,
    type: "flood",
    location: "Barpeta, Dhemaji, Kaziranga",
    state: "Assam",
    severity: "moderate",
    casualties: 118,
    displaced: 5300000,
    successful_measures: [
      "Highland artificial earthen mounds constructed inside Kaziranga providing safe haven for 80% wildlife",
      "Boat-mounted mobile primary healthcare clinics treating waterborne diarrhea in marooned river islands (chars)",
      "Distribution of floating water purification kits producing 500L/hour from river water"
    ],
    lessons_learned: [
      "Repeated annual breach of earthen bunds; transition to reinforced geobag revetments",
      "Mosquito-borne vector disease surge post-receding waters; required aerial insecticide fogging"
    ],
    tactical_precedent: "Assam Floods 2020: Solar-powered floating boat clinics maintained daily medicine and potable water supplies to cut-off char communities."
  },
  {
    id: "latur-earthquake-1993",
    name: "Killari Intraplate Mw 6.2 Shallow Earthquake",
    year: 1993,
    type: "earthquake",
    location: "Latur, Osmanabad, Marathwada",
    state: "Maharashtra",
    severity: "critical",
    casualties: 9748,
    displaced: 300000,
    successful_measures: [
      "Mobilization of 15,000 army troops establishing temporary tent encampments with sanitation latrines",
      "Rapid dispatch of 50,000 corrugated tin sheets and wooden pillars for monsoon-proof transitional shelters",
      "Immediate epidemiological water testing preventing cholera epidemics"
    ],
    lessons_learned: [
      "Stone-and-mud traditional masonry houses collapsed entirely; prompted India's modern rural earthquake building code",
      "Debris clearance without hydraulic shears delayed live victim rescue in collapsed stone rubble"
    ],
    tactical_precedent: "Latur Earthquake 1993: Immediate chlorine dosing of rural open wells prevented deadly cholera outbreaks among 300,000 displaced survivors."
  },
  {
    id: "odisha-supercyclone-1999",
    name: "1999 Odisha Super Cyclonic Storm",
    year: 1999,
    type: "cyclone",
    location: "Paradip, Jagatsinghpur, Kendrapara",
    state: "Odisha",
    severity: "critical",
    casualties: 9887,
    displaced: 15000000,
    successful_measures: [
      "Catalyzed the creation of NDMA (National Disaster Management Authority) and India's first dedicated SDRF units",
      "Construction of 1,000 reinforced concrete elevated cyclone shelters with dedicated backup water reservoirs",
      "Formation of coastal village disaster management committees with hand-cranked siren systems"
    ],
    lessons_learned: [
      "Total absence of early multi-channel warning systems caused catastrophic storm surge casualties",
      "Tidal surge reached 7 meters; single-story structures completely inundated up to 20 km inland"
    ],
    tactical_precedent: "Odisha Super Cyclone 1999: Institutional foundation for India's entire modern disaster management structure and shelter network."
  }
];
