import { Router, Response } from 'express';
import { EmergencyAlert, Apartment, User, Notification, ActivityLog } from '../models';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Helper to log activity
async function logActivity(userId: string | null, action: string, details: string) {
  try {
    await ActivityLog.create({ userId, action, details });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

router.use(authenticateJWT);

// 1. Get active emergency alerts
router.get('/active', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const alerts = await EmergencyAlert.find({ status: 'ACTIVE' })
      .populate('triggeredById', 'name email role')
      .populate('apartmentId')
      .sort({ createdAt: -1 });
    res.json(alerts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Trigger panic alert
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { type, notes } = req.body;

    const apartment = await Apartment.findOne();
    if (!apartment) {
      return res.status(400).json({ error: 'Apartment system not configured.' });
    }

    const alert = await EmergencyAlert.create({
      apartmentId: apartment._id,
      triggeredById: req.user.id,
      type: type || 'PANIC',
      status: 'ACTIVE',
      notes: notes || null,
    });

    // Create notifications for all admins and guards
    const staffUsers = await User.find({ role: { $in: ['SUPER_ADMIN', 'APARTMENT_ADMIN', 'SECURITY_GUARD'] } });
    
    for (const staff of staffUsers) {
      await Notification.create({
        userId: staff._id,
        title: '🚨 EMERGENCY ALERT TRIGGERED',
        message: `A panic alert [${type}] was triggered by ${req.user.name}. Status is Active. Check the Emergency console.`,
        type: 'PUSH',
      });
    }

    await logActivity(req.user.id, 'EMERGENCY_TRIGGER', `Triggered ${type} emergency alert. Notes: ${notes || 'None'}`);

    res.status(201).json(alert);
  } catch (error: any) {
    console.error('Trigger emergency alert API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Resolve emergency alert
router.post('/resolve/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const alertId = req.params.id;
    const { notes } = req.body;

    const alert = await EmergencyAlert.findById(alertId).populate('triggeredById');
    if (!alert) {
      return res.status(404).json({ error: 'Emergency alert not found.' });
    }

    alert.status = 'RESOLVED';
    alert.notes = notes || alert.notes;
    await alert.save();

    await logActivity(req.user.id, 'EMERGENCY_RESOLVE', `Resolved emergency alert triggered by ${(alert.triggeredById as any).name}. Resolution: ${notes || 'None'}`);

    res.json(alert);
  } catch (error: any) {
    console.error('Resolve emergency alert API error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
