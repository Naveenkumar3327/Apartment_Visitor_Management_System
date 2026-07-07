import { Router, Response } from 'express';
import { Notification, Announcement, Apartment, ActivityLog } from '../models';
import { authenticateJWT, AuthenticatedRequest, requireRoles } from '../middleware/auth';

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

// ==================== NOTIFICATIONS ====================

// 1. Get user notifications
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Mark notification as read
router.put('/:id/read', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notificationId = req.params.id;
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true, notification });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Clear all notifications for user
router.delete('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    await Notification.deleteMany({ userId: req.user.id });
    res.json({ success: true, message: 'All notifications cleared.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ANNOUNCEMENTS ====================

// 1. Get announcements
router.get('/announcements', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Create announcement (Admin only)
router.post('/announcements', requireRoles(['SUPER_ADMIN', 'APARTMENT_ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { title, content, type } = req.body;

    const apartment = await Apartment.findOne();
    if (!apartment) {
      return res.status(400).json({ error: 'Apartment system not configured.' });
    }

    const announcement = await Announcement.create({
      apartmentId: apartment._id,
      title,
      content,
      type: type || 'NOTICE',
    });

    await logActivity(req.user.id, 'CREATE_ANNOUNCEMENT', `Created announcement: ${title}.`);

    res.status(201).json(announcement);
  } catch (error: any) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
