import { Router, Response } from 'express';
import { Visitor, VisitorLog, VisitorApproval, VisitorPass, Flat, Resident, User, Notification, ActivityLog } from '../models';
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

// 1. Guard check-in action
router.post('/checkin', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const {
      name,
      phone,
      email,
      gender,
      address,
      idType,
      idNumber,
      purpose,
      vehicleNumber,
      flatId,
      visitorType,
      notes,
      photoUrl
    } = req.body;

    // Look up or create visitor
    let visitor = await Visitor.findOne({ phone });
    if (visitor) {
      if (visitor.isBlacklisted) {
        return res.status(400).json({ error: 'Security Warning: This visitor is currently BLACKLISTED. Entry is denied.' });
      }

      // Update fields if provided
      visitor.name = name;
      if (email) visitor.email = email;
      if (address) visitor.address = address;
      if (photoUrl) visitor.photoUrl = photoUrl;
      await visitor.save();
    } else {
      visitor = await Visitor.create({
        name,
        phone,
        email: email || null,
        gender: gender || null,
        address: address || null,
        photoUrl: photoUrl || null,
        idProof: JSON.stringify({ type: idType, number: idNumber }),
      });
    }

    // Find flat details to get resident user IDs
    const flat = await Flat.findById(flatId).populate({
      path: 'blockId',
    });

    if (!flat) {
      return res.status(404).json({ error: 'Invalid Flat specified.' });
    }

    // Find active residents for this flat
    const residents = await Resident.find({ flatId, status: 'ACTIVE' }).populate('userId');

    const isDelivery = ['DELIVERY', 'COURIER', 'FOOD', 'CAB'].includes(purpose);
    const initialStatus = isDelivery ? 'INSIDE' : 'PENDING';

    const log = await VisitorLog.create({
      visitorId: visitor._id,
      flatId,
      purpose,
      visitorType,
      vehicleNumber: vehicleNumber || null,
      actualArrival: initialStatus === 'INSIDE' ? new Date() : null,
      status: initialStatus,
      notes: notes || null,
      gateEntry: 'Main Gate 1',
    });

    await logActivity(
      req.user.id,
      'VISITOR_REGISTER',
      `Registered visitor ${name} (${visitorType}) heading to Flat ${(flat.blockId as any).name}-${flat.number}. Initial status: ${initialStatus}.`
    );

    if (initialStatus === 'PENDING') {
      const primaryResident = residents[0];

      if (primaryResident) {
        // Create Resident Approval request
        await VisitorApproval.create({
          logId: log._id,
          residentId: primaryResident._id,
          status: 'PENDING',
          notes: `Visitor ${name} (${visitorType}) is requesting entry. Purpose: ${purpose}`,
        });

        // Dispatch App Push Notification
        await Notification.create({
          userId: primaryResident.userId._id,
          title: '🔑 Visitor Entry Request',
          message: `${name} is at Gate 1 requesting entry to your Flat ${flat.number}.`,
          type: 'PUSH',
        });

        // Mock SMS/Email notifications
        await Notification.create({
          userId: primaryResident.userId._id,
          title: 'Visitor Approval Needed',
          message: `Visitor ${name} is at Greenwood Heights gate. Approve/Reject: http://localhost:3000/dashboard/approvals`,
          type: 'SMS',
        });

        return res.json({
          success: true,
          message: `Entry request submitted. Awaiting resident approval for Flat ${(flat.blockId as any).name}-${flat.number}.`,
          logId: log._id,
          status: 'PENDING',
        });
      } else {
        // Fallback: If no resident mapped, check in automatically
        log.status = 'INSIDE';
        log.actualArrival = new Date();
        await log.save();

        return res.json({
          success: true,
          message: 'No active resident registered for this Flat. Visitor auto-approved by Guard override.',
          logId: log._id,
          status: 'INSIDE',
        });
      }
    }

    res.json({
      success: true,
      message: 'Visitor checked in successfully. Status: Inside.',
      logId: log._id,
      status: 'INSIDE',
    });
  } catch (error: any) {
    console.error('Check-in API error:', error);
    res.status(500).json({ error: error.message || 'Failed to register check-in request.' });
  }
});

// 2. Guard Check-out action
router.post('/checkout/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const logId = req.params.id;
    const log = await VisitorLog.findById(logId).populate('visitorId').populate('flatId');

    if (!log) {
      return res.status(404).json({ error: 'Visitor log entry not found.' });
    }

    if (log.status === 'EXITED') {
      return res.status(400).json({ error: 'Visitor is already checked out.' });
    }

    log.status = 'EXITED';
    log.actualExit = new Date();
    log.gateExit = 'Main Gate 1';
    await log.save();

    await logActivity(
      req.user.id,
      'CHECK_OUT',
      `Checked out visitor ${(log.visitorId as any).name} from Flat ${(log.flatId as any).number}.`
    );

    res.json({ success: true, message: `Visitor ${(log.visitorId as any).name} successfully checked out.` });
  } catch (error: any) {
    console.error('Check-out API error:', error);
    res.status(500).json({ error: error.message || 'Failed to complete check-out.' });
  }
});

// 3. Update Blacklist action
router.put('/:id/blacklist', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !['SUPER_ADMIN', 'APARTMENT_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges.' });
    }

    const visitorId = req.params.id;
    const { isBlacklisted, notes } = req.body;

    const visitor = await Visitor.findByIdAndUpdate(
      visitorId,
      { isBlacklisted, notes: notes || null },
      { new: true }
    );

    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    await logActivity(
      req.user.id,
      isBlacklisted ? 'BLACKLIST' : 'UNBLACKLIST',
      `${isBlacklisted ? 'Blacklisted' : 'Removed from Blacklist'} visitor ${visitor.name}. Reason: ${notes || 'None'}.`
    );

    res.json({ success: true, message: `Visitor ${visitor.name} blacklist status updated.` });
  } catch (error: any) {
    console.error('Blacklist toggle API error:', error);
    res.status(500).json({ error: error.message || 'Failed to update blacklist status.' });
  }
});

// 4. Get Visitor Logs
router.get('/logs', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    let filter: any = {};

    if (req.user.role === 'RESIDENT') {
      const resident = await Resident.findOne({ userId: req.user.id });
      if (!resident) {
        return res.json([]);
      }
      filter.flatId = resident.flatId;
    }

    const logs = await VisitorLog.find(filter)
      .populate('visitorId')
      .populate({
        path: 'flatId',
        populate: { path: 'blockId' },
      })
      .populate('residentId')
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (error: any) {
    console.error('Get logs API error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch logs.' });
  }
});

// 5. Create Pre-booked Pass
router.post('/passes', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { visitorName, visitorPhone, visitorType, expiryHours, isOneTime } = req.body;

    const resident = await Resident.findOne({ userId: req.user.id });
    if (!resident) {
      return res.status(400).json({ error: 'Only residents can pre-book passes.' });
    }

    // Generate unique short code
    const code = 'INV-' + Math.floor(10000 + Math.random() * 90000);

    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + (parseInt(expiryHours) || 24));

    const pass = await VisitorPass.create({
      code,
      visitorName,
      visitorPhone,
      visitorType: visitorType || 'Guest',
      flatId: resident.flatId,
      residentId: resident._id,
      expiryTime,
      isOneTime: isOneTime !== undefined ? isOneTime : true,
      isUsed: false,
    });

    await logActivity(
      req.user.id,
      'PASS_CREATE',
      `Created pre-booked pass ${code} for visitor ${visitorName} (expiring ${expiryTime.toLocaleString()}).`
    );

    const populated = await VisitorPass.findById(pass._id).populate('flatId');
    res.status(201).json(populated);
  } catch (error: any) {
    console.error('Create pass API error:', error);
    res.status(500).json({ error: error.message || 'Failed to create pass.' });
  }
});

// 6. Verify & Check-in QR Pass
router.post('/passes/verify', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { code } = req.body;

    const pass = await VisitorPass.findOne({ code })
      .populate({
        path: 'flatId',
        populate: { path: 'blockId' },
      })
      .populate({
        path: 'residentId',
        populate: { path: 'userId' },
      });

    if (!pass) {
      return res.json({ error: 'Invalid Pass code. Pass not found in system.' });
    }

    if (pass.isUsed && pass.isOneTime) {
      return res.json({ error: 'This pass has already been used.' });
    }

    if (new Date() > pass.expiryTime) {
      return res.json({ error: 'This pass has expired.' });
    }

    // Register visitor if they do not exist
    let visitor = await Visitor.findOne({ phone: pass.visitorPhone });
    if (!visitor) {
      visitor = await Visitor.create({
        name: pass.visitorName,
        phone: pass.visitorPhone,
      });
    } else if (visitor.isBlacklisted) {
      return res.json({ error: 'Security Warning: The visitor associated with this pass is BLACKLISTED.' });
    }

    // Check in the visitor
    const log = await VisitorLog.create({
      visitorId: visitor._id,
      flatId: pass.flatId,
      residentId: pass.residentId._id,
      purpose: 'GUEST',
      visitorType: pass.visitorType,
      actualArrival: new Date(),
      status: 'INSIDE',
      gateEntry: 'Main Gate 1 (Pass Verified)',
      passId: pass._id,
    });

    // Mark pass as used
    pass.isUsed = true;
    await pass.save();

    // Notify Resident
    await Notification.create({
      userId: (pass.residentId as any).userId._id,
      title: '✅ Visitor Checked In',
      message: `Your pre-booked visitor ${pass.visitorName} has entered Gate 1 using Pass code ${code}.`,
      type: 'PUSH',
    });

    await logActivity(
      req.user.id,
      'PASS_VERIFY_CHECKIN',
      `Checked in visitor ${pass.visitorName} using pass ${code} heading to Flat ${(pass.flatId as any).number}.`
    );

    res.json({
      success: true,
      message: `Pass verified. Visitor ${pass.visitorName} checked in.`,
      visitor: {
        name: pass.visitorName,
        phone: pass.visitorPhone,
        flat: `${(pass.flatId as any).blockId ? (pass.flatId as any).blockId.name : ''} - ${(pass.flatId as any).number}`,
        residentName: (pass.residentId as any).userId.name,
        logId: log._id,
      }
    });
  } catch (error: any) {
    console.error('Verify pass API error:', error);
    res.status(500).json({ error: error.message || 'Failed to scan and verify pass.' });
  }
});

// 7. Get Pending Approvals
router.get('/approvals/pending', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const resident = await Resident.findOne({ userId: req.user.id });
    if (!resident) {
      return res.json([]);
    }

    const approvals = await VisitorApproval.find({
      residentId: resident._id,
      status: 'PENDING',
    })
      .populate({
        path: 'logId',
        populate: { path: 'visitorId' },
      })
      .populate('residentId');

    res.json(approvals);
  } catch (error: any) {
    console.error('Get approvals API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 8. Resolve Approval
router.post('/approvals/:id/resolve', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const approvalId = req.params.id;
    const { status } = req.body; // APPROVED or REJECTED

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be APPROVED or REJECTED.' });
    }

    const approval = await VisitorApproval.findById(approvalId);
    if (!approval) {
      return res.status(404).json({ error: 'Approval request not found.' });
    }

    approval.status = status;
    await approval.save();

    const log = await VisitorLog.findById(approval.logId).populate('visitorId');
    if (log) {
      log.status = status === 'APPROVED' ? 'INSIDE' : 'REJECTED';
      if (status === 'APPROVED') {
        log.actualArrival = new Date();
      }
      await log.save();

      await logActivity(
        req.user.id,
        status === 'APPROVED' ? 'VISITOR_APPROVED' : 'VISITOR_REJECTED',
        `Resident resolved request for ${(log.visitorId as any).name}: ${status}.`
      );
    }

    res.json({ success: true, message: `Visitor request has been ${status.toLowerCase()} successfully.` });
  } catch (error: any) {
    console.error('Resolve approval API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 9. Get Flats list metadata for check-in dropdowns
router.get('/metadata', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const flats = await Flat.find()
      .populate('blockId')
      .populate('floorId')
      .sort({ number: 1 });
    res.json({ flats });
  } catch (error: any) {
    console.error('Get metadata API error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
