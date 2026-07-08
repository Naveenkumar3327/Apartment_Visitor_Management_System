import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, Resident, SecurityGuard, Flat, Block, Floor, Apartment, ActivityLog, RefreshToken, Settings } from '../models';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';
import { validateRequest, loginSchema, registerResidentSchema, profileUpdateSchema } from '../middleware/validation';
import { auditLogger } from '../middleware/audit';

const router = Router();
router.use(auditLogger('Authentication'));
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
router.post('/register', validateRequest(registerResidentSchema), async (req: AuthenticatedRequest, res: Response) => {
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
router.post('/login', validateRequest(loginSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter your email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      await logActivity(null, 'LOGIN_FAILURE', `Failed login attempt for email: ${email}`, req.ip);
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      await logActivity(user.id, 'LOGIN_FAILURE', `Failed login attempt (incorrect password) for user: ${user.name}`, req.ip);
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    // Generate Short-lived Access Token (15 minutes)
    const accessToken = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Generate Refresh Token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Retrieve Settings to check Single Active Session
    const settings = await Settings.findOne();
    if (settings?.singleSessionPerUser) {
      // Revoke all previous active sessions
      await RefreshToken.updateMany({ userId: user._id, isRevoked: false }, { isRevoked: true });
      await logActivity(user.id, 'CONCURRENT_SESSION_REVOKED', `Previous sessions revoked due to new login.`, req.ip);
    }

    // Save Refresh Token to DB
    await RefreshToken.create({
      userId: user._id,
      token: refreshToken,
      expiresAt,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || 'Unknown',
      isRevoked: false,
    });

    await logActivity(user.id, 'LOGIN_SUCCESS', `User ${user.name} logged in successfully.`, req.ip);

    res.json({
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Login API error:', error);
    res.status(500).json({ error: 'An error occurred during login.' });
  }
});

// Refresh Token Rotation Endpoint
router.post('/refresh', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Find token in database
    const dbToken = await RefreshToken.findOne({ token: refreshToken });
    if (!dbToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Check if token is revoked (Reuse Detection / Session Hijacking Prevention)
    if (dbToken.isRevoked) {
      // Revoke all tokens for this user as a safety measure
      await RefreshToken.updateMany({ userId: dbToken.userId }, { isRevoked: true });
      await logActivity(
        dbToken.userId.toString(),
        'TOKEN_REUSE_DETECTED',
        `Warning: Revoked refresh token reused! All sessions revoked.`,
        req.ip
      );
      return res.status(401).json({ error: 'Token reuse detected. Session terminated.' });
    }

    // Check expiry
    if (new Date() > dbToken.expiresAt) {
      return res.status(401).json({ error: 'Refresh token has expired' });
    }

    // Mark current refresh token as revoked
    dbToken.isRevoked = true;
    await dbToken.save();

    // Fetch user details
    const user = await User.findById(dbToken.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Generate new refresh token
    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    // Save new refresh token to DB
    await RefreshToken.create({
      userId: user._id,
      token: newRefreshToken,
      expiresAt: newExpiresAt,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || 'Unknown',
      isRevoked: false,
    });

    res.json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error: any) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'An error occurred during token refresh.' });
  }
});

// Logout Endpoint
router.post('/logout', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const dbToken = await RefreshToken.findOne({ token: refreshToken });
      if (dbToken) {
        dbToken.isRevoked = true;
        await dbToken.save();
        await logActivity(dbToken.userId.toString(), 'LOGOUT', `User logged out successfully.`, req.ip);
      }
    }
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'An error occurred during logout.' });
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
router.put('/profile', authenticateJWT, validateRequest(profileUpdateSchema), async (req: AuthenticatedRequest, res: Response) => {
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
