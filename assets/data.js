/* ============================================================
   Roamly — content
   The trips the whole site reads from. Home, browse, detail and
   the four checkout steps all render out of this one array, so a
   trip only has to be described once.
   ============================================================ */
(function (w) {
  'use strict';

  var IMG = 'https://storage.googleapis.com/uxpilot-auth.appspot.com/';

  var TRIPS = [
    {
      id: 'kashmir',
      code: 'KSH',
      name: 'Kashmir Group Escape',
      short: 'Kashmir Group',
      accent: 'Escape.',
      region: 'Kashmir Valley',
      category: 'alpine',
      days: 6,
      grade: 'Alpine Grade',
      price: 24999,
      rating: 4.9,
      reviews: 127,
      slots: 6,
      badges: ['Expert Led', 'Verified Trail'],
      hero: IMG + 'gen_c22249d48c_3c5fc2cd9625f990.png',
      heroAlt: 'Dal Lake at sunrise with shikaras and snow-capped peaks behind',
      gallery: [
        { src: IMG + 'gen_47f313ed15_ef46a2d630cc7df0.png', alt: 'Wooden chalet in a Gulmarg meadow of yellow wildflowers' },
        { src: IMG + 'gen_41e1277fb3_601030b38da02866.png', alt: 'Kashmiri kahwa poured from a copper samovar' },
        { src: IMG + 'gen_4a73aec754_adbf236844c8131f.png', alt: 'Hikers crossing a green valley in Pahalgam' },
        { src: IMG + 'gen_943b8c7b67_2defdd802ac77617.png', alt: 'Overhead view of a Kashmiri wazwan feast' }
      ],
      blurb: [
        'Experience the "Paradise on Earth" in a way that goes beyond the tourist brochures. Our Kashmir Group Escape is designed for those who want to slow down and truly connect with the soul of the valley.',
        'From a century-old houseboat on a quiet corner of Dal Lake to the saffron fields of Pampore, this journey blends iconic sights with intimate local encounters.'
      ],
      dates: '15 Sep – 20 Sep ’26',
      itinerary: [
        { t: 'Arrival & Houseboat Dock',    d: 'Land at Srinagar, transfer to a heritage houseboat on the quiet eastern arm of Dal Lake. Evening shikara run to the floating vegetable market, then kahwa on deck.' },
        { t: 'Gulmarg High-Altitude Run',   d: 'Gondola to Kongdoori, then a guided 6km ridge walk to Apharwat treeline. Snow underfoot most of the season. Return by dusk.' },
        { t: 'Pahalgam Valley Crossing',    d: 'A full day traverse of the Lidder valley floor, crossing three log bridges and finishing at Baisaran meadow for lunch under the pines.' },
        { t: 'Saffron Fields & Pampore',    d: 'Early start for the Pampore saffron plateau at first light, then a working lunch with a fourth-generation grower.' },
        { t: 'Aru to Lidderwat Trek',       d: 'The hardest day: 11km gain through birch forest to the Lidderwat camp at 2,700m. Tents, a fire, and no signal.' },
        { t: 'Descent & Extraction',        d: 'Slow morning descent, hot lunch at basecamp, and transfer back to Srinagar terminal by 16:00.' }
      ],
      guide: {
        name: 'Vikram Singh',
        role: 'Lead Expeditionist',
        bio: '6+ years of leading mountain expeditions. Loves Kashmiri chai and slow photography.',
        quote: '"The mountains are calling."',
        photo: IMG + 'avatars/avatar-4.jpg'
      },
      pickups: [
        { id: 'srinagar', place: 'Srinagar Terminal',  note: 'TRC Bus Stand, Gate 2',        time: '09:00 AM', recommended: true },
        { id: 'dalgate',  place: 'Dal Gate Base',      note: 'Boulevard Road, near Ghat 9',  time: '10:00 AM' },
        { id: 'airport',  place: 'Srinagar Airport',   note: 'Arrivals kerb, Pillar 4',      time: '11:30 AM' }
      ]
    },
    {
      id: 'sandakphu',
      code: 'SDK',
      name: 'Sandakphu Ridge Hike',
      short: 'Sandakphu',
      accent: 'Ridge.',
      region: 'Himalayas',
      category: 'expert',
      days: 6,
      grade: 'Hard Core',
      price: 18999,
      rating: 5.0,
      reviews: 84,
      slots: 4,
      badges: ['Best for Experts'],
      featured: 'large',
      hero: IMG + 'gen_e9ff5339b2_49bdb353bdbf622d.png',
      heroAlt: 'Cinematic landscape along the Sandakphu trekking trail',
      gallery: [
        { src: IMG + 'gen_3a04715526_d7ed130b66874447.png', alt: 'Pine canopy from below' },
        { src: IMG + 'gen_4c16770163_91d331bdae7e14fc.png', alt: 'Cold mountain stream over rock' },
        { src: IMG + 'gen_9778de41c5_e6e9a6512f0b77f5.png', alt: 'Camp lit at night under stars' },
        { src: IMG + 'gen_69827c6679_027396a5bf777abd.png', alt: 'Hikers eating together at camp' }
      ],
      blurb: [
        'The Sleeping Buddha stands over the whole walk. Sandakphu is the only trail in India where four of the world’s five highest peaks line up on one horizon — Everest, Kanchenjunga, Lhotse and Makalu.',
        'Six days along the Singalila ridge, sleeping in trekkers’ huts, with a summit push timed for the light before sunrise.'
      ],
      dates: '12 Jan – 17 Jan ’26',
      itinerary: [
        { t: 'Basecamp at Manebhanjan',  d: 'Transfer from NJP, gear check, and an acclimatisation walk to Chitrey monastery. Briefing at 19:00.' },
        { t: 'Tumling Climb',            d: '11km with a hard 900m gain. First clear Kanchenjunga view from the ridge above Meghma.' },
        { t: 'Kalipokhri Traverse',      d: 'Crossing in and out of Nepal along the border ridge. Rhododendron tunnel for the last 4km.' },
        { t: 'The Sandakphu Push',       d: 'Short day, brutal grade — the Bikeybhanjyang wall. Summit camp at 3,636m.' },
        { t: 'Summit Dawn & Sabargram',  d: 'Pre-dawn start for the Sleeping Buddha, then a long ridge day to Sabargram.' },
        { t: 'Srikhola Descent',         d: '4,000ft of descent through cardamom terraces, finishing at the Srikhola bridge.' }
      ],
      guide: {
        name: 'Anjali Rawat',
        role: 'Lead Expeditionist',
        bio: 'Certified alpine guide, 40+ Singalila crossings. Runs the winter safety programme.',
        quote: '"Slow is smooth, smooth is fast."',
        photo: IMG + 'gen_b06b700247_90aa9151b2f2970f.png'
      },
      pickups: [
        { id: 'njp',      place: 'NJP Station',        note: 'Platform 1 exit, Coach board', time: '05:30 AM', recommended: true },
        { id: 'bagdogra', place: 'Bagdogra Airport',   note: 'Arrivals, Pillar 2',           time: '07:00 AM' },
        { id: 'darjeeling', place: 'Darjeeling Mall',  note: 'Clock tower steps',            time: '08:30 AM' }
      ]
    },
    {
      id: 'roopkund',
      code: 'RPK',
      name: 'Roopkund Glacier Expedition',
      short: 'Roopkund',
      accent: 'Glacier.',
      region: 'Himalayas',
      category: 'expert',
      days: 8,
      grade: 'Extreme',
      price: 32500,
      rating: 4.9,
      reviews: 61,
      slots: 3,
      badges: ['Selling Fast', 'Himalayas'],
      hero: IMG + 'gen_1d9ad427d6_7d9747e1ae4d73de.png',
      heroAlt: 'Misty Himalayan valley at first light',
      gallery: [
        { src: IMG + 'gen_4c16770163_91d331bdae7e14fc.png', alt: 'Glacial stream over rock' },
        { src: IMG + 'gen_3a04715526_d7ed130b66874447.png', alt: 'Oak and pine canopy' },
        { src: IMG + 'gen_9778de41c5_e6e9a6512f0b77f5.png', alt: 'High camp at night' },
        { src: IMG + 'gen_b4f38e5513_07a9b7a50cda2ce9.png', alt: 'A group of hikers on the move' }
      ],
      blurb: [
        'A glacial tarn at 5,029m with several hundred skeletons at its edge, and one of the finest high-meadow approaches anywhere in Uttarakhand.',
        'Eight days, two campsites above 4,000m, and a summit window that opens for about four hours.'
      ],
      dates: '02 Oct – 09 Oct ’26',
      itinerary: [
        { t: 'Lohajung Basecamp',       d: 'Road transfer from Kathgodam, medical check and full gear issue.' },
        { t: 'Didna Village',           d: 'River crossing at Raun Bagad, then a steep 4km climb to the village.' },
        { t: 'Ali Bugyal Meadows',      d: 'Out of the treeline into the largest high meadow in the region.' },
        { t: 'Patar Nachauni',          d: 'Ridge walking at 3,800m. Acclimatisation walk in the afternoon.' },
        { t: 'Bhagwabasa',              d: 'Short, thin-air day to the last camp below the tarn.' },
        { t: 'Roopkund Summit',         d: 'Alpine start at 04:00 for the tarn and Junargali ridge, descend the same day.' },
        { t: 'Descent to Bedni',        d: 'Long give-back day across the meadows.' },
        { t: 'Extraction to Lohajung',  d: 'Final descent and transfer.' }
      ],
      guide: {
        name: 'Tenzing Bhutia',
        role: 'Lead Expeditionist',
        bio: 'High-altitude rescue certified. Twelve Roopkund summits, including two winter attempts.',
        quote: '"The mountain decides. We just show up prepared."',
        photo: IMG + 'avatars/avatar-4.jpg'
      },
      pickups: [
        { id: 'kathgodam', place: 'Kathgodam Station', note: 'Main exit, Roamly coach bay', time: '06:00 AM', recommended: true },
        { id: 'haldwani',  place: 'Haldwani Bypass',   note: 'Opposite Bus Depot',          time: '06:45 AM' }
      ]
    },
    {
      id: 'cloudforest',
      code: 'CLF',
      name: 'The Cloud Forest Trek',
      short: 'Cloud Forest',
      accent: 'Trek.',
      region: 'Mullayanagiri',
      category: 'weekend',
      days: 2,
      grade: 'Moderate',
      price: 4499,
      rating: 4.8,
      reviews: 212,
      slots: 11,
      badges: ['Weekend Peak'],
      featured: 'tall',
      hero: IMG + 'gen_44f9e47a4b_1050916ec623d0cc.png',
      heroAlt: 'Dense foggy jungle trail',
      gallery: [
        { src: IMG + 'gen_3a04715526_d7ed130b66874447.png', alt: 'Canopy in mist' },
        { src: IMG + 'gen_4c16770163_91d331bdae7e14fc.png', alt: 'Stream through shola forest' },
        { src: IMG + 'gen_69827c6679_027396a5bf777abd.png', alt: 'Trekkers at a camp meal' },
        { src: IMG + 'gen_b4f38e5513_07a9b7a50cda2ce9.png', alt: 'Group on a green ridge' }
      ],
      blurb: [
        'Karnataka’s highest peak, walked the slow way — in through the shola forest on the north face rather than the road up the south.',
        'One night at a coffee estate homestay, one summit dawn, back in the city by Sunday evening.'
      ],
      dates: '20 Sep – 21 Sep ’26',
      itinerary: [
        { t: 'Sarpadhari Trailhead',   d: 'Overnight coach from Bengaluru, breakfast at the trailhead, then 5km through the shola.' },
        { t: 'Summit Dawn & Return',   d: '04:30 start for the Mullayanagiri summit at 1,930m, descent by the Baba Budangiri ridge.' }
      ],
      guide: {
        name: 'Meera Nair',
        role: 'Trail Coordinator',
        bio: 'Runs Roamly’s Western Ghats programme. Botanist by training.',
        quote: '"Everything interesting is off the road."',
        photo: IMG + 'gen_b06b700247_90aa9151b2f2970f.png'
      },
      pickups: [
        { id: 'wakad',        place: 'Wakad, Pune',        note: 'Near Ginger Hotel highway exit',   time: '5:30 AM', recommended: true },
        { id: 'shivajinagar', place: 'Shivajinagar, Pune', note: 'Sancheti Hospital front gate',     time: '6:00 AM' },
        { id: 'katraj',       place: 'Katraj, Pune',       note: 'Opposite Wonder City main gate',   time: '6:30 AM' }
      ]
    },
    {
      id: 'stargazer',
      code: 'STG',
      name: 'Star-Gazer Peak',
      short: 'Star-Gazer',
      accent: 'Peak.',
      region: 'Sahyadri',
      category: 'weekend',
      days: 2,
      grade: 'Moderate',
      price: 6200,
      rating: 4.7,
      reviews: 143,
      slots: 8,
      badges: ['Overnighter'],
      hero: IMG + 'gen_9778de41c5_e6e9a6512f0b77f5.png',
      heroAlt: 'Camp set up under a night sky',
      gallery: [
        { src: IMG + 'gen_4c16770163_91d331bdae7e14fc.png', alt: 'Stream at dusk' },
        { src: IMG + 'gen_69827c6679_027396a5bf777abd.png', alt: 'Camp dinner' },
        { src: IMG + 'gen_3a04715526_d7ed130b66874447.png', alt: 'Pine canopy at night' },
        { src: IMG + 'gen_b4f38e5513_07a9b7a50cda2ce9.png', alt: 'Group hiking out' }
      ],
      blurb: [
        'A Bortle 3 sky two hours from the city. We climb in the afternoon, set camp before dark, and spend the night with a 10-inch Dobsonian and someone who knows how to point it.',
        'No prior experience needed. Warm layers absolutely needed.'
      ],
      dates: '27 Sep – 28 Sep ’26',
      itinerary: [
        { t: 'Afternoon Ascent',   d: 'Trailhead at 15:00, camp pitched on the plateau by 18:00, dinner at 19:30.' },
        { t: 'Night Sky & Descent', d: 'Guided sky session until 01:00, sunrise from the east face, descent by 10:00.' }
      ],
      guide: {
        name: 'Farhan Qureshi',
        role: 'Night Sky Lead',
        bio: 'Amateur astronomer, ten years of dark-sky trips across the Sahyadris.',
        quote: '"Give your eyes twenty minutes. Then look again."',
        photo: IMG + 'avatars/avatar-4.jpg'
      },
      pickups: [
        { id: 'wakad',        place: 'Wakad, Pune',        note: 'Near Ginger Hotel highway exit', time: '1:30 PM', recommended: true },
        { id: 'shivajinagar', place: 'Shivajinagar, Pune', note: 'Sancheti Hospital front gate',   time: '2:00 PM' }
      ]
    },
    {
      id: 'coastal',
      code: 'CST',
      name: 'Coastal Ridge Trail',
      short: 'Coastal Ridge',
      accent: 'Trail.',
      region: 'Gokarna',
      category: 'weekend',
      days: 3,
      grade: 'Moderate',
      price: 8500,
      rating: 4.8,
      reviews: 96,
      slots: 9,
      badges: ['Group Solo'],
      hero: IMG + 'gen_b4f38e5513_07a9b7a50cda2ce9.png',
      heroAlt: 'A group of hikers on a coastal ridge',
      gallery: [
        { src: IMG + 'gen_4c16770163_91d331bdae7e14fc.png', alt: 'Freshwater stream near the coast' },
        { src: IMG + 'gen_69827c6679_027396a5bf777abd.png', alt: 'Beach camp meal' },
        { src: IMG + 'gen_3a04715526_d7ed130b66874447.png', alt: 'Palm canopy' },
        { src: IMG + 'gen_44f9e47a4b_1050916ec623d0cc.png', alt: 'Coastal forest trail in mist' }
      ],
      blurb: [
        'Five beaches in three days, connected by the headland trail rather than the road. Designed for solo travellers — you book alone and arrive into a group of twelve.',
        'Sleeping is split between a beach camp and a cliff-top guesthouse.'
      ],
      dates: '10 Oct – 12 Oct ’26',
      itinerary: [
        { t: 'Kudle to Om Beach',   d: 'Arrive, drop bags, walk the first two headlands in the evening light.' },
        { t: 'Half Moon & Paradise', d: 'The long day — four headland crossings, lunch on Half Moon, camp at Paradise.' },
        { t: 'Belekan Extraction',  d: 'Sunrise swim, boat back to Gokarna town, extraction at 14:00.' }
      ],
      guide: {
        name: 'Rhea D’Souza',
        role: 'Trail Coordinator',
        bio: 'Grew up on this coast. Knows which headland is passable at which tide.',
        quote: '"Check the tide table. Always."',
        photo: IMG + 'gen_b06b700247_90aa9151b2f2970f.png'
      },
      pickups: [
        { id: 'gokarna', place: 'Gokarna Town',    note: 'Main bus stand, Roamly desk', time: '7:00 AM', recommended: true },
        { id: 'ankola',  place: 'Ankola Junction', note: 'NH66 service road',           time: '6:15 AM' }
      ]
    },
    {
      id: 'munnar',
      code: 'MNR',
      name: 'Munnar Valley Crossing',
      short: 'Munnar Valley',
      accent: 'Crossing.',
      region: 'Western Ghats',
      category: 'weekend',
      days: 3,
      grade: 'Moderate',
      price: 8999,
      rating: 4.8,
      reviews: 178,
      slots: 12,
      badges: ['Weekend Peak'],
      hero: IMG + 'gen_9a94beaf44_9a69293bffb24852.png',
      heroAlt: 'Tea gardens of Munnar under heavy cloud',
      gallery: [
        { src: IMG + 'gen_3a04715526_d7ed130b66874447.png', alt: 'Forest canopy' },
        { src: IMG + 'gen_4c16770163_91d331bdae7e14fc.png', alt: 'Hill stream' },
        { src: IMG + 'gen_69827c6679_027396a5bf777abd.png', alt: 'Estate lunch' },
        { src: IMG + 'gen_44f9e47a4b_1050916ec623d0cc.png', alt: 'Mist in the plantation' }
      ],
      blurb: [
        'A crossing rather than a summit: in at Chokramudi, out at Meesapulimala, through working tea estate and shola forest the whole way.',
        'Two nights in estate bungalows with a proper kitchen.'
      ],
      dates: '03 Oct – 05 Oct ’26',
      itinerary: [
        { t: 'Chokramudi Approach',  d: 'Estate transfer, 6km approach walk, bungalow by evening.' },
        { t: 'Shola Crossing',       d: 'The main day: 14km through shola and grassland to the Meesapulimala saddle.' },
        { t: 'Descent & Estate Tour', d: 'Morning descent, working tea factory tour, extraction at 15:00.' }
      ],
      guide: {
        name: 'Joseph Kurian',
        role: 'Trail Coordinator',
        bio: 'Third-generation estate family. Leads the Ghats monsoon programme.',
        quote: '"Rain is not a reason to cancel."',
        photo: IMG + 'avatars/avatar-4.jpg'
      },
      pickups: [
        { id: 'kochi',  place: 'Kochi Airport',   note: 'Terminal 3 arrivals',      time: '6:00 AM', recommended: true },
        { id: 'munnar', place: 'Munnar Town',     note: 'Old bus stand, Roamly desk', time: '9:00 AM' }
      ]
    },
    {
      id: 'pinparvati',
      code: 'PNP',
      name: 'Pin Parvati Pass Run',
      short: 'Pin Parvati',
      accent: 'Pass.',
      region: 'Spiti',
      category: 'expert',
      days: 11,
      grade: 'Hard Core',
      price: 48000,
      rating: 5.0,
      reviews: 34,
      slots: 2,
      badges: ['Spiti', 'Expert Ridges'],
      hero: IMG + 'gen_58f7379b8c_653f0fa954234071.png',
      heroAlt: 'Stark desert peaks of Spiti Valley under a hard blue sky',
      gallery: [
        { src: IMG + 'gen_4c16770163_91d331bdae7e14fc.png', alt: 'Glacial melt stream' },
        { src: IMG + 'gen_9778de41c5_e6e9a6512f0b77f5.png', alt: 'High camp at night' },
        { src: IMG + 'gen_3a04715526_d7ed130b66874447.png', alt: 'Last treeline' },
        { src: IMG + 'gen_b4f38e5513_07a9b7a50cda2ce9.png', alt: 'Roped group on snow' }
      ],
      blurb: [
        'The green Parvati valley on one side, the cold desert of Spiti on the other, joined by a 5,319m glaciated pass. This is the hardest thing Roamly runs.',
        'Rope work, crevasse crossing, and four consecutive nights above 4,000m. Prior high-altitude experience is required, not suggested.'
      ],
      dates: '18 Aug – 28 Aug ’26',
      itinerary: [
        { t: 'Barsheni to Kalga',      d: 'Short first day. Full kit inspection and a mandatory fitness assessment.' },
        { t: 'Rudranag',               d: 'Along the Parvati river through pine, crossing at the Rudranag bridge.' },
        { t: 'Khirganga Hot Springs',  d: 'Steep gain to 2,960m. The last village with a shop.' },
        { t: 'Tunda Bhuj',             d: 'Out of the forest, into the true valley floor.' },
        { t: 'Thakur Kuan',            d: 'The Pandu Pul natural rock bridge, then meadow camp.' },
        { t: 'Odi Thach',              d: 'Boulder field day. Slow going, big views.' },
        { t: 'Mantalai Lake',          d: 'The source of the Parvati at 4,100m. Rest and acclimatise.' },
        { t: 'Base of the Pass',       d: 'Moraine climb to 4,900m. Rope and crampon briefing at camp.' },
        { t: 'Pin Parvati Crossing',   d: 'The pass at 5,319m, then a long glacier descent into Spiti.' },
        { t: 'Wichkurung Thach',       d: 'Down the Pin valley, back below the snowline.' },
        { t: 'Mudh & Extraction',      d: 'Final descent to Mudh village and road transfer to Kaza.' }
      ],
      guide: {
        name: 'Tenzing Bhutia',
        role: 'Lead Expeditionist',
        bio: 'High-altitude rescue certified. Nine Pin Parvati crossings.',
        quote: '"The pass gives you one morning. Be ready for it."',
        photo: IMG + 'avatars/avatar-4.jpg'
      },
      pickups: [
        { id: 'manali',   place: 'Manali Mall Road', note: 'Roamly desk, Hotel Snow Valley', time: '5:00 AM', recommended: true },
        { id: 'barsheni', place: 'Barsheni Bridge',  note: 'Last road head',                 time: '9:00 AM' }
      ]
    },
    {
      id: 'workshop',
      code: 'WSP',
      name: "Beginner's Workshop",
      short: 'Beginner Workshop',
      accent: 'Workshop.',
      region: 'Online / In-Person',
      category: 'weekend',
      days: 1,
      grade: 'Entry',
      price: 0,
      rating: 4.9,
      reviews: 340,
      slots: 40,
      badges: ['Free'],
      hero: IMG + 'gen_eb36779fe5_f54ad58d8280301a.png',
      heroAlt: 'Trekking gear laid out flat',
      gallery: [
        { src: IMG + 'gen_b4f38e5513_07a9b7a50cda2ce9.png', alt: 'Group briefing outdoors' },
        { src: IMG + 'gen_69827c6679_027396a5bf777abd.png', alt: 'Shared meal at camp' },
        { src: IMG + 'gen_3a04715526_d7ed130b66874447.png', alt: 'Canopy overhead' },
        { src: IMG + 'gen_4c16770163_91d331bdae7e14fc.png', alt: 'Water source' }
      ],
      blurb: [
        'Four hours on what to carry, how to pack it, how to read a grade honestly, and what actually goes wrong on a first trek.',
        'Free, and deliberately so. Run in person in Pune and Bengaluru, and streamed for everyone else.'
      ],
      dates: '14 Sep ’26',
      itinerary: [
        { t: 'Gear, Grade & Ground', d: 'Packing demo, a real grade breakdown, altitude basics, and an open Q&A with a lead guide.' }
      ],
      guide: {
        name: 'Meera Nair',
        role: 'Programme Lead',
        bio: 'Runs Roamly’s entry programme. Has answered every one of these questions before.',
        quote: '"There are no stupid questions about blisters."',
        photo: IMG + 'gen_b06b700247_90aa9151b2f2970f.png'
      },
      pickups: [
        { id: 'online', place: 'Online',       note: 'Link emailed 1 hour before', time: '10:00 AM', recommended: true },
        { id: 'pune',   place: 'Pune Studio',  note: 'Roamly Basecamp, Baner',     time: '10:00 AM' }
      ]
    }
  ];

  var CATEGORIES = [
    { id: 'all',     label: 'All Trails' },
    { id: 'weekend', label: 'Weekend Peaks' },
    { id: 'alpine',  label: 'Alpine Tours' },
    { id: 'expert',  label: 'Expert Ridges' }
  ];

  w.RoamlyData = {
    trips: TRIPS,
    categories: CATEGORIES,
    DEPOSIT: 10000,
    byId: function (id) {
      for (var i = 0; i < TRIPS.length; i++) { if (TRIPS[i].id === id) return TRIPS[i]; }
      return TRIPS[0];
    }
  };
})(window);
