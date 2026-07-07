import { Router, Response } from 'express';
import { VisitorLog, Resident, Flat, SecurityGuard, ActivityLog, VisitorPass } from '../models';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { role, id: userId } = req.user;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    if (role === 'SUPER_ADMIN' || role === 'APARTMENT_ADMIN') {
      // 1. Admin dashboard
      const todayVisitors = await VisitorLog.countDocuments({
        createdAt: { $gte: todayStart, $lte: todayEnd },
      });

      const inside = await VisitorLog.countDocuments({ status: 'INSIDE' });
      const pending = await VisitorLog.countDocuments({ status: 'PENDING' });
      const rejected = await VisitorLog.countDocuments({
        status: 'REJECTED',
        createdAt: { $gte: todayStart, $lte: todayEnd },
      });

      const residents = await Resident.countDocuments({ status: 'ACTIVE' });
      const flats = await Flat.countDocuments();
      const guards = await SecurityGuard.countDocuments();

      // Recent logs
      const recentLogs = await VisitorLog.find()
        .populate('visitorId')
        .populate({
          path: 'flatId',
          populate: { path: 'blockId' },
        })
        .sort({ createdAt: -1 })
        .limit(6);

      // Recent activities
      const recentActivities = await ActivityLog.find()
        .populate('userId')
        .sort({ createdAt: -1 })
        .limit(6);

      // Chart: Visitor purpose distribution
      const purposeStats = await VisitorLog.aggregate([
        { $group: { _id: '$purpose', count: { $sum: 1 } } }
      ]);
      const purposeChartData = purposeStats.map(p => ({
        name: p._id || 'OTHER',
        value: p.count
      }));

      // Chart: Last 7 days visitor trend
      const visitorTrend = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const start = new Date(d);
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);

        const count = await VisitorLog.countDocuments({
          createdAt: { $gte: start, $lte: end }
        });

        visitorTrend.push({
          day: d.toLocaleDateString('en-US', { weekday: 'short' }),
          visitors: count,
        });
      }

      // Top flats visited
      const flatVisits = await VisitorLog.find()
        .populate({
          path: 'flatId',
          populate: { path: 'blockId' }
        });

      const flatMap: Record<string, number> = {};
      flatVisits.forEach((v: any) => {
        if (v.flatId && v.flatId.blockId) {
          const key = `${v.flatId.blockId.name} - ${v.flatId.number}`;
          flatMap[key] = (flatMap[key] || 0) + 1;
        }
      });

      const topFlatsData = Object.entries(flatMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      return res.json({
        stats: {
          todayVisitors,
          inside,
          pending,
          rejected,
          residents,
          flats,
          guards,
        },
        recentLogs,
        recentActivities,
        purposeChartData,
        visitorTrend,
        topFlatsData,
      });
    }

    if (role === 'RESIDENT') {
      // 2. Resident dashboard
      const resident = await Resident.findOne({ userId })
        .populate({
          path: 'flatId',
          populate: { path: 'blockId' }
        });

      if (!resident) {
        return res.status(404).json({ error: 'Resident profile not set up yet.' });
      }

      const flatId = resident.flatId._id;

      const myTodayVisitors = await VisitorLog.countDocuments({
        flatId,
        createdAt: { $gte: todayStart, $lte: todayEnd },
      });

      const myInsideCount = await VisitorLog.countDocuments({ flatId, status: 'INSIDE' });
      const myPendingCount = await VisitorLog.countDocuments({ flatId, status: 'PENDING' });
      const myTotalHistory = await VisitorLog.countDocuments({ flatId });

      // Upcoming passes
      const preBookedPasses = await VisitorPass.find({
        residentId: resident._id,
        expiryTime: { $gte: new Date() },
        isUsed: false,
      }).sort({ expiryTime: 1 });

      // Recent visitor logs
      const visitorLogs = await VisitorLog.find({ flatId })
        .populate('visitorId')
        .sort({ createdAt: -1 })
        .limit(6);

      const flatInfo = resident.flatId ? `${(resident.flatId as any).blockId.name}, Flat ${(resident.flatId as any).number}` : 'N/A';

      return res.json({
        stats: {
          todayVisitors: myTodayVisitors,
          inside: myInsideCount,
          pending: myPendingCount,
          totalHistory: myTotalHistory,
        },
        flatInfo,
        preBookedPasses,
        visitorLogs,
      });
    }

    if (role === 'SECURITY_GUARD') {
      // 3. Security Guard dashboard
      const guard = await SecurityGuard.findOne({ userId });

      const todayCheckins = await VisitorLog.countDocuments({
        actualArrival: { $gte: todayStart, $lte: todayEnd },
      });

      const todayCheckouts = await VisitorLog.countDocuments({
        actualExit: { $gte: todayStart, $lte: todayEnd },
      });

      const inside = await VisitorLog.countDocuments({ status: 'INSIDE' });

      const todayLogs = await VisitorLog.find({
        createdAt: { $gte: todayStart }
      })
        .populate('visitorId')
        .populate({
          path: 'flatId',
          populate: { path: 'blockId' }
        })
        .sort({ createdAt: -1 });

      return res.json({
        stats: {
          todayCheckins,
          todayCheckouts,
          inside,
        },
        guardInfo: guard ? { gate: guard.assignedGate, shift: guard.shift } : null,
        todayLogs,
      });
    }

    res.status(400).json({ error: 'Unknown role mapping.' });
  } catch (error: any) {
    console.error('Dashboard Stats API error:', error);
    res.status(500).json({ error: error.message || 'Failed to load dashboard metrics.' });
  }
});

export default router;
