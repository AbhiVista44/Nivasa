# 🏰 Nivasa — Smart Residential Community OS

[![Architecture](https://img.shields.io/badge/Architecture-Multi--Tenant%20RBAC-0D9488.svg)](https://github.com)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20TailwindCSS%20v4-0284C7.svg)](https://react.dev)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%20%7C%20Socket.IO-10B981.svg)](https://nodejs.org)
[![Database](https://img.shields.io/badge/Database-MongoDB%20%7C%20Mongoose-47A248.svg)](https://www.mongodb.com)
[![Audio](https://img.shields.io/badge/Audio-Web%20Audio%20API%20Synthesizer-F59E0B.svg)](https://developer.mozilla.org)

**Nivasa** is an enterprise-grade, multi-tenant residential community management platform engineered for gated societies, high-rise condominiums, and township ecosystems. Built with real-time socket synchronization, role-based workflows, offline-safe Web Audio tone synthesis, and bulletproof tenant isolation.

---

## ✨ System Highlights & Milestones

### 🏢 1. Multi-Tenant Foundation & Granular RBAC
- **Strict Tenant Isolation**: `x-society-id` header validation across all database queries ensuring zero cross-society data leakage.
- **Role-Based Access Control**: 4 tailored user roles (**Admin**, **Resident**, **Security Guard**, and **Vendor**) with custom navigation and permission matrix.
- **Multi-Society Switcher & Instant Role Switcher**: Paired development and testing controls embedded in the navigation bar.

### 🛡️ 2. GateKeeper & Visitor Entry Hub
- **Digital Guest Passes**: One-click visitor pass generation with scannable QR tokens.
- **Security Check-In Kiosk**: Instant QR code validation, vehicle registration number logging, purpose tagging, and photo capture.
- **Pass Status Lifecycle**: `pending` ➔ `approved` ➔ `checked_in` ➔ `checked_out` / `rejected`.

### 📦 3. Delivery Ledger & Overstay Guard
- **Parcel Inward Logging**: Delivery partner tagging (Amazon, Flipkart, Swiggy, Zomato, Blinkit, etc.).
- **Resident OTP Verification**: Secure pickup confirmation using a 4-digit generated passcode.
- **Overstay & Vehicle Guard**: Real-time timer highlighting deliveries and vehicles on premises exceeding scheduled thresholds.

### 🏊 4. Amenity Booking & Blackout Engine
- **Resource Management**: Clubhouses, swimming pools, tennis courts, banquet halls, and BBQ lawns.
- **Smart Conflict Prevention**: Atomic time slot reservation with strict capacity enforcement and society maintenance blackout windows.
- **Live Utilization Metrics**: Real-time occupancy gauges and booking histories.

### 🔧 5. Maintenance Tickets & Vendor SLA Engine
- **Categorized Work Orders**: Plumbing, electrical, carpentry, HVAC, elevator, and common area repairs with priority tags (`urgent`, `high`, `medium`, `low`).
- **Vendor Work Allocation**: Admin assignment of approved service technicians to specific tickets.
- **Resolution Lifecycle & SLA Metrics**: Timestamps for creation, dispatch, in-progress, resolution, and resident rating.

### 📢 6. Notice Board, Vendor Directory & Audit Trail
- **Society-Wide & Wing Notices**: Priority announcements with read/unread tracking and urgent broadcast banners.
- **Approved Vendor Directory**: Verified neighborhood services (plumbers, electricians, appliance repair) with direct emergency contacts, operating hours, and resident reviews.
- **Immutable Society Audit Trail**: Chronological, tamper-evident log capturing critical actions (visitor approvals, gate check-ins, ticket dispatches, role changes, notice broadcasts) with actor, IP, tenant, and timestamp.

### ⚡ 7. Real-Time Socket.IO Hub & Notification Center
- **Multi-Tenant Room Architecture**: Dynamic Socket.IO rooms for `society_${id}`, `user_${id}`, `flat_${number}`, and `role_${role}_${societyId}`.
- **1-Click Gate Arrival Approval Modal**: Instant resident screen takeover popup when visitors or deliveries arrive at the security checkpoint.
- **Web Audio Tone Synthesis**: Pure zero-latency client-side sound engine synthesizing dual-tone chimes, gate bells, and emergency sirens with zero MP3 dependencies.
- **Glassmorphic Notification Bell Tray**: Unread counter badges, category filters (`visitors`, `complaints`, `deliveries`, `notices`), and granular user audio preference controls.
- **Resend HTML Mailer**: Automatic offline email notifications for gate approvals, OTP deliveries, and urgent society notices.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017/nivasa`) or MongoDB Atlas URI

### 1. Repository Setup & Dependencies

```bash
# Clone the repository
git clone https://github.com/your-username/nivasa.git
cd nivasa

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Environment Configuration

#### Backend Configuration (`server/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/nivasa
JWT_SECRET=nivasa_ultra_secure_jwt_secret_key_2026
CLIENT_URL=http://localhost:5173
RESEND_API_KEY=re_demo_simulation_key_or_live_key
S3_BUCKET=nivasa-media
```

#### Frontend Configuration (`.env`):
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Database Seeding

Populate realistic demo societies, flats, users, passes, amenities, complaints, notices, vendors, and audit logs:

```bash
cd server
node src/seeders/seed.js
cd ..
```

### 4. Running the Development Stack

#### Start Backend API & Socket Hub (Terminal 1):
```bash
cd server
npm run dev
# Server running at http://localhost:5000
```

#### Start Frontend Application (Terminal 2):
```bash
npm run dev
# Vite server running at http://localhost:5173
```

---

## 👥 Demo Logins & Credentials

All demo accounts share the password: `password123`

| Role | Email | Name | Society / Flat |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@nivasa.com` | Rajesh Sharma | Palm Meadows (A-101) |
| **Resident** | `resident@nivasa.com` | Priya Patel | Palm Meadows (B-402) |
| **Security** | `security@nivasa.com` | Bahadur Singh | Palm Meadows (Gate 1) |
| **Vendor** | `vendor@nivasa.com` | Suresh Kumar | QuickFix Electricals |

> 💡 **Tip**: Use the **Demo Role Switcher** pill in the top navigation bar to seamlessly alternate between Admin, Resident, Security, and Vendor views in 1 click without logging out!

---

## 🏗️ Project Architecture & Structure

```
Nivasa/
├── public/                 # Static assets & icons
├── src/                    # Frontend React SPA
│   ├── components/         # Reusable UI & Feature Components
│   │   ├── admin/          # Admin dashboards, audits, user registry
│   │   ├── amenities/      # Booking calendars, slot selectors
│   │   ├── auth/           # Login & registration views
│   │   ├── complaints/     # Helpdesk tickets & SLA tracking
│   │   ├── deliveries/     # Parcel ledger, OTP verification, overstay
│   │   ├── layout/         # Navbar, Sidebar, Page Shells
│   │   ├── notices/        # Notice board, circular creator
│   │   ├── notifications/  # NotificationTray, Preferences, Gate Approval Modal
│   │   ├── security/       # GateKeeper kiosk, QR scanner, gate pass creator
│   │   └── vendors/        # Approved vendor directory & emergency contacts
│   ├── context/            # Global React Contexts (Auth, Socket, Theme)
│   ├── services/           # Axios API Client & Endpoint Wrappers
│   ├── App.jsx             # Top-level Routing & Socket Provider Attachment
│   └── index.css           # TailwindCSS v4 theme tokens & styles
├── server/                 # Backend Node.js & Express API
│   ├── src/
│   │   ├── config/         # Database & environment connections
│   │   ├── middleware/     # JWT Auth, RBAC, Multi-Tenant Society Scope
│   │   ├── models/         # Mongoose Schemas (User, Society, Flat, VisitorPass, etc.)
│   │   ├── routes/         # REST API Route Handlers with Socket Emitters
│   │   ├── seeders/        # Comprehensive DB seed script
│   │   ├── services/       # Socket.IO Hub & Resend Email Dispatcher
│   │   └── index.js        # HTTP & WebSocket Server Entry Point
│   └── package.json        # Backend dependencies & scripts
├── vercel.json             # Production SPA rewrite & header config
├── vite.config.js          # Vite bundler configuration
└── package.json            # Frontend dependencies & scripts
```

---

## 🔒 Security & Multi-Tenant Isolation Model

1. **Database-Level Isolation**: Every persistent entity (`VisitorPass`, `Delivery`, `Complaint`, `AmenityBooking`, `Notice`, `Vendor`, `AuditLog`) is indexed by `societyId`.
2. **Middleware Assertion**: All secure routes execute `tenantMiddleware`, verifying that the requesting actor belongs to or is authorized for the target `societyId`.
3. **Socket Channel Scoping**: Real-time broadcasts are directed strictly to tenant-scoped rooms (e.g. `society_${societyId}`, `user_${userId}`), ensuring no cross-society notifications or events are ever leaked.

---

## 📜 License

MIT License © 2026 Nivasa Community OS. Built with precision for modern gated residential living.
