import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

/**
 * Higher-order middleware to validate req.body against a Zod schema.
 * Returns clean, generic validation error responses.
 */
export function validateRequest(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error: any) {
      if (error && Array.isArray(error.errors)) {
        const issues = error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return res.status(400).json({
          error: 'Validation failed',
          details: issues
        });
      }
      return res.status(400).json({ error: 'Invalid request data' });
    }
  };
}

// ==================== AUTH VALIDATION SCHEMAS ====================

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address').trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerResidentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email address').trim(),
  passwordHash: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').max(15, 'Phone number cannot exceed 15 characters').trim(),
  blockName: z.string().min(1, 'Block name is required').trim(),
  flatNumber: z.string().min(1, 'Flat number is required').trim(),
  isOwner: z.boolean().default(true),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim().optional(),
  email: z.string().email('Invalid email address').trim().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  phone: z.string().min(10).max(15).trim().optional(),
  vehicleDetails: z.string().nullable().optional(),
  emergencyContact: z.string().nullable().optional(),
});

// ==================== SETTINGS SCHEMA ====================

export const settingsUpdateSchema = z.object({
  workingHours: z.string().optional(),
  visitorTimeLimit: z.number().int().positive().optional(),
  approvalRules: z.enum(['REQUIRE_ALL', 'REQUIRE_ANY', 'AUTO_APPROVE']).optional(),
  qrExpiry: z.number().int().positive().optional(),
  notificationSettings: z.string().optional(),
  theme: z.enum(['LIGHT', 'DARK']).optional(),
  language: z.string().optional(),
  singleSessionPerUser: z.boolean().optional(),
});

// ==================== VISITOR SCHEMA ====================

export const visitorCreateSchema = z.object({
  name: z.string().min(2, 'Visitor name is required').trim(),
  phone: z.string().min(10, 'Valid phone number is required').max(15).trim(),
  email: z.string().email('Invalid email address').trim().nullable().optional(),
  gender: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  idProof: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const visitorCheckInSchema = z.object({
  name: z.string().min(2, 'Visitor name is required').trim(),
  phone: z.string().min(10, 'Valid phone number is required').max(15).trim(),
  email: z.string().email('Invalid email address').trim().nullable().optional(),
  gender: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  purpose: z.string().min(1, 'Purpose of visit is required').trim(),
  vehicleNumber: z.string().nullable().optional(),
  visitorType: z.string().min(1, 'Visitor type is required').trim(),
  flatId: z.string().min(1, 'Flat selection is required').trim(),
  notes: z.string().nullable().optional(),
  isEmergency: z.boolean().optional(),
});
