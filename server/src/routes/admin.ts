import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { SecurityGuard, User, Resident, Apartment, Settings, ActivityLog, Flat, Block, VisitorLog } from '../models';
import { authenticateJWT, AuthenticatedRequest, requireRoles } from '../middleware/auth';
import { validateRequest, settingsUpdateSchema } from '../middleware/validation';
import { auditLogger } from '../middleware/audit';
import { runEncryptedBackup } from '../utils/backup';

const router = Router();

// Helper to log activity manually (retained for custom log events in handlers)
async function logActivity(userId: string | null, action: string, details: string) {
  try {
    let username = 'system';
    let fullName = 'System';
    let role = 'SYSTEM';
    let email = '';
    
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        username = user.email.split('@')[0];
        fullName = user.name;
        role = user.role;
        email = user.email;
      }
    }
    
    await ActivityLog.create({
      userId,
      username,
      fullName,
      role,
      email,
      action,
      details,
      status: 'SUCCESS',
      lastActivityTime: new Date()
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

// Ensure only admins can access these endpoints
router.use(authenticateJWT);
router.use(requireRoles(['SUPER_ADMIN', 'APARTMENT_ADMIN']));
router.use(auditLogger('Administration'));

// ==================== GUARD MANAGEMENT ====================

// 1. Get Guards List
router.get('/guards', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const guards = await SecurityGuard.find().populate('userId');
    res.json(guards);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Create Guard
router.post('/guards', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, phone, shift, assignedGate, idCard } = req.body;
    const emailLower = email.toLowerCase();

    // Check existing User
    const existing = await User.findOne({ email: emailLower });
    if (existing) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    const apartment = await Apartment.findOne();
    if (!apartment) {
      return res.status(400).json({ error: 'Apartment is not configured yet.' });
    }

    // Default password for guards is 'guard123' if not provided
    const passwordHash = await bcrypt.hash(req.body.password || 'guard123', 10);

    const user = await User.create({
      name,
      email: emailLower,
      password: passwordHash,
      role: 'SECURITY_GUARD',
    });

    const guard = await SecurityGuard.create({
      userId: user._id,
      apartmentId: apartment._id,
      shift: shift || 'DAY',
      assignedGate: assignedGate || 'Gate 1',
      phone,
      idCard: idCard || null,
      photoUrl: 'https://images.unsplash.com/photo-1600486913747-55e5470d6f40?w=150&h=150&fit=crop',
      performance: 5.0,
    });

    await logActivity(req.user!.id, 'CREATE_GUARD', `Created Security Guard ${name} assigned to ${assignedGate}.`);

    res.status(201).json(guard);
  } catch (error: any) {
    console.error('Create guard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Delete Guard
router.delete('/guards/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const guardId = req.params.id;
    const guard = await SecurityGuard.findById(guardId);
    if (!guard) {
      return res.status(404).json({ error: 'Guard profile not found' });
    }

    await SecurityGuard.findByIdAndDelete(guardId);
    await User.findByIdAndDelete(guard.userId);

    await logActivity(req.user!.id, 'REMOVE_GUARD', `Removed Security Guard profile and login.`);

    res.json({ success: true, message: 'Guard removed successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RESIDENT RUSTER ====================

// 1. Get Residents List
router.get('/residents', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const residents = await Resident.find()
      .populate('userId')
      .populate({
        path: 'flatId',
        populate: { path: 'blockId' },
      });
    res.json(residents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Toggle Resident Status
router.put('/residents/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const residentId = req.params.id;
    const { status } = req.body; // ACTIVE or INACTIVE

    const resident = await Resident.findById(residentId);
    if (!resident) {
      return res.status(404).json({ error: 'Resident not found' });
    }

    resident.status = status;
    await resident.save();

    await logActivity(req.user!.id, 'RESIDENT_STATUS', `Toggled resident status to ${status}.`);

    res.json({ success: true, message: `Resident status changed to ${status}.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Delete Resident
router.delete('/residents/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const residentId = req.params.id;
    const resident = await Resident.findById(residentId);
    if (!resident) {
      return res.status(404).json({ error: 'Resident profile not found' });
    }

    await Resident.findByIdAndDelete(residentId);
    await User.findByIdAndDelete(resident.userId);

    await logActivity(req.user!.id, 'REMOVE_RESIDENT', `Removed resident profile and user login.`);

    res.json({ success: true, message: 'Resident removed successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== APARTMENT & SETTINGS ====================

// 1. Get Apartment Config
router.get('/apartment-config', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const apartment = await Apartment.findOne();
    if (!apartment) {
      return res.json(null);
    }

    // Fetch blocks
    const blocks = await Block.find({ apartmentId: apartment._id }).lean();

    // Fetch flats for each block
    const blocksWithFlats = await Promise.all(blocks.map(async (block: any) => {
      const flats = await Flat.find({ blockId: block._id }).lean();
      return {
        ...block,
        id: block._id.toString(),
        flats: flats.map((f: any) => ({
          ...f,
          id: f._id.toString(),
        }))
      };
    }));

    res.json({
      ...apartment.toObject(),
      blocks: blocksWithFlats
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Update Apartment Config
router.put('/apartment-config', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, address, logoUrl, emergencyContacts } = req.body;
    let apartment = await Apartment.findOne();

    if (!apartment) {
      apartment = await Apartment.create({ name, address, logoUrl, emergencyContacts });
    } else {
      apartment.name = name || apartment.name;
      apartment.address = address || apartment.address;
      if (logoUrl !== undefined) apartment.logoUrl = logoUrl;
      if (emergencyContacts !== undefined) apartment.emergencyContacts = emergencyContacts;
      await apartment.save();
    }

    await logActivity(req.user!.id, 'UPDATE_APARTMENT_CONFIG', `Updated apartment config.`);

    res.json(apartment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get Settings
router.get('/settings', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = await Settings.findOne();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Update Settings
router.put('/settings', validateRequest(settingsUpdateSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { workingHours, visitorTimeLimit, approvalRules, qrExpiry, notificationSettings, theme, language, singleSessionPerUser } = req.body;
    let settings = await Settings.findOne();

    if (!settings) {
      const apartment = await Apartment.findOne();
      settings = await Settings.create({
        apartmentId: apartment?._id,
        workingHours,
        visitorTimeLimit,
        approvalRules,
        qrExpiry,
        notificationSettings,
        theme,
        language,
        singleSessionPerUser,
      });
    } else {
      if (workingHours !== undefined) settings.workingHours = workingHours;
      if (visitorTimeLimit !== undefined) settings.visitorTimeLimit = visitorTimeLimit;
      if (approvalRules !== undefined) settings.approvalRules = approvalRules;
      if (qrExpiry !== undefined) settings.qrExpiry = qrExpiry;
      if (notificationSettings !== undefined) settings.notificationSettings = notificationSettings;
      if (theme !== undefined) settings.theme = theme;
      if (language !== undefined) settings.language = language;
      if (singleSessionPerUser !== undefined) settings.singleSessionPerUser = singleSessionPerUser;
      await settings.save();
    }

    await logActivity(req.user!.id, 'UPDATE_SETTINGS', `Updated system settings.`);

    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ACTIVITY & AUDIT LOGS ====================

// Get all Activity Logs (with Advanced Filtering & Pagination)
router.get('/activity-logs', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const filter: any = {};

    // Apply filters
    if (req.query.username) {
      filter.username = { $regex: req.query.username as string, $options: 'i' };
    }
    if (req.query.role && req.query.role !== 'ALL') {
      filter.role = req.query.role;
    }
    if (req.query.deviceType && req.query.deviceType !== 'ALL') {
      filter.deviceType = req.query.deviceType;
    }
    if (req.query.location) {
      filter.location = { $regex: req.query.location as string, $options: 'i' };
    }
    if (req.query.action && req.query.action !== 'ALL') {
      filter.action = req.query.action;
    }
    if (req.query.status && req.query.status !== 'ALL') {
      filter.status = req.query.status;
    }

    // Date range filter
    if (req.query.dateStart || req.query.dateEnd) {
      filter.createdAt = {};
      if (req.query.dateStart) {
        filter.createdAt.$gte = new Date(req.query.dateStart as string);
      }
      if (req.query.dateEnd) {
        const end = new Date(req.query.dateEnd as string);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // Search query (matches action, details, username, email, IP)
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search as string, $options: 'i' };
      filter.$or = [
        { action: searchRegex },
        { details: searchRegex },
        { username: searchRegex },
        { fullName: searchRegex },
        { email: searchRegex },
        { ipAddress: searchRegex }
      ];
    }

    const total = await ActivityLog.countDocuments(filter);
    const logs = await ActivityLog.find(filter)
      .populate('userId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      logs,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error: any) {
    console.error('Fetch activity logs error:', error);
    res.status(500).json({ error: 'An error occurred fetching activity logs.' });
  }
});

// Archive Logs Endpoint (Super Admin only)
router.post('/activity-logs/archive', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Only Super Admins can archive logs.' });
    }

    const { days } = req.body;
    if (!days || typeof days !== 'number' || days < 1) {
      return res.status(400).json({ error: 'Invalid number of days specified.' });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await ActivityLog.deleteMany({ createdAt: { $lt: cutoffDate } });

    await logActivity(
      req.user!.id,
      'ARCHIVE_LOGS',
      `Archived and deleted ${result.deletedCount} audit logs older than ${days} days.`
    );

    res.json({
      success: true,
      message: `Successfully archived audit logs. Deleted ${result.deletedCount} records older than ${days} days.`,
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'An error occurred during log archiving.' });
  }
});

// Trigger Manual Database Backup (Super Admin only)
router.post('/backup', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Only Super Admins can trigger backups.' });
    }

    const filename = await runEncryptedBackup();
    res.json({
      success: true,
      message: 'Encrypted database backup created successfully.',
      filename,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Manual backup failed.' });
  }
});

// ==================== REPORTS ====================

// Get filters metadata for reports
router.get('/reports/metadata', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const blocks = await Block.find().sort({ name: 1 });
    const flats = await Flat.find().populate('blockId').sort({ number: 1 });
    res.json({ blocks, flats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Generate Report Data
router.post('/reports/generate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = req.body;
    const whereClause: any = {};

    // Date range
    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt.$lte = end;
      }
    }

    // Flat filter
    if (filters.flatId && filters.flatId !== 'ALL') {
      whereClause.flatId = filters.flatId;
    }

    // Status filter
    if (filters.status && filters.status !== 'ALL') {
      whereClause.status = filters.status;
    }

    // Visitor Type filter
    if (filters.visitorType && filters.visitorType !== 'ALL') {
      whereClause.visitorType = filters.visitorType;
    }

    // Purpose filter
    if (filters.purpose && filters.purpose !== 'ALL') {
      whereClause.purpose = filters.purpose;
    }

    const data = await VisitorLog.find(whereClause)
      .populate('visitorId')
      .populate({
        path: 'flatId',
        populate: { path: 'blockId' }
      })
      .sort({ createdAt: -1 });

    const formatted = data.map((log: any) => ({
      id: log.id,
      visitorName: log.visitorId.name,
      visitorPhone: log.visitorId.phone,
      visitorType: log.visitorType,
      flat: `${log.flatId.blockId.name} - ${log.flatId.number}`,
      purpose: log.purpose,
      vehicle: log.vehicleNumber || 'N/A',
      arrival: log.actualArrival ? new Date(log.actualArrival).toLocaleString() : 'N/A',
      exit: log.actualExit ? new Date(log.actualExit).toLocaleString() : 'N/A',
      status: log.status,
      date: new Date(log.createdAt).toLocaleDateString(),
    }));

    res.json(formatted);
  } catch (error: any) {
    console.error('Report generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate report details.' });
  }
});

export default router;
