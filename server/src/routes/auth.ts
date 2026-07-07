import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, Resident, SecurityGuard, Flat, Block, Floor, Apartment, ActivityLog } from '../models';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-2026-visitor-app-secret';

// Helper to log activity
async function logActivity(userId: string | null, action: string, details: string, ipAddress?: string) {
  try {
    await ActivityLog.create({ userId, action, details, ipAddress });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

// 1. Register Resident
router.post('/register', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, passwordHash, phone, blockName, flatNumber, isOwner } = req.body;
    const emailLower = email.toLowerCase();

    // Check if user exists
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email address already exists.' });
    }

    // Find apartment
    const apartment = await Apartment.findOne();
    if (!apartment) {
      return res.status(400).json({ error: 'Apartment system not configured. Seeding is required.' });
    }

    // Find or create block
    let block = await Block.findOne({ name: blockName, apartmentId: apartment._id });
    if (!block) {
      block = await Block.create({ name: blockName, apartmentId: apartment._id });
    }

    // Parse floor
    const floorNum = parseInt(flatNumber.charAt(0)) || 1;
    let floor = await Floor.findOne({ number: floorNum });
    if (!floor) {
      floor = await Floor.create({ number: floorNum });
    }

    // Find or create flat
    let flat = await Flat.findOne({ number: flatNumber, blockId: block._id, floorId: floor._id });
    if (!flat) {
      flat = await Flat.create({
        number: flatNumber,
        blockId: block._id,
        floorId: floor._id,
        apartmentId: apartment._id,
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(passwordHash, 10);

    // Create User
    const user = await User.create({
      name,
      email: emailLower,
      password: hashedPassword,
      role: 'RESIDENT',
    });

    // Create Resident profile
    await Resident.create({
      userId: user._id,
      flatId: flat._id,
      phone,
      email: emailLower,
      isOwner,
      status: 'ACTIVE',
      moveInDate: new Date(),
    });

    await logActivity(user.id, 'RESIDENT_SIGNUP', `New resident signed up: ${name} in Flat ${blockName}-${flatNumber}.`);

    res.status(201).json({ success: true, message: 'Registration successful!', userId: user.id });
  } catch (error: any) {
    console.error('Registration API error:', error);
    res.status(500).json({ error: error.message || 'An error occurred during registration.' });
  }
});

// 2. Login
router.post('/login', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter your email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'No user found with this email' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    await logActivity(user.id, 'LOGIN', `User ${user.name} logged in successfully.`);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Login API error:', error);
    res.status(500).json({ error: error.message || 'An error occurred during login.' });
  }
});

// 3. Get Profile
router.get('/profile', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'RESIDENT') {
      const resident = await Resident.findOne({ userId: user._id }).populate({
        path: 'flatId',
        populate: [{ path: 'blockId' }, { path: 'floorId' }],
      });
      return res.json({ user, resident });
    }

    if (user.role === 'SECURITY_GUARD') {
      const guard = await SecurityGuard.findOne({ userId: user._id }).populate('apartmentId');
      return res.json({ user, guard });
    }

    res.json({ user });
  } catch (error: any) {
    console.error('Get profile API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Update Profile
router.put('/profile', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { name, email, password, phone, vehicleDetails, emergencyContact } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update User core fields
    user.name = name || user.name;
    user.email = email ? email.toLowerCase() : user.email;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }
    await user.save();

    // Update role specific profile fields
    if (user.role === 'RESIDENT') {
      const resident = await Resident.findOne({ userId: user._id });
      if (resident) {
        resident.phone = phone || resident.phone;
        resident.email = email ? email.toLowerCase() : resident.email;
        if (vehicleDetails !== undefined) resident.vehicleDetails = vehicleDetails;
        if (emergencyContact !== undefined) resident.emergencyContact = emergencyContact;
        await resident.save();
      }
    } else if (user.role === 'SECURITY_GUARD') {
      const guard = await SecurityGuard.findOne({ userId: user._id });
      if (guard) {
        guard.phone = phone || guard.phone;
        await guard.save();
      }
    }

    await logActivity(user.id, 'PROFILE_UPDATE', `Updated profile fields.`);

    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (error: any) {
    console.error('Update profile API error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
