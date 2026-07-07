import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');

  // 1. Clear existing data in correct order
  await prisma.activityLog.deleteMany({});
  await prisma.emergencyAlert.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.settings.deleteMany({});
  await prisma.visitorApproval.deleteMany({});
  await prisma.visitorLog.deleteMany({});
  await prisma.visitorPass.deleteMany({});
  await prisma.visitor.deleteMany({});
  await prisma.securityGuard.deleteMany({});
  await prisma.resident.deleteMany({});
  await prisma.flat.deleteMany({});
  await prisma.floor.deleteMany({});
  await prisma.block.deleteMany({});
  await prisma.apartment.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Cleared existing database tables.');

  // Hash passwords
  const passwordHash = await bcrypt.hash('password123', 10);

  // 2. Create users for roles
  const superAdminUser = await prisma.user.create({
    data: {
      name: 'Super Administrator',
      email: 'superadmin@visitor.com',
      password: passwordHash,
      role: 'SUPER_ADMIN',
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      name: 'Apartment Manager',
      email: 'admin@visitor.com',
      password: passwordHash,
      role: 'APARTMENT_ADMIN',
    },
  });

  const guardUser = await prisma.user.create({
    data: {
      name: 'Officer Rajesh Kumar',
      email: 'guard@visitor.com',
      password: passwordHash,
      role: 'SECURITY_GUARD',
    },
  });

  const residentUser = await prisma.user.create({
    data: {
      name: 'Naveen Kumar',
      email: 'resident@visitor.com',
      password: passwordHash,
      role: 'RESIDENT',
    },
  });

  console.log('Created Users.');

  // 3. Create Apartment
  const apartment = await prisma.apartment.create({
    data: {
      name: 'Greenwood Heights',
      address: 'Plot 45, Sector 4, HSR Layout, Bengaluru, Karnataka - 560102',
      blocksCount: 2,
      floorsCount: 5,
      flatsCount: 20,
      logoUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=150&h=150&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
      ]),
      emergencyContacts: JSON.stringify([
        { title: 'Security Gate Main', phone: '+91 98765 43210' },
        { title: 'Maintenance Office', phone: '+91 98765 43211' },
        { title: 'Fire Station', phone: '101' },
        { title: 'Ambulance', phone: '102' },
      ]),
    },
  });

  // 4. Create Settings
  await prisma.settings.create({
    data: {
      apartmentId: apartment.id,
      workingHours: '06:00 - 23:00',
      visitorTimeLimit: 180, // 3 hours
      approvalRules: 'REQUIRE_ALL',
      qrExpiry: 1440, // 24 hours
      notificationSettings: 'EMAIL_PUSH',
      theme: 'DARK',
      language: 'en',
    },
  });

  // 5. Create Blocks
  const blockA = await prisma.block.create({
    data: { name: 'Block A', apartmentId: apartment.id },
  });
  const blockB = await prisma.block.create({
    data: { name: 'Block B', apartmentId: apartment.id },
  });

  // 6. Create Floors
  const floor1 = await prisma.floor.create({ data: { number: 1 } });
  const floor2 = await prisma.floor.create({ data: { number: 2 } });
  const floor3 = await prisma.floor.create({ data: { number: 3 } });

  // 7. Create Flats
  const flatA101 = await prisma.flat.create({
    data: { number: '101', blockId: blockA.id, floorId: floor1.id, apartmentId: apartment.id },
  });
  const flatA102 = await prisma.flat.create({
    data: { number: '102', blockId: blockA.id, floorId: floor1.id, apartmentId: apartment.id },
  });
  const flatA201 = await prisma.flat.create({
    data: { number: '201', blockId: blockA.id, floorId: floor2.id, apartmentId: apartment.id },
  });
  const flatB101 = await prisma.flat.create({
    data: { number: '101', blockId: blockB.id, floorId: floor1.id, apartmentId: apartment.id },
  });

  console.log('Created Blocks, Floors, and Flats.');

  // 8. Associate Resident profile
  const resident = await prisma.resident.create({
    data: {
      userId: residentUser.id,
      flatId: flatA101.id,
      isOwner: true,
      phone: '+91 98989 89898',
      email: 'resident@visitor.com',
      vehicleDetails: JSON.stringify([
        { plate: 'KA-51-MD-9999', type: 'Car', make: 'Tesla Model 3' },
        { plate: 'KA-51-EX-1234', type: 'Bike', make: 'Royal Enfield' },
      ]),
      emergencyContact: JSON.stringify({
        name: 'Sushma Kumar',
        relationship: 'Spouse',
        phone: '+91 98989 89899',
      }),
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      familyMembers: JSON.stringify([
        { name: 'Sushma Kumar', age: 32, relation: 'Spouse' },
        { name: 'Karan Kumar', age: 8, relation: 'Son' },
      ]),
      status: 'ACTIVE',
    },
  });

  // Create another resident for flat A-102
  const residentUser2 = await prisma.user.create({
    data: {
      name: 'Aditya Sen',
      email: 'aditya@visitor.com',
      password: passwordHash,
      role: 'RESIDENT',
    },
  });
  const resident2 = await prisma.resident.create({
    data: {
      userId: residentUser2.id,
      flatId: flatA102.id,
      isOwner: false,
      phone: '+91 99999 88888',
      email: 'aditya@visitor.com',
      vehicleDetails: JSON.stringify([{ plate: 'KA-03-HA-5678', type: 'Car', make: 'Hyundai i20' }]),
      status: 'ACTIVE',
    },
  });

  // 9. Associate Guard profile
  const guard = await prisma.securityGuard.create({
    data: {
      userId: guardUser.id,
      apartmentId: apartment.id,
      shift: 'DAY',
      assignedGate: 'Main Gate 1',
      phone: '+91 88888 77777',
      idCard: 'SG-2026-004',
      photoUrl: 'https://images.unsplash.com/photo-1600486913747-55e5470d6f40?w=150&h=150&fit=crop',
      performance: 4.8,
    },
  });

  console.log('Created Resident and Guard profiles.');

  // 10. Sample Visitors and Logs
  const visitors = [
    { name: 'Amit Sharma', phone: '+91 91111 22222', email: 'amit@gmail.com', address: 'Koramangala, Bangalore' },
    { name: 'Swati Patel', phone: '+91 92222 33333', email: 'swati@gmail.com', address: 'Indiranagar, Bangalore' },
    { name: 'John Doe (DHL Delivery)', phone: '+91 93333 44444', email: 'john@dhl.com', address: 'Whitefield, Bangalore' },
    { name: 'Ravi Verma (Plumber)', phone: '+91 94444 55555', email: 'ravi@repair.com', address: 'BTM Layout, Bangalore' },
  ];

  const createdVisitors = [];
  for (const v of visitors) {
    const created = await prisma.visitor.create({
      data: v,
    });
    createdVisitors.push(created);
  }

  // Active Visitor inside (Check-in but no Check-out)
  const logInside = await prisma.visitorLog.create({
    data: {
      visitorId: createdVisitors[0].id,
      flatId: flatA101.id,
      residentId: resident.id,
      purpose: 'GUEST',
      vehicleNumber: 'KA-01-AB-1234',
      visitorType: 'Guest',
      actualArrival: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      status: 'INSIDE',
      gateEntry: 'Main Gate 1',
      notes: 'Friend visiting for dinner.',
    },
  });

  // Completed Visitor Log
  await prisma.visitorLog.create({
    data: {
      visitorId: createdVisitors[1].id,
      flatId: flatA102.id,
      residentId: resident2.id,
      purpose: 'VENDOR',
      visitorType: 'Vendor',
      actualArrival: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      actualExit: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      status: 'EXITED',
      gateEntry: 'Main Gate 1',
      gateExit: 'Main Gate 1',
      notes: 'Delivered customized furniture.',
    },
  });

  // Pending Resident Approval Visitor Request
  const logPending = await prisma.visitorLog.create({
    data: {
      visitorId: createdVisitors[2].id,
      flatId: flatA101.id,
      residentId: resident.id,
      purpose: 'COURIER',
      visitorType: 'Courier',
      expectedArrival: new Date(),
      status: 'PENDING',
      gateEntry: 'Main Gate 1',
      notes: 'DHL Package delivery.',
    },
  });

  await prisma.visitorApproval.create({
    data: {
      logId: logPending.id,
      residentId: resident.id,
      status: 'PENDING',
      notes: 'Please verify package from DHL',
    },
  });

  // Rejected request
  const logRejected = await prisma.visitorLog.create({
    data: {
      visitorId: createdVisitors[3].id,
      flatId: flatA101.id,
      residentId: resident.id,
      purpose: 'MAINTENANCE',
      visitorType: 'Maintenance',
      expectedArrival: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'REJECTED',
      notes: 'Plumbing repair. Not requested.',
    },
  });

  await prisma.visitorApproval.create({
    data: {
      logId: logRejected.id,
      residentId: resident.id,
      status: 'REJECTED',
      notes: 'No plumbing issues, rejected entry',
    },
  });

  // 11. Pre-booked Pass / Invitation QR Pass
  const qrPass = await prisma.visitorPass.create({
    data: {
      code: 'INV-88371',
      visitorName: 'Rohan Deshmukh',
      visitorPhone: '+91 95555 66666',
      visitorType: 'Guest',
      flatId: flatA101.id,
      residentId: resident.id,
      expiryTime: new Date(Date.now() + 12 * 60 * 60 * 1000), // Expiries in 12 hours
      isOneTime: true,
      isUsed: false,
    },
  });

  console.log('Created Visitor Logs and QR Passes.');

  // 12. Announcements
  await prisma.announcement.create({
    data: {
      apartmentId: apartment.id,
      title: 'Water Supply Maintenance Notice',
      content: 'Please note there will be a temporary water supply disruption tomorrow (Tuesday) between 10:00 AM and 01:00 PM for overhead tank cleaning.',
      type: 'MAINTENANCE',
    },
  });

  await prisma.announcement.create({
    data: {
      apartmentId: apartment.id,
      title: 'Independence Day Celebration',
      content: 'Join us for flag hoisting and celebrations on 15th August at 08:30 AM in the central park, followed by high tea.',
      type: 'FESTIVAL',
    },
  });

  // 13. System Notifications
  await prisma.notification.create({
    data: {
      title: 'New Visitor Request',
      message: 'Amit Sharma is at Gate 1 requesting entry to Flat 101-A.',
      type: 'PUSH',
      userId: residentUser.id,
    },
  });

  await prisma.notification.create({
    data: {
      title: 'Emergency Alert Triggered',
      message: 'Emergency Panic Alarm was triggered in Block A, Flat 101.',
      type: 'PUSH',
      userId: adminUser.id,
    },
  });

  // 14. Activity Log
  await prisma.activityLog.create({
    data: {
      userId: superAdminUser.id,
      action: 'SYSTEM_SETUP',
      details: 'Initial system seed and setup executed successfully.',
      ipAddress: '127.0.0.1',
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: guardUser.id,
      action: 'CHECK_IN',
      details: 'Registered and checked in visitor Amit Sharma.',
      ipAddress: '192.168.1.50',
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
