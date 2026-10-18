// Standard society amenity & facility definitions

export const defaultFacilities = [
  {
    id: 'clubhouse',
    name: 'Clubhouse Banquet & Lounge',
    category: 'Celebration & Events',
    icon: 'Building2',
    capacity: 120,
    openingHours: '09:00 - 22:00',
    slotDurationMinutes: 120,
    rules: [
      'Maximum 120 guests permitted simultaneously',
      'Music prohibited after 10:00 PM as per society bylaws',
      'Resident must be present throughout the event',
      'Cleanliness & trash clearance mandatory after event'
    ],
    pricing: 'Free for Community Residents (Refundable Security: Rs. 2,000)',
    imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'gym',
    name: 'Fitness Gym & Yoga Studio',
    category: 'Fitness & Health',
    icon: 'Dumbbell',
    capacity: 25,
    openingHours: '06:00 - 22:00',
    slotDurationMinutes: 60,
    rules: [
      'Gym attire and non-marking sports shoes strictly required',
      'Sanitize workout machines and weights after each set',
      'Guests not allowed during peak hours (6 AM - 9 AM, 6 PM - 9 PM)'
    ],
    pricing: 'Complimentary for all flat residents',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'pool',
    name: 'Olympic Infinity Pool',
    category: 'Aquatics & Leisure',
    icon: 'Waves',
    capacity: 30,
    openingHours: '06:30 - 20:30',
    slotDurationMinutes: 60,
    rules: [
      'Nylon or Lycra swimwear strictly enforced',
      'Children under 12 must be accompanied by an adult guardian',
      'Shower before entering pool; no glassware in pool zone'
    ],
    pricing: 'Complimentary for residents',
    imageUrl: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'tennis',
    name: 'Tennis & Badminton Court',
    category: 'Sports & Athletics',
    icon: 'Trophy',
    capacity: 8,
    openingHours: '06:00 - 21:00',
    slotDurationMinutes: 60,
    rules: [
      'Strictly non-marking court shoes only',
      'Maximum 1 court hour booking per residence per day',
      'Bring personal racquets and shuttlecocks / balls'
    ],
    pricing: 'Complimentary with advance reservation',
    imageUrl: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&auto=format&fit=crop&q=80'
  }
];
