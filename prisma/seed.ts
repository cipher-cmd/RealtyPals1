import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

interface PropertyData {
  project_name: string;
  builder: string;
  bhk: number;
  size_sqft: number;
  price: number;
  price_per_sqft: number;
  floor: number | null;
  status: 'ready' | 'under_construction';
  amenities: string[];
  image_path: string;
  bathrooms: number;
  balconies: number;
  highlights: string[];
}

const propertiesData: PropertyData[] = [
  {
    project_name: 'Tata Eureka Park',
    builder: 'Tata Value Homes',
    bhk: 3,
    size_sqft: 1575,
    price: 18500000,
    price_per_sqft: 11746,
    floor: null,
    status: 'ready',
    amenities: ['smart_home_automation', 'golf_course', 'gym', 'swimming_pool', 'parking'],
    image_path: '/images/properties/tata-eureka-park-3bhk.jpg',
    bathrooms: 2,
    balconies: 2,
    highlights: ['Smart Home Automation System', 'Golf Course Facing Units', 'Premium Vitrified Flooring', 'Modular Kitchen with Chimney', 'Large Balcony with Green View', 'Spacious Living & Dining Area'],
  },
  {
    project_name: 'Godrej Palm Retreat',
    builder: 'Godrej Properties',
    bhk: 2,
    size_sqft: 1265,
    price: 13400000,
    price_per_sqft: 10592,
    floor: null,
    status: 'under_construction',
    amenities: ['resort_style_clubhouse', 'floating_restaurant', 'swimming_pool', 'security', 'parking'],
    image_path: '/images/properties/godrej-palm-retreat-2bhk.jpg',
    bathrooms: 2,
    balconies: 1,
    highlights: ['Resort-Style Clubhouse', 'Floating Restaurant Access', '24/7 Security with CCTV', 'Modern Interior Finish', 'Landscaped Green Areas', 'Proximity to Expressway'],
  },
  {
    project_name: 'ATS Pious Hideaways',
    builder: 'ATS Homekraft',
    bhk: 3,
    size_sqft: 1400,
    price: 16700000,
    price_per_sqft: 11928,
    floor: 7,
    status: 'under_construction',
    amenities: ['modular_kitchen', 'ac_units', 'parking', 'gym', 'electric_charging_station'],
    image_path: '/images/properties/ats-pious-hideaways-3bhk.jpg',
    bathrooms: 2,
    balconies: 2,
    highlights: ['Fully Fitted Modular Kitchen', 'Pre-installed AC Units', 'EV Charging Station', 'Floor-to-Ceiling Windows', 'Contemporary Interior Design', 'Abundant Natural Light'],
  },
  {
    project_name: 'Eldeco Live by the Greens',
    builder: 'Eldeco Group',
    bhk: 3,
    size_sqft: 1404,
    price: 16800000,
    price_per_sqft: 11965,
    floor: null,
    status: 'under_construction',
    amenities: ['cricket_stadium', 'swimming_pool', 'amphitheatre', 'kids_play_area', 'gym'],
    image_path: '/images/properties/eldeco-live-greens-3bhk.jpg',
    bathrooms: 2,
    balconies: 2,
    highlights: ['Private Cricket Stadium', 'Open-Air Amphitheatre', 'Kids Adventure Play Area', 'Landscaped Greens (80% Open)', 'Modern Living Layout', 'High-Quality Fixtures & Fittings'],
  },
  {
    project_name: 'Ace Golfshire',
    builder: 'ACE Group',
    bhk: 3,
    size_sqft: 1675,
    price: 20000000,
    price_per_sqft: 11940,
    floor: null,
    status: 'ready',
    amenities: ['golf_facing', 'badminton_court', 'swimming_pool', 'yoga_area', 'parking'],
    image_path: '/images/properties/ace-golfshire-3bhk.jpg',
    bathrooms: 3,
    balconies: 2,
    highlights: ['Golf Course Facing Premium', 'Badminton & Sports Courts', 'Dedicated Yoga & Meditation Area', '19\' x 15\' Spacious Living Area', 'Large Floor-to-Ceiling Windows', 'Premium Vitrified Flooring'],
  },
  {
    project_name: 'ATS Kingston Heath',
    builder: 'ATS Homekraft',
    bhk: 3,
    size_sqft: 2350,
    price: 37600000,
    price_per_sqft: 16000,
    floor: null,
    status: 'under_construction',
    amenities: ['health_wellness_clinic', 'hydrotherapy', 'gym', 'organic_garden', 'security'],
    image_path: '/images/properties/ats-kingston-heath-3bhk.jpg',
    bathrooms: 3,
    balconies: 3,
    highlights: ['Health & Wellness Clinic', 'Hydrotherapy Pool', 'Organic Rooftop Garden', 'Ultra-Luxury Interiors', 'Expansive 2350 sq.ft Layout', 'Smart Home Integrated'],
  },
  {
    project_name: 'Samridhi Luxuriya Avenue',
    builder: 'Samridhi Group',
    bhk: 2,
    size_sqft: 1165,
    price: 15100000,
    price_per_sqft: 12961,
    floor: null,
    status: 'ready',
    amenities: ['swimming_pool', 'gym', 'clubhouse', 'cricket_pitch', 'skating_rink'],
    image_path: '/images/properties/samridhi-luxuriya-2bhk.jpg',
    bathrooms: 2,
    balconies: 1,
    highlights: ['Cricket Pitch & Skating Rink', 'Modern Clubhouse', 'Ready to Move In', 'Well-Planned 2BHK Layout', 'Power Backup Available', 'Gated Community with Security'],
  },
  {
    project_name: 'Prateek Canary',
    builder: 'Prateek Group',
    bhk: 4,
    size_sqft: 3355,
    price: 55400000,
    price_per_sqft: 16512,
    floor: 15,
    status: 'under_construction',
    amenities: ['forest_groves', 'private_party_deck', 'sculpture_garden', 'gym', 'pool'],
    image_path: '/images/properties/prateek-canary-4bhk.jpg',
    bathrooms: 4,
    balconies: 3,
    highlights: ['Forest Grove Landscape', 'Private Party Deck', 'Sculpture Garden', 'Premium 4BHK with Servant Room', 'High Floor Panoramic Views', 'Italian Marble Flooring'],
  },
  {
    project_name: 'ATS Le Grandiose',
    builder: 'ATS Greens',
    bhk: 3,
    size_sqft: 1625,
    price: 19300000,
    price_per_sqft: 11876,
    floor: 10,
    status: 'ready',
    amenities: ['tennis_court', 'shopping_center', 'badminton_court', 'security', 'power_backup'],
    image_path: '/images/properties/ats-le-grandiose-3bhk.jpg',
    bathrooms: 2,
    balconies: 2,
    highlights: ['Tennis & Badminton Courts', 'On-Site Shopping Center', '24/7 Power Backup', 'Ready to Move In', 'Well-Ventilated Rooms', 'Ample Natural Light'],
  },
  {
    project_name: 'Godrej Nurture',
    builder: 'Godrej Properties',
    bhk: 2,
    size_sqft: 1108,
    price: 13300000,
    price_per_sqft: 12003,
    floor: null,
    status: 'ready',
    amenities: ['child_development_center', 'mini_theater', 'swimming_pool', 'gym', 'parking'],
    image_path: '/images/properties/godrej-nurture-2bhk.jpg',
    bathrooms: 2,
    balconies: 1,
    highlights: ['Child Development Center', 'Mini Theater', 'Family-Friendly Design', 'Compact & Efficient Layout', 'Green Certified Building', 'Close to Schools & Hospitals'],
  },
  {
    project_name: 'Prateek Canary (Penthouse)',
    builder: 'Prateek Group',
    bhk: 6,
    size_sqft: 6100,
    price: 122000000,
    price_per_sqft: 20000,
    floor: 28,
    status: 'under_construction',
    amenities: ['private_pool', 'panoramic_view', 'luxury_club', 'concierge', 'gym'],
    image_path: '/images/properties/prateek-canary-penthouse.jpg',
    bathrooms: 6,
    balconies: 4,
    highlights: ['Private Rooftop Pool', '360° Panoramic View', 'Dedicated Concierge Service', 'Luxury Club Access', 'Ultra-Premium 6100 sq.ft', 'Imported Marble & Wood Finishes'],
  },
  {
    project_name: 'ATS Pristine',
    builder: 'ATS Greens',
    bhk: 4,
    size_sqft: 3200,
    price: 46500000,
    price_per_sqft: 14531,
    floor: null,
    status: 'ready',
    amenities: ['golf_course_access', 'yoga_room', 'swimming_pool', 'cafe', 'parking'],
    image_path: '/images/properties/ats-pristine-4bhk.jpg',
    bathrooms: 3,
    balconies: 3,
    highlights: ['Golf Course View', 'In-House Cafe & Lounge', 'Dedicated Yoga & Meditation Room', 'Ready to Move - Immediate Possession', 'Spacious 3200 sq.ft Layout', 'Premium Wooden Flooring'],
  },
  {
    project_name: 'Mahagun Meadows',
    builder: 'Mahagun Group',
    bhk: 3,
    size_sqft: 1945,
    price: 19500000,
    price_per_sqft: 10025,
    floor: 17,
    status: 'ready',
    amenities: ['pitch_and_putt_golf', 'clubhouse', 'swimming_pool', 'steam_sauna', 'gym'],
    image_path: '/images/properties/mahagun-meadows-3bhk.jpg',
    bathrooms: 3,
    balconies: 2,
    highlights: ['Pitch & Putt Golf Course', 'Steam & Sauna Facility', 'High Floor (17th) with Views', 'Spacious 1945 sq.ft Layout', 'Modern Clubhouse', 'Open Living & Dining Layout'],
  },
  {
    project_name: 'Godrej Solitaire',
    builder: 'Godrej Properties',
    bhk: 4,
    size_sqft: 2692,
    price: 38400000,
    price_per_sqft: 14264,
    floor: null,
    status: 'under_construction',
    amenities: ['concierge_service', 'private_elevator', 'luxury_lobby', 'gym', 'security'],
    image_path: '/images/properties/godrej-solitaire-4bhk.jpg',
    bathrooms: 4,
    balconies: 3,
    highlights: ['Private Elevator Access', 'Concierge Service', 'Luxury Lobby & Reception', 'Premium 4BHK with Servant Quarter', 'Branded Fixtures & Fittings', 'World-Class Security System'],
  },
  {
    project_name: 'Samridhi Daksh Avenue',
    builder: 'Samridhi Group',
    bhk: 3,
    size_sqft: 1980,
    price: 35600000,
    price_per_sqft: 17979,
    floor: 12,
    status: 'under_construction',
    amenities: ['three_side_open', 'sky_lounge', 'sports_courts', 'automated_lighting', 'parking'],
    image_path: '/images/properties/samridhi-daksh-3bhk.jpg',
    bathrooms: 3,
    balconies: 2,
    highlights: ['Three-Side Open Design', 'Sky Lounge with Panoramic Views', 'Automated Smart Lighting', 'Multiple Sports Courts', 'Cross Ventilation Design', 'High-Quality Fixtures & Fittings'],
  },
  {
    project_name: 'ATS Pious Orchards',
    builder: 'ATS Homekraft',
    bhk: 5,
    size_sqft: 3200,
    price: 44800000,
    price_per_sqft: 14000,
    floor: null,
    status: 'under_construction',
    amenities: ['orchard_gardens', 'infinity_pool', 'yoga_deck', 'security', 'high_speed_lifts'],
    image_path: '/images/properties/ats-pious-orchards-5bhk.jpg',
    bathrooms: 5,
    balconies: 3,
    highlights: ['Lush Orchard Gardens', 'Infinity Edge Pool', 'Rooftop Yoga Deck', 'Premium 5BHK Family Home', 'High-Speed Lifts', 'VRV Air Conditioning'],
  },
  {
    project_name: 'Ace Parkway (Penthouse)',
    builder: 'ACE Group',
    bhk: 4,
    size_sqft: 3220,
    price: 48000000,
    price_per_sqft: 14906,
    floor: 22,
    status: 'ready',
    amenities: ['marazzo_flooring', 'private_terrace', 'tennis_court', 'temperature_controlled_pool'],
    image_path: '/images/properties/ace-parkway-penthouse.jpg',
    bathrooms: 4,
    balconies: 2,
    highlights: ['Italian Marazzo Flooring', 'Private Terrace Garden', 'Temperature-Controlled Pool', 'High Floor (22nd) Penthouse', 'Ready to Move In', 'Tennis & Recreational Courts'],
  },
  {
    project_name: 'Bhutani Golf Life',
    builder: 'Bhutani Infra',
    bhk: 3,
    size_sqft: 1900,
    price: 22800000,
    price_per_sqft: 12000,
    floor: 3,
    status: 'under_construction',
    amenities: ['low_density', 'golf_view', 'convenience_store', 'yoga_center', 'clubhouse'],
    image_path: '/images/properties/bhutani-golf-life-3bhk.jpg',
    bathrooms: 2,
    balconies: 2,
    highlights: ['Low-Density Premium Living', 'Golf Course View', 'On-Site Convenience Store', 'Dedicated Yoga Center', 'Wide Balconies with Green Views', 'Modern Modular Kitchen'],
  },
  {
    project_name: 'Lancanshire Villa (Mahagun Meadows)',
    builder: 'Mahagun Group',
    bhk: 4,
    size_sqft: 5000,
    price: 65000000,
    price_per_sqft: 13000,
    floor: 0,
    status: 'ready',
    amenities: ['private_garden', 'dedicated_parking', 'golf_course_access', 'luxury_interiors'],
    image_path: '/images/properties/mahagun-villa-4bhk.jpg',
    bathrooms: 5,
    balconies: 2,
    highlights: ['Private Garden & Lawn', 'Dedicated Multi-Car Parking', 'Golf Course Access', 'Ultra-Luxury Villa Living', 'Expansive 5000 sq.ft', 'Premium Imported Interiors'],
  },
];

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data (order matters for FK constraints)
  await prisma.chatAnalytics.deleteMany();
  await prisma.chatContext.deleteMany();
  await prisma.savedProperty.deleteMany();
  await prisma.propertyImage.deleteMany();
  await prisma.property.deleteMany();
  await prisma.projectPriceBand.deleteMany();
  await prisma.priceBand.deleteMany();
  await prisma.sectorIntelligence.deleteMany();
  await prisma.sector.deleteMany();

  console.log('✅ Cleared existing data');

  // 1. Seed Sector
  const sector = await prisma.sector.create({
    data: {
      city: 'Noida',
      name: 'Sector 150',
      avg_price_low: 10000,
      avg_price_high: 16500,
      demand_level: 'medium',
      supply_level: 'medium',
      volatility_flag: false,
    },
  });

  console.log(`✅ Created sector: ${sector.name} (${sector.id})`);

  // 2. Seed Sector Intelligence
  await prisma.sectorIntelligence.create({
    data: {
      sector_id: sector.id,
      key_growth_drivers: [
        'Jewar International Airport (Upcoming)',
        'Noida–Greater Noida Expressway connectivity',
        'Presence of Fortune 500 IT hubs in Sector 142',
        'New planned Sector 150 Sports City',
        'Film City development nearby',
        'Metro extension planned (Aqua Line Phase 2)',
      ],
      rental_yield_avg: 3.8,
      appreciation_5yr: 28.2,
      map_center_lat: 28.5691,
      map_center_lng: 77.3943,
      map_zoom: 14,
    },
  });

  console.log('✅ Created sector intelligence');

  // 3. Seed PriceBands
  const priceBands = [
    {
      sector_id: sector.id,
      property_type: 'flat' as const,
      bhk: 2,
      min_size: 900,
      max_size: 1300,
      price_low: 10000,
      price_high: 13200,
      confidence_level: 'high' as const,
    },
    {
      sector_id: sector.id,
      property_type: 'flat' as const,
      bhk: 3,
      min_size: 1300,
      max_size: 1700,
      price_low: 10000,
      price_high: 12500,
      confidence_level: 'high' as const,
    },
    {
      sector_id: sector.id,
      property_type: 'flat' as const,
      bhk: 3,
      min_size: 1700,
      max_size: 2400,
      price_low: 11800,
      price_high: 18000,
      confidence_level: 'medium' as const,
    },
    {
      sector_id: sector.id,
      property_type: 'flat' as const,
      bhk: 4,
      min_size: 2500,
      max_size: 3600,
      price_low: 14200,
      price_high: 16600,
      confidence_level: 'medium' as const,
    },
    {
      sector_id: sector.id,
      property_type: null,
      bhk: null,
      min_size: 0,
      max_size: 99999,
      price_low: 10000,
      price_high: 16500,
      confidence_level: 'low' as const,
    },
  ];

  for (const band of priceBands) {
    await prisma.priceBand.create({ data: band });
  }

  console.log(`✅ Created ${priceBands.length} price bands`);

  // 4. Seed Properties with bathrooms, balconies, highlights
  const createdProperties: { id: string; project_name: string }[] = [];
  for (const propData of propertiesData) {
    const prop = await prisma.property.create({
      data: {
        sector_id: sector.id,
        property_type: 'flat',
        bhk: propData.bhk,
        size_sqft: propData.size_sqft,
        price: propData.price,
        price_per_sqft: propData.price_per_sqft,
        builder: propData.builder,
        project_name: propData.project_name,
        image_url: propData.image_path,
        floor: propData.floor,
        status: propData.status,
        amenities: propData.amenities,
        bathrooms: propData.bathrooms,
        balconies: propData.balconies,
        highlights: propData.highlights,
      },
    });
    createdProperties.push({ id: prop.id, project_name: propData.project_name });
  }

  console.log(`✅ Created ${propertiesData.length} properties`);

  // 5. Seed Property Images (for properties that have detailed images)
  const propertyImageMap: Record<string, { image_url: string; image_type: 'exterior' | 'interior' | 'floor_plan' | 'view'; caption: string; sort_order: number }[]> = {
    'Tata Eureka Park': [
      { image_url: '/images/properties/tata-eureka-park-3bhk.jpg', image_type: 'exterior', caption: 'Tata Eureka Park - Exterior View', sort_order: 0 },
      { image_url: '/images/properties/tata-eureka-park-interior-1.jpg', image_type: 'interior', caption: 'Spacious Living & Dining Area', sort_order: 1 },
      { image_url: '/images/properties/tata-eureka-park-interior-2.jpg', image_type: 'interior', caption: 'Modern Kitchen with Premium Fittings', sort_order: 2 },
      { image_url: '/images/properties/tata-eureka-park-floorplan.jpg', image_type: 'floor_plan', caption: '3BHK Floor Plan - 1575 sq.ft', sort_order: 3 },
      { image_url: '/images/properties/tata-eureka-park-view.jpg', image_type: 'view', caption: 'Green Balcony View', sort_order: 4 },
    ],
    'Godrej Palm Retreat': [
      { image_url: '/images/properties/godrej-palm-retreat-2bhk.jpg', image_type: 'exterior', caption: 'Godrej Palm Retreat - Exterior View', sort_order: 0 },
      { image_url: '/images/properties/godrej-palm-retreat-interior-1.jpg', image_type: 'interior', caption: 'Contemporary Living Room', sort_order: 1 },
      { image_url: '/images/properties/godrej-palm-retreat-interior-2.jpg', image_type: 'interior', caption: 'Premium Bedroom Design', sort_order: 2 },
      { image_url: '/images/properties/godrej-palm-retreat-floorplan.jpg', image_type: 'floor_plan', caption: '2BHK Floor Plan - 1265 sq.ft', sort_order: 3 },
      { image_url: '/images/properties/godrej-palm-retreat-view.jpg', image_type: 'view', caption: 'Landscaped Garden View', sort_order: 4 },
    ],
    'ATS Pious Hideaways': [
      { image_url: '/images/properties/ats-pious-hideaways-3bhk.jpg', image_type: 'exterior', caption: 'ATS Pious Hideaways - Exterior View', sort_order: 0 },
      { image_url: '/images/properties/ats-pious-hideaways-interior-1.jpg', image_type: 'interior', caption: 'Modern Living Area with Natural Light', sort_order: 1 },
      { image_url: '/images/properties/ats-pious-hideaways-interior-2.jpg', image_type: 'interior', caption: 'Fitted Kitchen with Appliances', sort_order: 2 },
      { image_url: '/images/properties/ats-pious-hideaways-floorplan.jpg', image_type: 'floor_plan', caption: '3BHK Floor Plan - 1400 sq.ft', sort_order: 3 },
      { image_url: '/images/properties/ats-pious-hideaways-view.jpg', image_type: 'view', caption: 'Panoramic Sector View', sort_order: 4 },
    ],
    'Ace Golfshire': [
      { image_url: '/images/properties/ace-golfshire-3bhk.jpg', image_type: 'exterior', caption: 'Ace Golfshire - Golf Course View', sort_order: 0 },
      { image_url: '/images/properties/ace-golfshire-interior-1.jpg', image_type: 'interior', caption: "19' x 15' Spacious Living Area", sort_order: 1 },
      { image_url: '/images/properties/ace-golfshire-interior-2.jpg', image_type: 'interior', caption: 'Premium Bedroom with View', sort_order: 2 },
      { image_url: '/images/properties/ace-golfshire-floorplan.jpg', image_type: 'floor_plan', caption: '3BHK Floor Plan - 1675 sq.ft', sort_order: 3 },
      { image_url: '/images/properties/ace-golfshire-view.jpg', image_type: 'view', caption: 'Golf Course Facing View', sort_order: 4 },
    ],
    'Mahagun Meadows': [
      { image_url: '/images/properties/mahagun-meadows-3bhk.jpg', image_type: 'exterior', caption: 'Mahagun Meadows - Premium Tower', sort_order: 0 },
      { image_url: '/images/properties/mahagun-meadows-interior-1.jpg', image_type: 'interior', caption: 'Open Living & Dining Layout', sort_order: 1 },
      { image_url: '/images/properties/mahagun-meadows-interior-2.jpg', image_type: 'interior', caption: 'Master Bedroom with Views', sort_order: 2 },
      { image_url: '/images/properties/mahagun-meadows-floorplan.jpg', image_type: 'floor_plan', caption: '3BHK Floor Plan - 1945 sq.ft', sort_order: 3 },
      { image_url: '/images/properties/mahagun-meadows-view.jpg', image_type: 'view', caption: 'High Floor Panoramic View', sort_order: 4 },
    ],
    'Prateek Canary': [
      { image_url: '/images/properties/prateek-canary-4bhk.jpg', image_type: 'exterior', caption: 'Prateek Canary - Premium Facade', sort_order: 0 },
      { image_url: '/images/properties/prateek-canary-interior-1.jpg', image_type: 'interior', caption: 'Italian Marble Living Area', sort_order: 1 },
      { image_url: '/images/properties/prateek-canary-interior-2.jpg', image_type: 'interior', caption: 'Luxury Master Suite', sort_order: 2 },
      { image_url: '/images/properties/prateek-canary-floorplan.jpg', image_type: 'floor_plan', caption: '4BHK Floor Plan - 3355 sq.ft', sort_order: 3 },
      { image_url: '/images/properties/prateek-canary-view.jpg', image_type: 'view', caption: 'Forest Grove Panoramic View', sort_order: 4 },
    ],
  };

  let imageCount = 0;
  for (const created of createdProperties) {
    const imageData = propertyImageMap[created.project_name];
    if (imageData) {
      for (const img of imageData) {
        await prisma.propertyImage.create({
          data: {
            property_id: created.id,
            image_url: img.image_url,
            image_type: img.image_type,
            caption: img.caption,
            sort_order: img.sort_order,
          },
        });
        imageCount++;
      }
    }
  }

  console.log(`✅ Created ${imageCount} property images for ${Object.keys(propertyImageMap).length} properties`);

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
