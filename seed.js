const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Studio = require('./models/Studio');

dotenv.config();

const sampleStudios = [
  {
    title: 'The Daylight Loft — Cyclorama Stage',
    category: 'Photo Studio',
    hourlyRate: 85,
    securityDeposit: 150,
    maxCapacity: 12,
    location: 'DUMBO, Brooklyn, NY',
    imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80',
    amenities: [
      '20ft Infinity Cyclorama Wall',
      'Profoto B10X Plus Lighting Kit',
      'South-facing Natural Sunlight',
      'Hair & Makeup Dressing Station',
      'High-Speed Fiber WiFi (1Gbps)',
      'Freight Elevator Access',
    ],
    overview:
      'A sprawling 2,400 sq.ft industrial daylight studio featuring uninterrupted southern sunlight exposure, a 20-foot seamless corner cyclorama wall, and pro-grade strobe lighting. Engineered specifically for editorial lookbooks, commercial fashion shoots, and high-end video portraiture.',
    ownerEmail: 'alex.vance@studiospace.io',
    ownerName: 'Alex Vance',
    rating: 4.9,
    reviewCount: 38,
  },
  {
    title: 'Acoustic Vault — Dolby Atmos Music Suite',
    category: 'Music Suite',
    hourlyRate: 120,
    securityDeposit: 200,
    maxCapacity: 6,
    location: 'Silver Lake, Los Angeles, CA',
    imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80',
    amenities: [
      'Genelec 7.1.4 Dolby Atmos Monitoring',
      'Neve 1073 Channel Strips',
      'Universal Audio Apollo x16',
      'Neumann U87 Ai Microphone',
      'Vintage Roland Juno-106 Synth',
      'Private Vocal Isolation Booth',
    ],
    overview:
      'Pristine acoustic isolation engineered by master acousticians. Designed for tracking, mastering, and immersive Dolby Atmos mixing. Includes top-shelf analog outboard preamps and custom floating floor isolation.',
    ownerEmail: 'marcus.audio@studiospace.io',
    ownerName: 'Marcus Sterling',
    rating: 5.0,
    reviewCount: 47,
  },
  {
    title: 'The Broadcast Lab — 4K Multicam Podcast Lounge',
    category: 'Podcast Lounge',
    hourlyRate: 75,
    securityDeposit: 100,
    maxCapacity: 8,
    location: 'Austin Downtown, TX',
    imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=80',
    amenities: [
      '4x Sony FX3 Cinema Cameras with 4K switcher',
      '4x Shure SM7B Broadcast Mics with Cloudlifters',
      'Rodecaster Pro II Audio Production Console',
      'Aputure Nova Soft Lighting Grid',
      'Custom Neon LED Backlit Acoustic Walls',
      'Live Streaming Switchboard with OBS integration',
    ],
    overview:
      'Turnkey multi-camera video podcast studio setup. Just plug in your SD card or drive and record 4K switched multi-angle episodes or broadcast directly to YouTube, Twitch, or Spotify with studio sound.',
    ownerEmail: 'sarah.pod@studiospace.io',
    ownerName: 'Sarah Jenkins',
    rating: 4.85,
    reviewCount: 29,
  },
  {
    title: 'Grid 4 Soundstage — Black Box Film Production',
    category: 'Film Stage',
    hourlyRate: 160,
    securityDeposit: 300,
    maxCapacity: 25,
    location: 'Long Island City, NY',
    imageUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80',
    amenities: [
      'Full Overhead Motorized Lighting Truss',
      'Soundproof STC 65 Rating',
      'Drive-in Roll-up Garage Door',
      '3-Phase 200A Camlock Power',
      'Dedicated Production Office Suite',
      'Green Screen Backdrop (30ft x 15ft)',
    ],
    overview:
      'Massive 4,000 sq ft production soundstage with 18ft ceilings, motorized overhead grid, sound dampening to STC 65, and heavy 3-phase camlock power for high-draw HMI and Arri lighting fixtures.',
    ownerEmail: 'production@grid4stages.com',
    ownerName: 'Elena Rostova',
    rating: 4.92,
    reviewCount: 54,
  },
  {
    title: 'Ceramica & Maker Space — Creative Artisan Workshop',
    category: 'Workshop',
    hourlyRate: 55,
    securityDeposit: 80,
    maxCapacity: 16,
    location: 'Wicker Park, Chicago, IL',
    imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80',
    amenities: [
      '6x Shimpo Whisper Pottery Wheels',
      'Skutt Automatic Digital Electric Kiln',
      'Heavy Duty Maple Woodworking Benches',
      'Extensive Hand Carving & Clay Tool Library',
      'Triple Deep Basin Industrial Wash Sinks',
      'High CFM Dust Collection System',
    ],
    overview:
      'Fully equipped craft, ceramics, and artisan studio equipped with electric pottery wheels, kilns, and spacious woodworking workbenches. Ideal for small group classes, private sculpting sessions, and artisan content shoots.',
    ownerEmail: 'maya.artisan@studiospace.io',
    ownerName: 'Maya Lin',
    rating: 4.8,
    reviewCount: 22,
  },
  {
    title: 'Neon Horizon — Retro Wave Video & Music Production',
    category: 'Music Suite',
    hourlyRate: 95,
    securityDeposit: 150,
    maxCapacity: 10,
    location: 'Arts District, Los Angeles, CA',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    amenities: [
      'Programmable RGB Atmospheric Grid Lighting',
      'Moog Subsequent 37 & Dave Smith Prophet Rev2',
      'Focal Trio6 Be Studio Monitors',
      'Smoke & Atmosphere Haze Machine',
      'Vintage VHS Camcorders & CRT Video Wall',
      '4K Blackmagic Cinema Camera Kit',
    ],
    overview:
      'A visual and acoustic wonderland customized for synth-heavy music production, stylized music videos, and creative album listening parties with custom RGB light programming and vintage analog gear.',
    ownerEmail: 'damon.synth@studiospace.io',
    ownerName: 'Damon Cross',
    rating: 4.95,
    reviewCount: 31,
  },
];

const seedDatabase = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI is not set in .env. Exiting seed script.');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    const existingCount = await Studio.countDocuments();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing studios. Clearing before re-seeding...`);
      await Studio.deleteMany({});
    }

    const inserted = await Studio.insertMany(sampleStudios);
    console.log(`Successfully seeded ${inserted.length} premium creative studios.`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seedDatabase();
