// Seed data for Nivasa Community Management Platform

export const initialSocieties = [
  {
    "_id": "67a800000000000000000001",
    "name": "Gulmohar Greens Heights",
    "code": "GGH-PUN",
    "address": "Plot 44-48, Sector 18, Kharadi Bypass",
    "city": "Pune",
    "state": "Maharashtra",
    "pincode": "411014",
    "totalFlats": 160,
    "activeWings": [
      "Wing A (Emerald)",
      "Wing B (Sapphire)",
      "Wing C (Ruby)"
    ],
    "logoUrl": "",
    "contactEmail": "admin@gulmohargreens.org",
    "contactPhone": "+91 20 2744 8899"
  },
  {
    "_id": "67a800000000000000000002",
    "name": "Palm Crest Residency",
    "code": "PCR-MUM",
    "address": "Palm Beach Road, Sector 19A, Nerul",
    "city": "Navi Mumbai",
    "state": "Maharashtra",
    "pincode": "400706",
    "totalFlats": 220,
    "activeWings": [
      "Tower 1",
      "Tower 2",
      "Tower 3"
    ],
    "logoUrl": "",
    "contactEmail": "admin@palmcrestresidency.com",
    "contactPhone": "+91 22 2770 1234"
  }
];

export const initialUsers = [
  {
    "_id": "67a800000000000000000010",
    "societyId": "67a800000000000000000001",
    "name": "Priya Sharma",
    "email": "admin@gulmohar.com",
    "password": "password123",
    "phone": "+91 98230 11223",
    "role": "admin",
    "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    "status": "active",
    "wing": "Wing A",
    "flatNumber": "Admin Suite A-101"
  },
  {
    "_id": "67a800000000000000000011",
    "societyId": "67a800000000000000000001",
    "name": "Rahul & Ananya Verma",
    "email": "resident@gulmohar.com",
    "password": "password123",
    "phone": "+91 98221 44556",
    "role": "resident",
    "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "status": "active",
    "wing": "Wing B",
    "flatNumber": "B-402",
    "isOwner": true,
    "familyMembers": [
      {
        "name": "Ananya Verma",
        "relation": "Spouse",
        "phone": "+91 98221 44557"
      },
      {
        "name": "Aarav Verma",
        "relation": "Son",
        "phone": ""
      }
    ]
  },
  {
    "_id": "67a800000000000000000012",
    "societyId": "67a800000000000000000001",
    "name": "Ramesh Singh",
    "email": "security@gulmohar.com",
    "password": "password123",
    "phone": "+91 98110 77889",
    "role": "security",
    "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "status": "active",
    "gatePost": "Main Gate 1 (North Arch)",
    "badgeNumber": "SEC-089"
  },
  {
    "_id": "67a800000000000000000013",
    "societyId": "67a800000000000000000001",
    "name": "Sunil Kumar (Apex Plumbing)",
    "email": "vendor@gulmohar.com",
    "password": "password123",
    "phone": "+91 98901 33445",
    "role": "vendor",
    "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    "status": "active",
    "businessName": "Apex Plumbing & Sanitation Services",
    "serviceCategory": "Plumbing",
    "rating": 4.85
  },
  {
    "_id": "67a800000000000000000020",
    "societyId": "67a800000000000000000002",
    "name": "Vikram Merchant",
    "email": "resident@palmcrest.com",
    "password": "password123",
    "phone": "+91 98200 99881",
    "role": "resident",
    "avatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    "status": "active",
    "wing": "Tower 1",
    "flatNumber": "T1-1204",
    "isOwner": true
  }
];

export const initialFlats = [
  {
    "_id": "67a800000000000000000101",
    "societyId": "67a800000000000000000001",
    "wing": "Wing B (Sapphire)",
    "flatNumber": "B-402",
    "floor": 4,
    "type": "3 BHK",
    "areaSqFt": 1580,
    "status": "occupied",
    "occupancyType": "owner",
    "primaryResident": {
      "name": "Rahul & Ananya Verma",
      "email": "resident@gulmohar.com",
      "phone": "+91 98221 44556",
      "userId": "67a800000000000000000011"
    },
    "familyMembers": [
      {
        "name": "Ananya Verma",
        "relation": "Spouse",
        "phone": "+91 98221 44557"
      },
      {
        "name": "Aarav Verma",
        "relation": "Son",
        "phone": ""
      }
    ],
    "vehicles": [
      {
        "type": "4-Wheeler",
        "model": "Hyundai Creta",
        "regNumber": "MH 12 AB 4590"
      },
      {
        "type": "2-Wheeler",
        "model": "Ather 450X",
        "regNumber": "MH 12 EV 1122"
      }
    ],
    "allocatedParkingSlot": "P-114 (Basement 1)",
    "intercomNumber": "2402"
  },
  {
    "_id": "67a800000000000000000102",
    "societyId": "67a800000000000000000001",
    "wing": "Wing A (Emerald)",
    "flatNumber": "A-101",
    "floor": 1,
    "type": "Admin Suite",
    "areaSqFt": 1200,
    "status": "occupied",
    "occupancyType": "owner",
    "primaryResident": {
      "name": "Priya Sharma (Society Admin)",
      "email": "admin@gulmohar.com",
      "phone": "+91 98230 11223",
      "userId": "67a800000000000000000010"
    },
    "familyMembers": [],
    "vehicles": [
      {
        "type": "4-Wheeler",
        "model": "Honda City",
        "regNumber": "MH 12 PS 8899"
      }
    ],
    "allocatedParkingSlot": "P-001 (Ground Floor)",
    "intercomNumber": "1101"
  },
  {
    "_id": "67a800000000000000000103",
    "societyId": "67a800000000000000000001",
    "wing": "Wing A (Emerald)",
    "flatNumber": "A-102",
    "floor": 1,
    "type": "2 BHK",
    "areaSqFt": 1100,
    "status": "occupied",
    "occupancyType": "owner",
    "primaryResident": {
      "name": "Sunita Mehra",
      "email": "sunita.mehra@gmail.com",
      "phone": "+91 98220 33221"
    },
    "familyMembers": [
      {
        "name": "Kavita Mehra",
        "relation": "Daughter",
        "phone": "+91 98220 33222"
      }
    ],
    "vehicles": [
      {
        "type": "2-Wheeler",
        "model": "Honda Activa",
        "regNumber": "MH 12 CD 3344"
      }
    ],
    "allocatedParkingSlot": "P-012 (Ground Floor)",
    "intercomNumber": "1102"
  },
  {
    "_id": "67a800000000000000000104",
    "societyId": "67a800000000000000000001",
    "wing": "Wing A (Emerald)",
    "flatNumber": "A-301",
    "floor": 3,
    "type": "3 BHK",
    "areaSqFt": 1550,
    "status": "occupied",
    "occupancyType": "tenant",
    "primaryResident": {
      "name": "Rohan Deshmukh",
      "email": "rohan.deshmukh@gmail.com",
      "phone": "+91 98900 11990"
    },
    "familyMembers": [],
    "vehicles": [
      {
        "type": "4-Wheeler",
        "model": "Kia Seltos",
        "regNumber": "MH 14 KT 7766"
      }
    ],
    "allocatedParkingSlot": "P-045 (Basement 1)",
    "intercomNumber": "1301"
  },
  {
    "_id": "67a800000000000000000105",
    "societyId": "67a800000000000000000001",
    "wing": "Wing B (Sapphire)",
    "flatNumber": "B-201",
    "floor": 2,
    "type": "2 BHK",
    "areaSqFt": 1080,
    "status": "vacant",
    "occupancyType": "vacant",
    "primaryResident": null,
    "familyMembers": [],
    "vehicles": [],
    "allocatedParkingSlot": "P-088 (Basement 1)",
    "intercomNumber": "2201"
  },
  {
    "_id": "67a800000000000000000106",
    "societyId": "67a800000000000000000001",
    "wing": "Wing B (Sapphire)",
    "flatNumber": "B-502",
    "floor": 5,
    "type": "3 BHK",
    "areaSqFt": 1600,
    "status": "occupied",
    "occupancyType": "owner",
    "primaryResident": {
      "name": "Deepak Joshi",
      "email": "deepak.joshi@techcorp.com",
      "phone": "+91 98810 55443"
    },
    "familyMembers": [
      {
        "name": "Pooja Joshi",
        "relation": "Spouse",
        "phone": "+91 98810 55444"
      },
      {
        "name": "Tanvi Joshi",
        "relation": "Daughter",
        "phone": ""
      }
    ],
    "vehicles": [
      {
        "type": "4-Wheeler",
        "model": "Tata Harrier",
        "regNumber": "MH 12 TH 9900"
      }
    ],
    "allocatedParkingSlot": "P-125 (Basement 1)",
    "intercomNumber": "2502"
  },
  {
    "_id": "67a800000000000000000107",
    "societyId": "67a800000000000000000001",
    "wing": "Wing C (Ruby)",
    "flatNumber": "C-204",
    "floor": 2,
    "type": "2 BHK",
    "areaSqFt": 1150,
    "status": "occupied",
    "occupancyType": "owner",
    "primaryResident": {
      "name": "Aditi Rao",
      "email": "aditi.rao@consulting.com",
      "phone": "+91 98233 77112"
    },
    "familyMembers": [],
    "vehicles": [
      {
        "type": "4-Wheeler",
        "model": "Maruti Baleno",
        "regNumber": "MH 12 MB 5543"
      }
    ],
    "allocatedParkingSlot": "P-208 (Basement 2)",
    "intercomNumber": "3204"
  },
  {
    "_id": "67a800000000000000000108",
    "societyId": "67a800000000000000000001",
    "wing": "Wing C (Ruby)",
    "flatNumber": "C-601",
    "floor": 12,
    "type": "Penthouse",
    "areaSqFt": 2850,
    "status": "occupied",
    "occupancyType": "owner",
    "primaryResident": {
      "name": "Karan & Megha Kapoor",
      "email": "karan.kapoor@venture.com",
      "phone": "+91 98200 44332"
    },
    "familyMembers": [
      {
        "name": "Megha Kapoor",
        "relation": "Spouse",
        "phone": "+91 98200 44333"
      },
      {
        "name": "Reyansh Kapoor",
        "relation": "Son",
        "phone": ""
      }
    ],
    "vehicles": [
      {
        "type": "4-Wheeler",
        "model": "BMW 3 Series",
        "regNumber": "MH 12 KK 0007"
      },
      {
        "type": "4-Wheeler",
        "model": "Volvo XC60",
        "regNumber": "MH 12 KK 0008"
      }
    ],
    "allocatedParkingSlot": "P-301 & P-302 (Ground VIP)",
    "intercomNumber": "3601"
  },
  {
    "_id": "67a800000000000000000120",
    "societyId": "67a800000000000000000002",
    "wing": "Tower 1",
    "flatNumber": "T1-1204",
    "floor": 12,
    "type": "3 BHK",
    "areaSqFt": 1750,
    "status": "occupied",
    "occupancyType": "owner",
    "primaryResident": {
      "name": "Vikram Merchant",
      "email": "resident@palmcrest.com",
      "phone": "+91 98200 99881",
      "userId": "67a800000000000000000020"
    },
    "familyMembers": [],
    "vehicles": [
      {
        "type": "4-Wheeler",
        "model": "Mercedes C-Class",
        "regNumber": "MH 02 MC 1234"
      }
    ],
    "allocatedParkingSlot": "PC-1204",
    "intercomNumber": "11204"
  }
];

export const initialComplaints = [
  {
    "_id": "67a800000000000000000201",
    "societyId": "67a800000000000000000001",
    "complaintNumber": "CMP-104",
    "flatNumber": "B-402",
    "wing": "Wing B",
    "residentId": "67a800000000000000000011",
    "residentName": "Rahul Verma",
    "residentPhone": "+91 98221 44556",
    "title": "Water leakage from bathroom ceiling",
    "description": "Continuous water dripping from the bathroom ceiling slab. Paint is peeling off and moisture is spreading to the corridor wall.",
    "category": "Plumbing",
    "priority": "High",
    "preferredVisitTime": "Afternoon (12 PM - 4 PM)",
    "assignedVendor": {
      "vendorId": "67a800000000000000000013",
      "name": "Sunil Kumar (Apex Plumbing)",
      "businessName": "Apex Plumbing Solutions",
      "phone": "+91 98901 33445",
      "category": "Plumbing",
      "assignedAt": "2026-09-14T16:48:57.670Z"
    },
    "status": "In Progress",
    "scheduledVisit": {
      "visitDate": "2026-09-14",
      "timeSlot": "Afternoon (12 PM - 4 PM)"
    },
    "aiClassification": {
      "isAiAssisted": true,
      "suggestedCategory": "Plumbing",
      "suggestedPriority": "High",
      "confidence": 0.94,
      "source": "groq-ai",
      "summary": "Active ceiling water leak requiring immediate plumbing inspection of overhead slab pipeline."
    },
    "timeline": [
      {
        "stage": "Created",
        "timestamp": "2026-09-14T15:48:57.671Z",
        "actor": "Rahul Verma",
        "role": "resident",
        "note": "Complaint submitted with Groq AI priority recommendation."
      },
      {
        "stage": "Under Review",
        "timestamp": "2026-09-14T16:18:57.671Z",
        "actor": "Priya Sharma",
        "role": "admin",
        "note": "AI classification reviewed and approved."
      },
      {
        "stage": "Assigned",
        "timestamp": "2026-09-14T16:48:57.671Z",
        "actor": "Priya Sharma",
        "role": "admin",
        "note": "Assigned to Apex Plumbing."
      },
      {
        "stage": "In Progress",
        "timestamp": "2026-09-14T17:18:57.671Z",
        "actor": "Sunil Kumar",
        "role": "vendor",
        "note": "Vendor arrived on-site. Inspection in progress."
      }
    ],
    "workNotes": "Ceiling plaster damp. Water dripping from unit B-502 overhead line.",
    "createdAt": "2026-09-14T15:48:57.671Z",
    "updatedAt": "2026-09-14T17:18:57.671Z"
  },
  {
    "_id": "67a800000000000000000202",
    "societyId": "67a800000000000000000001",
    "complaintNumber": "CMP-103",
    "flatNumber": "A-102",
    "wing": "Wing A",
    "residentId": "67a800000000000000000010",
    "residentName": "Sunita Mehra",
    "residentPhone": "+91 98220 33221",
    "title": "Corridor circuit breaker tripping",
    "description": "Corridor lights switchboard trips every time the geyser is powered on.",
    "category": "Electrical",
    "priority": "Medium",
    "preferredVisitTime": "Morning (9 AM - 12 PM)",
    "assignedVendor": null,
    "status": "Under Review",
    "aiClassification": {
      "isAiAssisted": true,
      "suggestedCategory": "Electrical",
      "suggestedPriority": "Medium",
      "confidence": 0.89,
      "source": "groq-ai",
      "summary": "Circuit overload between heavy appliance load and common corridor MCB."
    },
    "timeline": [
      {
        "stage": "Created",
        "timestamp": "2026-09-13T17:48:57.671Z",
        "actor": "Sunita Mehra",
        "role": "resident",
        "note": "Complaint filed."
      }
    ],
    "createdAt": "2026-09-13T17:48:57.671Z",
    "updatedAt": "2026-09-13T17:48:57.671Z"
  }
];

export const initialVisitors = [
  {
    "_id": "67a800000000000000000301",
    "societyId": "67a800000000000000000001",
    "visitorNumber": "VIS-901",
    "passcode": "718902",
    "name": "Dr. Rajesh Kulkarni",
    "phone": "+91 98220 12345",
    "vehicleNumber": "MH 12 RT 8821",
    "flatNumber": "B-402",
    "wing": "Wing B (Sapphire)",
    "hostResidentId": "67a800000000000000000011",
    "hostResidentName": "Rahul & Ananya Verma",
    "type": "Guest",
    "status": "Pre-Approved",
    "entryTime": null,
    "exitTime": null,
    "entryGate": "Main Gate 1",
    "securityGuardName": "Ramesh Singh",
    "securityGuardBadge": "SEC-089",
    "timeline": [
      {
        "stage": "Pre-Approved",
        "timestamp": "2026-09-14T16:48:57.671Z",
        "actor": "Rahul Verma",
        "role": "resident",
        "note": "Passcode generated: 718902"
      }
    ],
    "createdAt": "2026-09-14T16:48:57.671Z"
  },
  {
    "_id": "67a800000000000000000302",
    "societyId": "67a800000000000000000001",
    "visitorNumber": "VIS-902",
    "passcode": "492019",
    "name": "Mohit Agarwal",
    "phone": "+91 98450 67890",
    "vehicleNumber": "MH 14 DE 4004",
    "flatNumber": "B-402",
    "wing": "Wing B (Sapphire)",
    "hostResidentId": "67a800000000000000000011",
    "hostResidentName": "Rahul & Ananya Verma",
    "type": "Guest",
    "status": "Inside",
    "entryTime": "2026-09-14T17:03:57.671Z",
    "exitTime": null,
    "entryGate": "Gate 1",
    "securityGuardName": "Ramesh Singh",
    "securityGuardBadge": "SEC-089",
    "timeline": [
      {
        "stage": "Pre-Approved",
        "timestamp": "2026-09-14T15:48:57.671Z",
        "actor": "Rahul Verma",
        "role": "resident",
        "note": "Passcode generated."
      },
      {
        "stage": "Gate Entry Authorized",
        "timestamp": "2026-09-14T17:03:57.671Z",
        "actor": "Ramesh Singh",
        "role": "security",
        "note": "Passcode verified at Gate 1."
      }
    ],
    "createdAt": "2026-09-14T15:48:57.671Z"
  },
  {
    "_id": "67a800000000000000000303",
    "societyId": "67a800000000000000000001",
    "visitorNumber": "VIS-903",
    "passcode": "883912",
    "name": "Suresh Patil",
    "phone": "+91 97650 33441",
    "vehicleNumber": "MH 12 ZX 9911",
    "flatNumber": "A-102",
    "wing": "Wing A (Emerald)",
    "hostResidentId": "67a800000000000000000010",
    "hostResidentName": "Sunita Mehra",
    "type": "Service / Contractor",
    "status": "Inside",
    "entryTime": "2026-09-14T16:18:57.671Z",
    "exitTime": null,
    "entryGate": "Gate 1",
    "securityGuardName": "Ramesh Singh",
    "securityGuardBadge": "SEC-089",
    "timeline": [
      {
        "stage": "Gate Entry Authorized",
        "timestamp": "2026-09-14T16:18:57.671Z",
        "actor": "Ramesh Singh",
        "role": "security",
        "note": "Walk-in verified by phone call."
      }
    ],
    "createdAt": "2026-09-14T16:18:57.671Z"
  }
];

const todayStr = new Date().toISOString().split("T")[0];
const tomorrowDate = new Date(Date.now() + 86400000);
const tomorrowStr = tomorrowDate.toISOString().split("T")[0];
const dayAfterDate = new Date(Date.now() + 2 * 86400000);
const dayAfterStr = dayAfterDate.toISOString().split("T")[0];

export const initialDeliveries = [
  {
    "_id": "67a800000000000000000351",
    "societyId": "67a800000000000000000001",
    "deliveryNumber": "DEL-101",
    "flatNumber": "B-402",
    "wing": "Wing B (Sapphire)",
    "residentName": "Rahul & Ananya Verma",
    "carrier": "Amazon",
    "packageCount": 2,
    "trackingNumber": "AMZ-IN-889210",
    "photoUrl": "",
    "status": "Waiting at Gate",
    "arrivalGate": "Main Gate 1",
    "securityGuardName": "Ramesh Singh",
    "arrivedAt": "2026-09-14T17:03:57.671Z",
    "pickedUpAt": null,
    "pickedUpBy": "",
    "pickupOtp": "4821",
    "notes": "Two brown boxes placed on Parcel Rack Shelf B-2."
  },
  {
    "_id": "67a800000000000000000352",
    "societyId": "67a800000000000000000001",
    "deliveryNumber": "DEL-102",
    "flatNumber": "A-101",
    "wing": "Wing A (Emerald)",
    "residentName": "Priya Sharma",
    "carrier": "Flipkart",
    "packageCount": 1,
    "trackingNumber": "FKT-992144",
    "photoUrl": "",
    "status": "Waiting at Gate",
    "arrivalGate": "Main Gate 1",
    "securityGuardName": "Ramesh Singh",
    "arrivedAt": "2026-09-14T16:18:57.671Z",
    "pickedUpAt": null,
    "pickedUpBy": "",
    "pickupOtp": "7193",
    "notes": "Electronics parcel with tamper seal intact."
  },
  {
    "_id": "67a800000000000000000353",
    "societyId": "67a800000000000000000001",
    "deliveryNumber": "DEL-103",
    "flatNumber": "C-304",
    "wing": "Wing C (Ruby)",
    "residentName": "Aditi Rao",
    "carrier": "Blinkit",
    "packageCount": 3,
    "trackingNumber": "BLK-4401",
    "photoUrl": "",
    "status": "Waiting at Gate",
    "arrivalGate": "Main Gate 1",
    "securityGuardName": "Ramesh Singh",
    "arrivedAt": "2026-09-14T17:23:57.671Z",
    "pickedUpAt": null,
    "pickedUpBy": "",
    "pickupOtp": "1904",
    "notes": "Chilled groceries bag, kept in security cooler."
  }
];

export const initialFacilities = [
  {
    "id": "clubhouse",
    "name": "Clubhouse Banquet & Lounge",
    "category": "Celebration & Events",
    "icon": "Building2",
    "capacity": 120,
    "openingHours": "09:00 - 22:00",
    "slotDurationMinutes": 120,
    "rules": [
      "Maximum 120 guests permitted simultaneously",
      "Music prohibited after 10:00 PM as per society bylaws",
      "Resident must be present throughout the event",
      "Cleanliness & trash clearance mandatory after event"
    ],
    "pricing": "Free for Community Residents (Refundable Security: Rs. 2,000)",
    "imageUrl": "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=80"
  },
  {
    "id": "gym",
    "name": "Fitness Gym & Yoga Studio",
    "category": "Fitness & Health",
    "icon": "Dumbbell",
    "capacity": 25,
    "openingHours": "06:00 - 22:00",
    "slotDurationMinutes": 60,
    "rules": [
      "Gym attire and non-marking sports shoes strictly required",
      "Sanitize workout machines and weights after each set",
      "Guests not allowed during peak hours (6 AM - 9 AM, 6 PM - 9 PM)"
    ],
    "pricing": "Complimentary for all flat residents",
    "imageUrl": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80"
  },
  {
    "id": "pool",
    "name": "Olympic Infinity Pool",
    "category": "Aquatics & Leisure",
    "icon": "Waves",
    "capacity": 30,
    "openingHours": "06:30 - 20:30",
    "slotDurationMinutes": 60,
    "rules": [
      "Nylon or Lycra swimwear strictly enforced",
      "Children under 12 must be accompanied by an adult guardian",
      "Shower before entering pool; no glassware in pool zone"
    ],
    "pricing": "Complimentary for residents",
    "imageUrl": "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&auto=format&fit=crop&q=80"
  },
  {
    "id": "tennis",
    "name": "Tennis & Badminton Court",
    "category": "Sports & Athletics",
    "icon": "Trophy",
    "capacity": 8,
    "openingHours": "06:00 - 21:00",
    "slotDurationMinutes": 60,
    "rules": [
      "Strictly non-marking court shoes only",
      "Maximum 1 court hour booking per residence per day",
      "Bring personal racquets and shuttlecocks / balls"
    ],
    "pricing": "Complimentary with advance reservation",
    "imageUrl": "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&auto=format&fit=crop&q=80"
  }
];

export const initialFacilityBookings = [
  {
    _id: "67a800000000000000000401",
    societyId: "67a800000000000000000001",
    bookingNumber: "BKG-101",
    facilityId: "tennis",
    facilityName: "Tennis & Badminton Court",
    residentId: "67a800000000000000000011",
    residentName: "Rahul Verma",
    flatNumber: "B-402",
    wing: "Wing B",
    date: tomorrowStr,
    startTime: "18:00",
    endTime: "19:00",
    purpose: "Evening Badminton Match with neighbor",
    guestCount: 2,
    status: "Booked",
    bookedAt: new Date(Date.now() - 4 * 3600 * 1000),
  },
  {
    _id: "67a800000000000000000402",
    societyId: "67a800000000000000000001",
    bookingNumber: "BKG-102",
    facilityId: "clubhouse",
    facilityName: "Clubhouse Banquet & Lounge",
    residentId: "67a800000000000000000014",
    residentName: "Deepak Joshi",
    flatNumber: "A-502",
    wing: "Wing A",
    date: dayAfterStr,
    startTime: "18:00",
    endTime: "21:00",
    purpose: "Family Birthday Celebration",
    guestCount: 40,
    status: "Booked",
    bookedAt: new Date(Date.now() - 24 * 3600 * 1000),
  },
  {
    _id: "67a800000000000000000403",
    societyId: "67a800000000000000000001",
    bookingNumber: "BKG-103",
    facilityId: "gym",
    facilityName: "Fitness Gym & Yoga Studio",
    residentId: "67a800000000000000000015",
    residentName: "Aditi Rao",
    flatNumber: "C-304",
    wing: "Wing C",
    date: todayStr,
    startTime: "07:00",
    endTime: "08:00",
    purpose: "Morning Yoga Session",
    guestCount: 1,
    status: "Completed",
    bookedAt: new Date(Date.now() - 48 * 3600 * 1000),
  },
];