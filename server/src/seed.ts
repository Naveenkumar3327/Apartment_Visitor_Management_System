import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { User, Apartment, Settings, Block, Floor, Flat, Resident, SecurityGuard, ActivityLog } from './models';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/apartment-visitor-log';

async function seed() {
  try {
    console.log('Connecting to MongoDB for seeding...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    // 1. Clear existing database
    console.log('Cleaning database collections...');
    await User.deleteMany({});
    await Apartment.deleteMany({});
    await Settings.deleteMany({});
    await Block.deleteMany({});
    await Floor.deleteMany({});
    await Flat.deleteMany({});
    await Resident.deleteMany({});
    await SecurityGuard.deleteMany({});
    await ActivityLog.deleteMany({});
    console.log('Collections cleared.');

    // 2. Hash Password
    const passwordHash = await bcrypt.hash('password123', 10);

    // 3. Create Users
    console.log('Creating users...');
    const superAdmin = await User.create({
      name: 'Super Administrator',
      email: 'superadmin@visitor.com',
      password: passwordHash,
      role: 'SUPER_ADMIN',
    });

    const adminUser = await User.create({
      name: 'Apartment Manager',
      email: 'admin@visitor.com',
      password: passwordHash,
      role: 'APARTMENT_ADMIN',
    });

    const guardUser = await User.create({
      name: 'Officer Rajesh Kumar',
      email: 'guard@visitor.com',
      password: passwordHash,
      role: 'SECURITY_GUARD',
    });

    const residentUser1 = await User.create({
      name: 'Naveen Kumar',
      email: 'resident@visitor.com',
      password: passwordHash,
      role: 'RESIDENT',
    });

    const residentUser2 = await User.create({
      name: 'Aditya Sen',
      email: 'aditya@visitor.com',
      password: passwordHash,
      role: 'RESIDENT',
    });
    console.log('Users created.');

    // 4. Create Apartment Config
    console.log('Creating apartment configuration...');
    const apartment = await Apartment.create({
      name: 'Greenwood Heights',
      address: 'Plot 45, Sector 4, HSR Layout, Bengaluru, Karnataka - 560102',
      blocksCount: 2,
      floorsCount: 3,
      flatsCount: 4,
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
    });

    // 5. Create settings
    await Settings.create({
      apartmentId: apartment._id,
      workingHours: '06:00 - 23:00',
      visitorTimeLimit: 180, // 3 hours
      approvalRules: 'REQUIRE_ALL',
      qrExpiry: 1440, // 24 hours
      notificationSettings: 'EMAIL_PUSH',
      theme: 'DARK',
      language: 'en',
    });
    console.log('Apartment configuration set.');

    // 6. Create Blocks, Floors, and Flats
    console.log('Creating blocks, floors, and flats...');
    const blockA = await Block.create({ name: 'Block A', apartmentId: apartment._id });
    const blockB = await Block.create({ name: 'Block B', apartmentId: apartment._id });

    const floor1 = await Floor.create({ number: 1 });
    const floor2 = await Floor.create({ number: 2 });

    const flatA101 = await Flat.create({
      number: '101',
      blockId: blockA._id,
      floorId: floor1._id,
      apartmentId: apartment._id,
    });

    const flatA102 = await Flat.create({
      number: '102',
      blockId: blockA._id,
      floorId: floor1._id,
      apartmentId: apartment._id,
    });

    const flatA201 = await Flat.create({
      number: '201',
      blockId: blockA._id,
      floorId: floor2._id,
      apartmentId: apartment._id,
    });

    const flatB101 = await Flat.create({
      number: '101',
      blockId: blockB._id,
      floorId: floor1._id,
      apartmentId: apartment._id,
    });
    console.log('Blocks, floors, and flats created.');

    // 7. Create Profiles
    console.log('Creating Resident and Guard profiles...');
    await Resident.create({
      userId: residentUser1._id,
      flatId: flatA101._id,
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
    });

    await Resident.create({
      userId: residentUser2._id,
      flatId: flatA102._id,
      isOwner: false,
      phone: '+91 99999 88888',
      email: 'aditya@visitor.com',
      vehicleDetails: JSON.stringify([{ plate: 'KA-03-HA-5678', type: 'Car', make: 'Hyundai i20' }]),
      status: 'ACTIVE',
    });

    await SecurityGuard.create({
      userId: guardUser._id,
      apartmentId: apartment._id,
      shift: 'DAY',
      assignedGate: 'Main Gate 1',
      phone: '+91 88888 77777',
      idCard: 'SG-2026-004',
      photoUrl: 'https://images.unsplash.com/photo-1600486913747-55e5470d6f40?w=150&h=150&fit=crop',
      performance: 4.8,
    });
    console.log('Profiles created.');

    // 8. Create initial system Activity Log
    await ActivityLog.create({
      userId: superAdmin._id,
      action: 'SYSTEM_SETUP',
      details: 'MongoDB database initialized with Greenwood Heights and default roles.',
    });

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seed();
