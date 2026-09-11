import http from 'node:http';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Milestone 5 Integration Tests...');

  // 1. Login as resident (Rahul Verma, Flat B-402)
  const residentLogin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'resident@gulmohar.com', password: 'password123' });

  if (!residentLogin.data.success) {
    throw new Error('Resident login failed: ' + JSON.stringify(residentLogin.data));
  }
  const residentToken = residentLogin.data.token;
  const societyId = residentLogin.data.user.societyId;
  console.log('✅ Resident logged in. Flat:', residentLogin.data.user.flatNumber);

  // 2. Login as security (Ramesh Singh)
  const securityLogin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'security@gulmohar.com', password: 'password123' });

  const securityToken = securityLogin.data.token;
  console.log('✅ Security guard logged in.');

  // 3. Test Security logging incoming parcel for B-402
  const logDeliveryRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/deliveries',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${securityToken}`,
      'x-society-id': societyId,
    },
  }, {
    flatNumber: 'B-402',
    wing: 'Wing B',
    residentName: 'Rahul Verma',
    carrier: 'Amazon',
    packageCount: 2,
    trackingNumber: 'AMZ-TEST-9921',
    notes: 'Fragile electronic item',
  });

  console.log('📦 Delivery Logged:', logDeliveryRes.status, logDeliveryRes.data.message);
  if (logDeliveryRes.status !== 201) throw new Error('Delivery creation failed');
  const loggedDelivery = logDeliveryRes.data.delivery;

  // 4. Test Resident fetching deliveries
  const residentDeliveries = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/deliveries',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${residentToken}`,
      'x-society-id': societyId,
    },
  });
  console.log(`📦 Resident Deliveries count: ${residentDeliveries.data.count}`);

  // 4b. Test Resident sharing Amazon courier OTP with Security
  const shareOtpRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/deliveries/${loggedDelivery._id}/share-courier-otp`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${residentToken}`,
      'x-society-id': societyId,
    },
  }, { otp: '8492' });
  console.log('📲 Resident shared Courier OTP:', shareOtpRes.status, shareOtpRes.data.message);
  if (shareOtpRes.status !== 200) throw new Error('Share courier OTP failed');

  // 4c. Test Security marking OTP as shared with courier
  const otpSharedRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/deliveries/${loggedDelivery._id}/otp-shared`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${securityToken}`,
      'x-society-id': societyId,
    },
  });
  console.log('👮 Security marked OTP shared with courier:', otpSharedRes.status, otpSharedRes.data.message);
  if (otpSharedRes.status !== 200) throw new Error('Mark OTP shared failed');

  // 5. Test Resident Confirming Pickup / Collection
  const pickupRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/deliveries/${loggedDelivery._id}/pickup`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${residentToken}`,
      'x-society-id': societyId,
    },
  }, { otp: loggedDelivery.pickupOtp });

  console.log('📦 Delivery Pickup:', pickupRes.status, pickupRes.data.message);
  if (pickupRes.status !== 200) throw new Error('Pickup confirmation failed');

  // 6. Test Facility Directory
  const facilitiesRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/facilities',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${residentToken}`,
      'x-society-id': societyId,
    },
  });
  console.log(`🏛️ Facilities catalog: ${facilitiesRes.data.facilities.length} amenities available`);

  // Fetch existing bookings for Flat B-402 and cancel any previously generated test bookings
  const existingBookingsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/facilities/bookings',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${residentToken}`,
      'x-society-id': societyId,
    },
  });

  if (existingBookingsRes.data.bookings) {
    for (const b of existingBookingsRes.data.bookings) {
      if (b.status === 'Booked' && b.bookingNumber !== 'BKG-101') {
        await makeRequest({
          hostname: 'localhost',
          port: 5000,
          path: `/api/facilities/${b._id}/cancel`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${residentToken}`,
            'x-society-id': societyId,
          },
        }, { reason: 'Clean up previous test run' });
      }
    }
  }

  // 7. Test Facility Booking: Book Tennis Court for dynamic date
  const randomOffsetDays = 30 + Math.floor(Math.random() * 50);
  const bookingDate = new Date(Date.now() + randomOffsetDays * 86400000).toISOString().split('T')[0];
  console.log(`📅 Testing reservation on date: ${bookingDate}`);
  const bookRes1 = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/facilities/book',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${residentToken}`,
      'x-society-id': societyId,
    },
  }, {
    facilityId: 'tennis',
    facilityName: 'Tennis & Badminton Court',
    date: bookingDate,
    startTime: '14:00',
    endTime: '15:00',
    purpose: 'Friendly match with flat A-201',
    guestCount: 2,
  });

  console.log('🎾 Booking 1 (Tennis 14:00 - 15:00):', bookRes1.status, bookRes1.data.message);
  if (bookRes1.status !== 201) throw new Error('First booking failed: ' + JSON.stringify(bookRes1.data));

  // 8. Test Atomic Overlap Prevention: Attempt overlapping booking for 14:30 - 15:30 on same date & court
  const bookResConflict = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/facilities/book',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${residentToken}`,
      'x-society-id': societyId,
    },
  }, {
    facilityId: 'tennis',
    facilityName: 'Tennis & Badminton Court',
    date: bookingDate,
    startTime: '14:30',
    endTime: '15:30',
    purpose: 'Overlapping attempt',
    guestCount: 2,
  });

  console.log('🛡️ Overlap Conflict Test (14:30 - 15:30):', bookResConflict.status, bookResConflict.data.message);
  if (bookResConflict.status !== 409) {
    throw new Error('Expected 409 conflict, got: ' + bookResConflict.status);
  }
  console.log('✅ Overlap strictly blocked with 409 Conflict!');

  // 9. Test Quota Limit: Flat B-402 already has tomorrow (seed) + bookingDate (just booked) = 2 active bookings!
  // Attempting a 3rd booking for B-402 on another date
  const bookResQuota = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/facilities/book',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${residentToken}`,
      'x-society-id': societyId,
    },
  }, {
    facilityId: 'gym',
    facilityName: 'Fitness Gym & Yoga Studio',
    date: '2026-10-18',
    startTime: '08:00',
    endTime: '09:00',
    purpose: 'Cardio workout',
    guestCount: 1,
  });

  console.log('📊 Quota Exceeded Test (3rd booking attempt):', bookResQuota.status, bookResQuota.data.message);
  if (bookResQuota.status !== 400) {
    throw new Error('Expected 400 Quota Exceeded, got: ' + bookResQuota.status);
  }
  console.log('✅ Quota limit of 2 active reservations strictly enforced with 400 Bad Request!');

  // 10. Test Cancellation: Cancel the first booking
  const cancelRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/facilities/${bookRes1.data.booking._id}/cancel`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${residentToken}`,
      'x-society-id': societyId,
    },
  }, { reason: 'Rescheduling match' });

  console.log('🚫 Booking Cancellation:', cancelRes.status, cancelRes.data.message);
  if (cancelRes.status !== 200) throw new Error('Cancellation failed');

  console.log('🎉 ALL MILESTONE 5 BACKEND API & CONFLICT TESTS PASSED!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
