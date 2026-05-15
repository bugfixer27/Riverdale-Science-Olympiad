// Riverdale Science Olympiad site data.
// Edit this file when the season changes: events, regional results, assignments, and leaders live here.

const TEAM_LEADERS = ["Florian", "Rohan", "Luke"];
const LEADERS_PASSWORD = "Riverdale5250";
const LEADERS_BUDGET_URL = "https://docs.google.com/spreadsheets/d/1gzxt-oxuxjCn4QsGHNc7KWcdt2OTQQNqS9WfYuAIvn8/edit";

// Optional leader-only roster notes. Leave fields blank until you have details to add.
// Example:
// "Student Name": {
//   notes: "Strong binder builder; pair with a build teammate.",
//   practiceTests: {
//     "Astronomy": "42/60 on Jan practice test"
//   }
// }
const STUDENT_PROFILES = {};

// ============ 2026 EVENT DATA ============
// Each event card and event modal is generated from this list.
const EVENTS = [
  {
    id: "anatomy",
    name: "Anatomy and Physiology",
    type: "study",
    icon: "🫀",
    shortDesc: "Written test on human body systems, focusing on designated organ systems each year.",
    overview: "A written test covering the anatomy and physiology of designated human body systems. For 2026, the focus areas are the integumentary, immune/lymphatic, and urinary systems. Questions address structure, function, diseases/disorders, and clinical connections.",
    rules: [
      "2 participants per team.",
      "Open-note event — each team may bring one 3-ring binder of any size with any notes, printed materials, or tabs.",
      "Test content covers the integumentary system, immune/lymphatic system, and urinary system for the 2026 season.",
      "Questions may include multiple choice, short answer, fill-in-the-blank, diagrams to label, and data interpretation.",
      "50-minute time limit.",
      "No electronic devices or calculators unless specified by the event supervisor."
    ],
    tips: "<strong>Build a comprehensive binder early.</strong> Focus on the integumentary, immune/lymphatic, and urinary systems for 2026. Use labeled diagrams, disease tables, and physiology flowcharts. Khan Academy and Crash Course Anatomy are excellent free resources. Practice labeling blank diagrams from memory.",
    wikiSlug: "Anatomy_and_Physiology",
    soincSlug: "anatomy-and-physiology-c"
  },
  {
    id: "astronomy",
    name: "Astronomy",
    type: "study",
    icon: "🔭",
    shortDesc: "Written test on stellar evolution, star formation, and the interstellar medium.",
    overview: "A written test covering observational and theoretical aspects of astronomy. The 2026 focus is stellar evolution (including the HR diagram, main sequence, post-main-sequence stages), star formation, and the interstellar medium. Data analysis skills with real astronomical data are tested.",
    rules: [
      "2 participants per team.",
      "Open-note event — each team may bring one 3-ring binder of any size.",
      "Content focuses on stellar evolution, star formation, and the interstellar medium for the 2026 season.",
      "Questions may include data analysis, graph interpretation, calculations, and image identification.",
      "Calculators (non-programmable) are permitted.",
      "50-minute time limit."
    ],
    tips: "<strong>Master the Hertzsprung-Russell diagram.</strong> Know stellar evolution stages cold — from molecular clouds through main sequence to white dwarfs, neutron stars, and black holes. Build a binder organized by topic: stellar physics, ISM, star formation. Practice interpreting spectra and light curves.",
    wikiSlug: "Astronomy",
    soincSlug: "astronomy-c"
  },
  {
    id: "boomilever",
    name: "Boomilever",
    type: "build",
    icon: "🏗️",
    shortDesc: "Build a cantilevered structure from wood to support maximum load.",
    overview: "Teams design and build a Boomilever — a cantilevered structure mounted to a vertical wall that extends horizontally and supports a load at its free end. The score is based on the ratio of load held to the mass of the device.",
    rules: [
      "2 participants per team; device must be built before the event.",
      "The Boomilever must be constructed from wood (basswood or balsa as specified) and glue only.",
      "The device is mounted to a vertical testing wall and must extend horizontally to a specified length.",
      "A load is applied at the free end of the Boomilever until it breaks or the maximum load is reached.",
      "Score = load held ÷ mass of the Boomilever (efficiency ratio).",
      "The device must meet specified dimensional constraints for height, width, and length."
    ],
    tips: "<strong>Design for the efficiency ratio, not just raw strength.</strong> Use triangulated truss structures and test multiple designs. Weigh every component meticulously. Learn from each test failure. Thin, well-glued joints often outperform thicker, sloppy ones. Build 2–3 full test Boomilevers before competition.",
    wikiSlug: "Boomilever",
    soincSlug: "boomilever-c"
  },
  {
    id: "bungee_drop",
    name: "Bungee Drop",
    type: "build",
    icon: "📏",
    shortDesc: "Build a bungee cord system to drop a mass as close to the floor as possible.",
    overview: "Teams construct a bungee cord apparatus using specified elastic materials to drop a mass from a set height so it stops as close to the floor as possible without touching it. Emphasizes physics of elasticity and precise engineering.",
    rules: [
      "2 participants per team; cord system constructed before the event.",
      "The bungee cord must be made from approved elastic materials (typically rubber bands or bungee cord).",
      "A standardized mass is attached and dropped from a height that is revealed at competition.",
      "Score is based on the closest approach to the ground without the mass touching the floor.",
      "Teams may be given a limited number of practice drops.",
      "No electronic sensors or computational devices may be used during the drop."
    ],
    tips: "<strong>Calibrate extensively at multiple drop heights.</strong> Your cord system must be adjustable on-the-fly since the drop height is revealed at the event. Understand Hooke's Law and elastic potential energy. Build a lookup table of cord length vs. drop height based on your specific materials.",
    wikiSlug: "Bungee_Drop",
    soincSlug: "bungee-drop-c"
  },
  {
    id: "chem_lab",
    name: "Chemistry Lab",
    type: "lab",
    icon: "⚗️",
    shortDesc: "Hands-on chemistry lab tasks and a written test on chemistry concepts.",
    overview: "Teams perform hands-on chemistry laboratory procedures and answer questions on chemistry concepts. The 2026 topics include solutions chemistry, equilibrium, acid-base chemistry, and thermochemistry.",
    rules: [
      "2 participants per team; safety goggles and closed-toe shoes required.",
      "Hands-on tasks may include titration, calorimetry, identifying unknowns, or measuring reaction rates.",
      "A written component tests conceptual chemistry knowledge and calculation skills.",
      "Teams may bring a binder and a non-programmable calculator.",
      "50-minute time limit total for lab + written portions.",
      "Points awarded for accurate measurements, correct identification, and written answers."
    ],
    tips: "<strong>Practice titration until it's automatic.</strong> Know your significant figures, stoichiometry, molarity, pH calculations, and thermochemistry equations (q=mcΔT). The written portion often covers topics beyond what's in the lab, so study broadly. Coordinate with your partner so you divide tasks efficiently.",
    wikiSlug: "Chemistry_Lab",
    soincSlug: "chem-lab-c"
  },
  {
    id: "circuit_lab",
    name: "Circuit Lab",
    type: "lab",
    icon: "🔌",
    shortDesc: "Build and analyze electrical circuits, plus a written test on circuit theory.",
    overview: "Teams complete hands-on circuit-building tasks and answer questions on DC and AC circuit theory. Tasks may involve constructing circuits from schematics, measuring voltage/current/resistance, and analyzing circuit behavior.",
    rules: [
      "2 participants per team.",
      "Hands-on tasks include building circuits, taking measurements with multimeters, and analyzing data.",
      "Written test covers Ohm's law, Kirchhoff's laws, series/parallel circuits, RC circuits, and component behavior.",
      "Teams may bring a binder and a non-programmable calculator.",
      "50-minute time limit.",
      "Participants must be able to interpret circuit schematics and use provided lab equipment."
    ],
    tips: "<strong>Master Ohm's law and Kirchhoff's laws inside-out.</strong> Practice building circuits on breadboards with resistors, capacitors, and LEDs. Know how to use a multimeter quickly. Study series and parallel combinations, voltage dividers, and RC time constants. Hands-on practice is irreplaceable.",
    wikiSlug: "Circuit_Lab",
    soincSlug: "circuit-lab-c"
  },
  {
    id: "codebusters",
    name: "Codebusters",
    type: "study",
    icon: "🔐",
    shortDesc: "Decode encrypted messages using classical and modern cipher techniques.",
    overview: "Teams decode and encode messages using classical cryptography techniques including Caesar, Vigenère, Baconian, Morse, and more. The event tests speed, accuracy, and knowledge of cryptanalysis methods.",
    rules: [
      "Up to 3 participants for this event.",
      "Teams are given encrypted messages and must decode them within the time limit.",
      "Common ciphers: Caesar, Atbash, Vigenère, Rail Fence, Affine, Aristocrat, Patristocrat, Baconian, Hill Cipher.",
      "A timed question may be included where the first team to answer correctly earns bonus points.",
      "No electronic devices allowed.",
      "50-minute time limit."
    ],
    tips: "<strong>Memorize common cipher algorithms cold.</strong> Practice doing frequency analysis quickly by hand. Make a cheat sheet of all tested ciphers with worked examples. Time yourself decoding aristocrats — speed matters. The scioly.org wiki has a fantastic Codebusters page with practice sets.",
    wikiSlug: "Codebusters",
    soincSlug: "codebusters-c"
  },
  {
    id: "designer_genes",
    name: "Designer Genes",
    type: "study",
    icon: "🧬",
    shortDesc: "Written test on molecular and classical genetics, biotechnology, and heredity.",
    overview: "A written test covering classical genetics, molecular genetics, biotechnology, and genetic engineering. Topics include DNA/RNA structure, gene expression, Mendelian and non-Mendelian inheritance, and applications of modern genetic technology.",
    rules: [
      "2 participants per team.",
      "Open-note event — teams may bring one 3-ring binder of any size.",
      "Content includes DNA replication, transcription, translation, gene regulation, inheritance patterns, pedigree analysis, and biotechnology applications.",
      "Questions may include multiple choice, short answer, data analysis, and pedigree/genetics problems.",
      "Calculators (non-programmable) are permitted.",
      "50-minute time limit."
    ],
    tips: "<strong>Master the central dogma of molecular biology.</strong> Know how to solve genetics problems — monohybrid crosses, dihybrid crosses, sex-linked traits, epistasis, and pedigree analysis. Study CRISPR, PCR, gel electrophoresis, and other biotech applications. Your binder should have worked examples of every problem type.",
    wikiSlug: "Designer_Genes",
    soincSlug: "designer-genes-c"
  },
  {
    id: "disease_detectives",
    name: "Disease Detectives",
    type: "study",
    icon: "🦠",
    shortDesc: "Written test on epidemiology, public health, and disease investigation.",
    overview: "Teams analyze epidemiological scenarios to identify disease sources, modes of transmission, and public health responses. The event combines data analysis with content knowledge about pathogens and public health methodology.",
    rules: [
      "2 participants per team; open-note with resource binder.",
      "Questions may include case study analysis, attack rate calculations, outbreak maps, and epidemiological curves.",
      "Content covers infectious and chronic disease, epidemiology terminology, surveillance systems, and outbreak investigation steps.",
      "Calculations may include relative risk, odds ratio, attack rate, and incubation periods.",
      "50-minute time limit."
    ],
    tips: "<strong>Know the 10 steps of outbreak investigation cold.</strong> Practice calculating attack rates and relative risk from 2×2 tables. Familiarize yourself with major pathogen types (bacterial, viral, parasitic), their transmission modes, and treatments. Past CDC MMWR reports are excellent study material.",
    wikiSlug: "Disease_Detectives",
    soincSlug: "disease-detectives-c"
  },
  {
    id: "dynamic_planet",
    name: "Dynamic Planet",
    type: "study",
    icon: "🌍",
    shortDesc: "Earth science written test; 2026 focus on Earth's freshwater.",
    overview: "A written test on Earth science topics. The 2026 focus is Earth's freshwater — including groundwater, rivers, lakes, glaciers, and the hydrologic cycle. Data interpretation, map reading, and calculations are major components.",
    rules: [
      "2 participants per team; open-note binder permitted.",
      "Questions include data analysis, map reading, calculations, and conceptual Earth science.",
      "50-minute time limit.",
      "Charts, graphs, satellite images, and topographic maps may be included.",
      "2026 focus: Earth's freshwater (groundwater, surface water, glaciers, hydrologic cycle)."
    ],
    tips: "<strong>Go deep on freshwater systems for 2026.</strong> Build a binder organized around the hydrologic cycle, groundwater flow, river geomorphology, and glacier dynamics. Practice interpreting topographic maps and water table diagrams. The Dynamic Planet wiki page has study guides for each focus area.",
    wikiSlug: "Dynamic_Planet",
    soincSlug: "dynamic-planet-c"
  },
  {
    id: "electric_vehicle",
    name: "Electric Vehicle",
    type: "build",
    icon: "🚗",
    shortDesc: "Build a battery-powered vehicle to travel a precise distance and stay on course.",
    overview: "Teams construct a vehicle powered by electrical energy to travel a specified distance along a straight track, stopping as close to the target point as possible. Precision engineering and repeatability are key.",
    rules: [
      "2 participants per team; vehicle built before the event.",
      "Vehicle must be entirely battery-powered using approved battery types.",
      "The target distance is revealed at the competition.",
      "Score is based on how close the vehicle stops to the target point.",
      "Vehicle must fit within specified dimensional constraints.",
      "No remote control allowed; the vehicle must run autonomously after being released."
    ],
    tips: "<strong>Build an easily adjustable timing or distance control mechanism.</strong> Most teams use a timer circuit or measured wheel rotations. Test extensively at various distances. Rubber wheel traction and smooth surface contact are critical. Keep a lookup table of settings vs. distance.",
    wikiSlug: "Electric_Vehicle",
    soincSlug: "electric-vehicle-c"
  },
  {
    id: "entomology",
    name: "Entomology",
    type: "study",
    icon: "🐛",
    shortDesc: "Identify insect specimens and answer questions on insect biology and ecology.",
    overview: "Teams identify insect specimens at stations and answer questions about insect biology, classification, ecology, and life cycles. Knowledge of insect orders and families, as well as their economic and ecological importance, is required.",
    rules: [
      "2 participants per team; resource binder permitted.",
      "Station-based identification of pinned or preserved insect specimens.",
      "Written questions on insect anatomy, classification, life cycles, and ecology.",
      "Teams must identify insects to the taxonomic level specified (typically order, sometimes family).",
      "50-minute time limit across all stations.",
      "Know common and scientific names for major insect orders."
    ],
    tips: "<strong>Learn the major insect orders by sight and by key characteristics.</strong> Focus on distinguishing features: wing type, mouthparts, antennae, and metamorphosis type. Use online insect identification keys and the scioly.org wiki Entomology page for practice images. Flashcards with specimen photos are extremely effective.",
    wikiSlug: "Entomology",
    soincSlug: "entomology-c"
  },
  {
    id: "experimental_design",
    name: "Experimental Design",
    type: "lab",
    icon: "🧫",
    shortDesc: "Design, conduct, and analyze an experiment with provided materials.",
    overview: "Teams are given a set of materials and a general topic, then must design, conduct, and present a full scientific experiment — including hypothesis, procedure, data collection, analysis, and conclusions — all within the time limit.",
    rules: [
      "Up to 3 participants; all work done during the event with provided materials.",
      "Teams have approximately 50 minutes to complete the entire process.",
      "Must include: research question, hypothesis, variables (IV/DV/controlled), procedure, data table, graph, statistical analysis, and conclusion.",
      "No pre-written materials allowed; only the provided materials may be used.",
      "Scored on scientific rigor, experimental design quality, data analysis, and communication."
    ],
    tips: "<strong>Practice the scientific method under time pressure.</strong> Assign roles: one person leads design and writes, another collects data, the third graphs. Know how to make a proper data table and graph quickly. Include multiple trials and calculate mean + standard deviation. Practice articulating error sources clearly.",
    wikiSlug: "Experimental_Design",
    soincSlug: "experimental-design-c"
  },
  {
    id: "forensics",
    name: "Forensics",
    type: "lab",
    icon: "🔬",
    shortDesc: "Analyze forensic evidence using scientific techniques and solve a scenario.",
    overview: "Teams use analytical chemistry, biology, and physics techniques to analyze evidence and solve a forensic scenario. Tasks may include chromatography, hair/fiber analysis, blood typing, soil analysis, and more.",
    rules: [
      "2 participants per team; safety equipment required.",
      "Tasks are lab-based and completed during the event with provided materials.",
      "A written component tests forensic science concepts and reasoning.",
      "50-minute time limit total.",
      "Common analyses: chromatography, unknown substance ID, microscopy, fingerprint analysis, fiber/hair comparison.",
      "Score based on correct analysis, evidence interpretation, and written answers."
    ],
    tips: "<strong>Practice the lab techniques listed in the 2026 rules.</strong> Know Rf values in chromatography, how to read microscope slides, and chemical spot tests. The written component often includes forensic case analysis — study real case methodology. Speed and accuracy both matter in this event.",
    wikiSlug: "Forensics",
    soincSlug: "forensics-c"
  },
  {
    id: "helicopter",
    name: "Helicopter",
    type: "build",
    icon: "🚁",
    shortDesc: "Build a rubber-powered helicopter for maximum flight time.",
    overview: "Teams design, build, and fly a rubber-powered helicopter to achieve the longest flight time. The helicopter must take off from the floor and stay aloft as long as possible within the testing area.",
    rules: [
      "2 participants per team; helicopter built before the event.",
      "The helicopter must be powered solely by a rubber band motor.",
      "The device must take off from the floor under its own power.",
      "Score is based on total flight time (longer is better).",
      "The helicopter must remain within the designated flight area during the flight.",
      "There may be a written test component on aerodynamics and flight principles."
    ],
    tips: "<strong>Optimize your rotor blade design for maximum lift at low RPM.</strong> Balance is critical — an unbalanced helicopter wastes energy wobbling. Wind your rubber band motor carefully and consistently. Test in a large indoor space. Study basic aerodynamic principles for the written test.",
    wikiSlug: "Helicopter",
    soincSlug: "helicopter-c"
  },
  {
    id: "hovercraft",
    name: "Hovercraft",
    type: "build",
    icon: "🛸",
    shortDesc: "Build a hovercraft to travel a specified distance as accurately as possible.",
    overview: "Teams design and build a hovercraft that travels a designated distance on a flat surface. The hovercraft must lift off the surface using an air cushion and travel straight to a target point.",
    rules: [
      "2 participants per team; hovercraft built before the event.",
      "The device must create an air cushion to reduce friction with the surface.",
      "The target distance is revealed at competition.",
      "Score is based on how close the hovercraft stops to the target distance.",
      "The device must meet specified size and power source constraints.",
      "No remote control during the run."
    ],
    tips: "<strong>Focus on consistent, controllable straight-line travel.</strong> The air cushion must be even to prevent veering. Build in a reliable distance adjustment mechanism. Test extensively on different surface types. Document your calibration data meticulously — you'll need it to quickly adjust at competition.",
    wikiSlug: "Hovercraft",
    soincSlug: "hovercraft-c"
  },
  {
    id: "machines",
    name: "Machines",
    type: "lab",
    icon: "⚙️",
    shortDesc: "Hands-on tasks and a written test on simple machines and mechanical advantage.",
    overview: "Teams answer questions and complete hands-on tasks about simple machines including levers, pulleys, inclined planes, wheel and axle, wedge, and screw. Emphasis on calculating mechanical advantage, efficiency, and work/energy relationships.",
    rules: [
      "2 participants per team.",
      "Hands-on tasks may include measuring mechanical advantage of provided machines, building a compound machine from components, or solving applied problems.",
      "Written test covers simple machines, mechanical advantage (IMA and AMA), efficiency, work, power, and energy.",
      "Teams may bring a binder and a non-programmable calculator.",
      "50-minute time limit."
    ],
    tips: "<strong>Know the six simple machines and their IMA formulas cold.</strong> Practice calculating ideal and actual mechanical advantage, efficiency, work input, and work output. For hands-on tasks, know how to quickly measure distances and forces to compute MA. Study compound machines and gear ratios.",
    wikiSlug: "Machines",
    soincSlug: "machines-c"
  },
  {
    id: "materials_science",
    name: "Materials Science",
    type: "lab",
    icon: "🔩",
    shortDesc: "Hands-on testing of material properties and a written test on materials science.",
    overview: "Teams conduct experiments to determine physical and chemical properties of materials, then answer questions on materials science concepts including crystalline structure, phase diagrams, polymers, ceramics, and composites.",
    rules: [
      "2 participants per team; lab safety equipment required.",
      "Hands-on portion: testing samples for properties like hardness, density, conductivity, or elasticity.",
      "Written test covers polymers, metals, ceramics, composites, semiconductors, and nanomaterials.",
      "Resource binder permitted for the written portion.",
      "50-minute total time limit."
    ],
    tips: "<strong>Know the major material categories and their properties deeply.</strong> Study stress-strain curves, phase diagrams, and crystal structures. For the lab, practice measurement techniques: Mohs hardness, density by water displacement, conductivity testing. The 2026 rules may specify particular focus materials.",
    wikiSlug: "Materials_Science",
    soincSlug: "materials-science-c"
  },
  {
    id: "remote_sensing",
    name: "Remote Sensing",
    type: "study",
    icon: "🛰️",
    shortDesc: "Written test on remote sensing technologies, image interpretation, and GIS.",
    overview: "Teams demonstrate knowledge of remote sensing principles, satellite and aerial imagery interpretation, electromagnetic spectrum applications, and geographic information systems (GIS). Includes analysis of real satellite data.",
    rules: [
      "2 participants per team; open-note binder permitted.",
      "Content covers electromagnetic spectrum, satellite systems, image interpretation, GIS principles, and applications of remote sensing in environmental science and geography.",
      "Questions may include interpreting satellite images, calculating spatial resolution, and analyzing spectral data.",
      "Calculators (non-programmable) permitted.",
      "50-minute time limit."
    ],
    tips: "<strong>Learn the electromagnetic spectrum bands used in remote sensing.</strong> Know the major satellite platforms (Landsat, MODIS, Sentinel). Practice interpreting false-color composites, NDVI, and thermal imagery. Study GIS concepts including map projections and spatial analysis. NASA's Earthdata resources are excellent.",
    wikiSlug: "Remote_Sensing",
    soincSlug: "remote-sensing-c"
  },
  {
    id: "robot_tour",
    name: "Robot Tour",
    type: "build",
    icon: "🤖",
    shortDesc: "Build and program a robot to navigate a set of waypoints autonomously.",
    overview: "Teams build and program a robotic vehicle to navigate a course with specified waypoints, traveling as close to the targets as possible without any human interaction during the run.",
    rules: [
      "2 participants per team; robot built and programmed before the event.",
      "The course layout (waypoints and distances) is given immediately before the run.",
      "Teams have limited time to reprogram or adjust before the official run.",
      "No remote control during the run; must be fully autonomous.",
      "Score based on proximity to all waypoints and time bonus.",
      "Robot must fit within specified size constraints."
    ],
    tips: "<strong>Use a reliable, well-tested platform.</strong> Arduino is popular. Build in precise turning and straight-line movement. Practice course programming quickly since you'll have limited adjustment time. Write modular code so you can easily update individual waypoint distances at the event.",
    wikiSlug: "Robot_Tour",
    soincSlug: "robot-tour-c"
  },
  {
    id: "rocks_minerals",
    name: "Rocks and Minerals",
    type: "study",
    icon: "🪨",
    shortDesc: "Identify rock and mineral specimens and answer questions on geology.",
    overview: "Teams identify rock and mineral specimens at stations and answer questions about their properties, formation, classification, and uses. Covers igneous, sedimentary, and metamorphic rocks as well as mineral identification by physical properties.",
    rules: [
      "2 participants per team; resource binder permitted.",
      "Station-based identification of hand specimens — rocks and minerals.",
      "Must identify specimens using physical properties: hardness, luster, cleavage/fracture, streak, color, crystal system.",
      "Written questions cover rock cycle, mineral classification, formation environments, and economic geology.",
      "50-minute time limit across all stations."
    ],
    tips: "<strong>Learn the key diagnostic properties for the most common minerals.</strong> Practice with real specimens whenever possible. Know the Mohs hardness scale, luster types, and cleavage patterns. For rocks, understand texture (grain size, foliation) and mineral composition. Create flashcards with specimen photos.",
    wikiSlug: "Rocks_and_Minerals",
    soincSlug: "rocks-and-minerals-c"
  },
  {
    id: "water_quality",
    name: "Water Quality",
    type: "lab",
    icon: "💧",
    shortDesc: "Hands-on water testing and a written test on aquatic ecology and water chemistry.",
    overview: "Teams perform water quality testing procedures and answer questions on freshwater ecology, water chemistry, pollution, and watershed management. Lab tasks may include chemical testing of water samples.",
    rules: [
      "2 participants per team; safety equipment required.",
      "Hands-on tasks: testing water samples for dissolved oxygen, pH, nitrates, phosphates, turbidity, coliform bacteria, etc.",
      "Written test covers aquatic ecology, water chemistry, pollution sources, water treatment, and watershed management.",
      "Resource binder permitted; calculator (non-programmable) permitted.",
      "50-minute time limit."
    ],
    tips: "<strong>Know the standard water quality parameters and what they indicate.</strong> Practice using chemical test kits for dissolved oxygen, pH, nitrates, and phosphates. Study the biological indicators of water quality (benthic macroinvertebrates). Understand how pollution sources affect different parameters.",
    wikiSlug: "Water_Quality",
    soincSlug: "water-quality-c"
  },
  {
    id: "write_it_do_it",
    name: "Write It Do It",
    type: "lab",
    icon: "✍️",
    shortDesc: "One teammate writes instructions; the other builds the object from those instructions.",
    overview: "One team member writes a set of instructions for assembling a provided object. Their partner, in a separate room, then attempts to recreate the object using only those written instructions. Score is based on how closely the final build matches the original.",
    rules: [
      "2 participants with separate roles: the Writer and the Doer.",
      "Writer has a set time (typically 25 minutes) to write instructions for the object assembly.",
      "Doer has a set time (typically 25 minutes) to reconstruct the object from the written instructions only.",
      "No diagrams, drawings, or symbols may be used — instructions must be purely text-based.",
      "Score based on the number of correctly placed and oriented components.",
      "No communication between Writer and Doer once the event begins."
    ],
    tips: "<strong>Develop a consistent, precise vocabulary system before the event.</strong> Use numbered pieces and a coordinate system for positions. Practice writing and following instructions for many complex objects. Time your writing — you have to describe everything completely within the time limit. After practicing, swap roles and critique each other's instructions.",
    wikiSlug: "Write_It_Do_It",
    soincSlug: "write-it-do-it-c"
  }
];


// ============ REGIONAL RESULTS DATA ============
const REGIONAL_EVENTS = [
  "Anatomy and Physiology", "Astronomy", "Boomilever", "Bungee Drop",
  "Chemistry Lab", "Circuit Lab", "Codebusters", "Designer Genes",
  "Disease Detectives", "Dynamic Planet", "Electric Vehicle", "Entomology",
  "Experimental Design", "Forensics", "Helicopter", "Hovercraft",
  "Machines", "Materials Science", "Remote Sensing", "Robot Tour",
  "Rocks and Minerals", "Water Quality", "Write It Do It"
];

const REGIONAL_ICONS = {
  "Anatomy and Physiology": "🫀", "Astronomy": "🔭", "Boomilever": "🏗️", "Bungee Drop": "📏",
  "Chemistry Lab": "⚗️", "Circuit Lab": "🔌", "Codebusters": "🔐", "Designer Genes": "🧬",
  "Disease Detectives": "🦠", "Dynamic Planet": "🌍", "Electric Vehicle": "🚗", "Entomology": "🐛",
  "Experimental Design": "🧫", "Forensics": "🔬", "Helicopter": "🚁", "Hovercraft": "🛸",
  "Machines": "⚙️", "Materials Science": "🔩", "Remote Sensing": "🛰️", "Robot Tour": "🤖",
  "Rocks and Minerals": "🪨", "Water Quality": "💧", "Write It Do It": "✍️"
};

const REGIONAL_TYPES = {
  "Anatomy and Physiology": "study", "Astronomy": "study", "Boomilever": "build", "Bungee Drop": "build",
  "Chemistry Lab": "lab", "Circuit Lab": "lab", "Codebusters": "study", "Designer Genes": "study",
  "Disease Detectives": "study", "Dynamic Planet": "study", "Electric Vehicle": "build", "Entomology": "study",
  "Experimental Design": "lab", "Forensics": "lab", "Helicopter": "build", "Hovercraft": "build",
  "Machines": "lab", "Materials Science": "lab", "Remote Sensing": "study", "Robot Tour": "build",
  "Rocks and Minerals": "study", "Water Quality": "lab", "Write It Do It": "lab"
};

// Team A scores
const RIVERDALE_A_SCORES = [12,20,7,16,14,32,27,18,9,4,32,20,4,21,32,1,32,32,32,9,32,19,24];

// Team B scores
const RIVERDALE_B_SCORES = [20,32,32,32,20,32,32,32,28,29,32,32,14,24,32,32,32,32,32,32,32,25,14];

// Team A assignments
const TEAM_A_ASSIGNMENTS = {
  "Anatomy and Physiology": ["Diana", "Johnny"],
  "Astronomy": ["Theo", "Silas"],
  "Boomilever": ["Luke", "Gavin"],
  "Bungee Drop": ["Jed", "Alexander"],
  "Chemistry Lab": ["Florian", "Silas"],
  "Circuit Lab": [],
  "Codebusters": ["Alexander", "Theo", "Rohan"],
  "Designer Genes": ["Rohan", "Diana"],
  "Disease Detectives": ["Luke", "Silas"],
  "Dynamic Planet": ["Florian", "Theo"],
  "Electric Vehicle": ["Gavin", "Cole Bishop"],
  "Entomology": ["Rohan", "Cole Simmons"],
  "Experimental Design": ["Luke", "Florian", "Arjun"],
  "Forensics": ["Cole Bishop", "Jed"],
  "Helicopter": ["Gavin", "Rohan"],
  "Hovercraft": ["Gavin", "Austin"],
  "Machines": [],
  "Materials Science": [],
  "Remote Sensing": [],
  "Robot Tour": ["Alexander", "Cole Simmons"],
  "Rocks and Minerals": ["Johnny", "Austin"],
  "Water Quality": ["Johnny", "Luke"],
  "Write It Do It": ["Rohan", "Arjun"]
};

// Team B assignments
const TEAM_B_ASSIGNMENTS = {
  "Anatomy and Physiology": ["Sydney", "Silviana"],
  "Astronomy": [],
  "Boomilever": [],
  "Bungee Drop": [],
  "Chemistry Lab": ["Elana", "Madeline"],
  "Circuit Lab": [],
  "Codebusters": [],
  "Designer Genes": ["Silviana", "Sydney"],
  "Disease Detectives": ["Madeline", "Elena"],
  "Dynamic Planet": [],
  "Electric Vehicle": [],
  "Entomology": [],
  "Experimental Design": ["Elena", "Beatrix", "Madeline"],
  "Forensics": [],
  "Helicopter": [],
  "Hovercraft": [],
  "Machines": [],
  "Materials Science": [],
  "Remote Sensing": [],
  "Robot Tour": [],
  "Rocks and Minerals": [],
  "Water Quality": ["Olivia", "Emma"],
  "Write It Do It": ["Emma", "Olivia"]
};

// Top 5 per event
const TOP5 = {
  "Anatomy and Physiology": [
    ["Bronx Science - B", 1], ["Bronx Science - A", 2], ["Trinity - A", 3], ["Collegiate - A", 4], ["RKA - A", 5]
  ],
  "Astronomy": [
    ["Hunter College HS - B", 1], ["HSMSE - A", 2], ["Hunter College HS - A", 3], ["Collegiate - A", 4], ["Bronx Science - A", 5]
  ],
  "Boomilever": [
    ["Horace Mann - C", 1], ["Bronx Science - A", 2], ["Bronx Science - B", 3], ["Horace Mann - A", 4], ["Horace Mann - B", 5]
  ],
  "Bungee Drop": [
    ["Loyola HS", 1], ["Horace Mann - A", 2], ["Bronx Science - C", 3], ["Bronx Science - A", 4], ["Eleanor Roosevelt HS", 5]
  ],
  "Chemistry Lab": [
    ["Bronx Science - C", 1], ["Bronx Science - B", 2], ["Regis - A", 3], ["Collegiate - B", 4], ["Collegiate - A", 5]
  ],
  "Circuit Lab": [
    ["Hunter College HS - A", 1], ["Horace Mann - A", 2], ["HSMSE - A", 3], ["Collegiate - A", 4], ["Bronx Science - C", 5]
  ],
  "Codebusters": [
    ["Bronx Science - A", 1], ["Collegiate - A", 2], ["Hunter College HS - A", 3], ["Bronx Science - B", 4], ["Regis - A", 5]
  ],
  "Designer Genes": [
    ["Bronx Science - A", 1], ["Bronx Science - B", 2], ["Trinity - A", 3], ["Hunter College HS - B", 4], ["Bronx Science - C", 5]
  ],
  "Disease Detectives": [
    ["Bronx Science - C", 1], ["Horace Mann - A", 2], ["Bronx Science - A", 3], ["Bronx Science - B", 4], ["HSMSE - A", 5]
  ],
  "Dynamic Planet": [
    ["Hunter College HS - A", 1], ["Bronx Science - B", 2], ["Bronx Science - A", 3], ["Riverdale Country School - A", 4], ["Horace Mann - A", 5]
  ],
  "Electric Vehicle": [
    ["Loyola HS", 1], ["RKA - C", 2], ["Trinity - A", 3], ["Eleanor Roosevelt HS", 4], ["Collegiate - B", 5]
  ],
  "Entomology": [
    ["Horace Mann - A", 1], ["Bronx Science - B", 2], ["Horace Mann - B", 3], ["Regis - B", 4], ["LaGuardia - B", 5]
  ],
  "Experimental Design": [
    ["Horace Mann - A", 1], ["Bronx Science - B", 2], ["Bronx Science - A", 3], ["Riverdale Country School - A", 4], ["Regis - B", 5]
  ],
  "Forensics": [
    ["Hunter College HS - A", 1], ["Bronx Science - B", 2], ["Collegiate - B", 3], ["Horace Mann - A", 4], ["Collegiate - A", 5]
  ],
  "Helicopter": [
    ["Bronx Science - B", 1], ["LaGuardia - A", 2], ["Trinity - A", 3], ["Hunter College HS - A", 4], ["Bronx Science - C", 5]
  ],
  "Hovercraft": [
    ["Riverdale Country School - A", 1], ["Loyola HS", 2], ["Bronx Science - B", 3], ["LaGuardia - A", 4], ["Bronx Science - A", 5]
  ],
  "Machines": [
    ["Horace Mann - A", 1], ["Collegiate - A", 2], ["Trinity - B", 3], ["Bronx Science - B", 4], ["Bronx Science - A", 5]
  ],
  "Materials Science": [
    ["Hunter College HS - A", 1], ["Bronx Science - B", 2], ["Hunter College HS - B", 3], ["Bronx Science - C", 4], ["Bronx Science - A", 5]
  ],
  "Remote Sensing": [
    ["HSMSE - B", 1], ["Collegiate - A", 2], ["Bronx Science - A", 3], ["Bronx Science - B", 4], ["Hunter College HS - A", 5]
  ],
  "Robot Tour": [
    ["Collegiate - A", 1], ["HSMSE - A", 2], ["Loyola HS", 3], ["Bronx Science - A", 4], ["Bronx Science - C", 5]
  ],
  "Rocks and Minerals": [
    ["Hunter College HS - A", 1], ["Horace Mann - A", 2], ["Bronx Science - A", 3], ["Bronx Science - B", 4], ["Regis - A", 5]
  ],
  "Water Quality": [
    ["Horace Mann - A", 1], ["Horace Mann - B", 2], ["Trinity - A", 3], ["Bronx Science - A", 4], ["Hunter College HS - A", 5]
  ],
  "Write It Do It": [
    ["LaGuardia - A", 1], ["Regis - A", 2], ["Bronx Science - A", 3], ["HSMSE - A", 4], ["HSMSE - B", 5]
  ]
};
