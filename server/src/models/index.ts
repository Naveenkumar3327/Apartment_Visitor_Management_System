import mongoose, { Schema, Document } from 'mongoose';
import { encrypt, decrypt, encryptDeterministic, decryptDeterministic } from '../utils/crypto';

// Non-deterministic encrypt/decrypt setters & getters
const encryptField = (val: any) => val ? encrypt(String(val)) : val;
const decryptField = (val: any) => val ? decrypt(String(val)) : val;

// Deterministic encrypt/decrypt setters & getters
const encryptDeterministicField = (val: any) => val ? encryptDeterministic(String(val)) : val;
const decryptDeterministicField = (val: any) => val ? decryptDeterministic(String(val)) : val;

// Global function to apply schema options (virtual 'id', JSON mapping)
function configureSchema(schema: Schema) {
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    getters: true,
    transform: (doc, ret: any) => {
      if (ret._id) {
        ret.id = ret._id.toString();
      }
      delete ret._id;
    }
  });
  schema.set('toObject', {
    virtuals: true,
    versionKey: false,
    getters: true,
    transform: (doc, ret: any) => {
      if (ret._id) {
        ret.id = ret._id.toString();
      }
      delete ret._id;
    }
  });
  schema.set('timestamps', true);
}

// 1. User Model
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['SUPER_ADMIN', 'APARTMENT_ADMIN', 'SECURITY_GUARD', 'RESIDENT'], required: true },
});
configureSchema(UserSchema);

// 2. Apartment Model
const ApartmentSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  blocksCount: { type: Number, default: 1 },
  floorsCount: { type: Number, default: 1 },
  flatsCount: { type: Number, default: 1 },
  logoUrl: { type: String, default: null },
  images: { type: String, default: null }, // JSON string array of image URLs
  emergencyContacts: { type: String, default: null }, // JSON string of phone listings
});
configureSchema(ApartmentSchema);

// 3. Block Model
const BlockSchema = new Schema({
  name: { type: String, required: true },
  apartmentId: { type: Schema.Types.ObjectId, ref: 'Apartment', required: true },
});
configureSchema(BlockSchema);

// 4. Floor Model
const FloorSchema = new Schema({
  number: { type: Number, required: true },
});
configureSchema(FloorSchema);

// 5. Flat Model
const FlatSchema = new Schema({
  number: { type: String, required: true },
  blockId: { type: Schema.Types.ObjectId, ref: 'Block', required: true },
  floorId: { type: Schema.Types.ObjectId, ref: 'Floor', required: true },
  apartmentId: { type: Schema.Types.ObjectId, ref: 'Apartment', required: true },
});
FlatSchema.virtual('block').get(function(this: any) {
  return this.blockId;
});
FlatSchema.virtual('floor').get(function(this: any) {
  return this.floorId;
});
configureSchema(FlatSchema);

// 6. Resident Model
const ResidentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  flatId: { type: Schema.Types.ObjectId, ref: 'Flat', required: true },
  isOwner: { type: Boolean, default: true },
  phone: { type: String, required: true, get: decryptDeterministicField, set: encryptDeterministicField },
  email: { type: String, required: true },
  vehicleDetails: { type: String, default: null, get: decryptField, set: encryptField }, // JSON string of vehicles
  emergencyContact: { type: String, default: null, get: decryptField, set: encryptField }, // JSON string of emergency contact details
  photoUrl: { type: String, default: null },
  documentUrl: { type: String, default: null },
  moveInDate: { type: Date, default: Date.now },
  moveOutDate: { type: Date, default: null },
  status: { type: String, default: 'ACTIVE' }, // ACTIVE, INACTIVE
  familyMembers: { type: String, default: null, get: decryptField, set: encryptField }, // JSON string of members
});
configureSchema(ResidentSchema);

// 7. SecurityGuard Model
const SecurityGuardSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  apartmentId: { type: Schema.Types.ObjectId, ref: 'Apartment', required: true },
  shift: { type: String, default: 'DAY' }, // DAY, NIGHT, ROUTINE
  assignedGate: { type: String, default: 'Gate 1' },
  phone: { type: String, required: true },
  idCard: { type: String, default: null },
  photoUrl: { type: String, default: null },
  performance: { type: Number, default: 5.0 },
  attendance: { type: String, default: null }, // JSON string log
});
configureSchema(SecurityGuardSchema);

// 8. Visitor Model
const VisitorSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true, get: decryptDeterministicField, set: encryptDeterministicField },
  email: { type: String, default: null, get: decryptField, set: encryptField },
  gender: { type: String, default: null },
  address: { type: String, default: null, get: decryptField, set: encryptField },
  idProof: { type: String, default: null, get: decryptField, set: encryptField }, // JSON string of document
  photoUrl: { type: String, default: null },
  isBlacklisted: { type: Boolean, default: false },
  notes: { type: String, default: null, get: decryptField, set: encryptField },
});
configureSchema(VisitorSchema);

// 9. VisitorLog Model
const VisitorLogSchema = new Schema({
  visitorId: { type: Schema.Types.ObjectId, ref: 'Visitor', required: true },
  flatId: { type: Schema.Types.ObjectId, ref: 'Flat', required: true },
  residentId: { type: Schema.Types.ObjectId, ref: 'Resident', default: null },
  purpose: { type: String, default: 'GUEST' }, // GUEST, DELIVERY, MAINTENANCE, etc.
  vehicleNumber: { type: String, default: null },
  visitorType: { type: String, default: 'Guest' },
  expectedArrival: { type: Date, default: null },
  actualArrival: { type: Date, default: null },
  expectedExit: { type: Date, default: null },
  actualExit: { type: Date, default: null },
  status: { type: String, default: 'PENDING' }, // PENDING, APPROVED, REJECTED, INSIDE, EXITED
  gateEntry: { type: String, default: null },
  gateExit: { type: String, default: null },
  notes: { type: String, default: null },
  isEmergency: { type: Boolean, default: false },
  passId: { type: Schema.Types.ObjectId, ref: 'VisitorPass', default: null },
});
VisitorLogSchema.virtual('visitor').get(function(this: any) {
  return this.visitorId;
});
VisitorLogSchema.virtual('flat').get(function(this: any) {
  return this.flatId;
});
VisitorLogSchema.virtual('resident').get(function(this: any) {
  return this.residentId;
});
configureSchema(VisitorLogSchema);

// 10. VisitorApproval Model
const VisitorApprovalSchema = new Schema({
  logId: { type: Schema.Types.ObjectId, ref: 'VisitorLog', required: true, unique: true },
  residentId: { type: Schema.Types.ObjectId, ref: 'Resident', required: true },
  status: { type: String, default: 'PENDING' }, // PENDING, APPROVED, REJECTED, EXPIRED
  notes: { type: String, default: null },
});
VisitorApprovalSchema.virtual('log').get(function(this: any) {
  return this.logId;
});
VisitorApprovalSchema.virtual('resident').get(function(this: any) {
  return this.residentId;
});
configureSchema(VisitorApprovalSchema);

// 11. VisitorPass Model
const VisitorPassSchema = new Schema({
  code: { type: String, required: true, unique: true },
  visitorName: { type: String, required: true },
  visitorPhone: { type: String, required: true },
  visitorType: { type: String, default: 'Guest' },
  flatId: { type: Schema.Types.ObjectId, ref: 'Flat', required: true },
  residentId: { type: Schema.Types.ObjectId, ref: 'Resident', required: true },
  expiryTime: { type: Date, required: true },
  isOneTime: { type: Boolean, default: true },
  isUsed: { type: Boolean, default: false },
});
configureSchema(VisitorPassSchema);

// 12. Notification Model
const NotificationSchema = new Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: 'PUSH' }, // EMAIL, SMS, PUSH, WHATSAPP
  userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  isRead: { type: Boolean, default: false },
});
configureSchema(NotificationSchema);

// 13. Announcement Model
const AnnouncementSchema = new Schema({
  apartmentId: { type: Schema.Types.ObjectId, ref: 'Apartment', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, default: 'NOTICE' }, // EMERGENCY, MAINTENANCE, FESTIVAL, NOTICE
});
configureSchema(AnnouncementSchema);

// 14. ActivityLog Model
const ActivityLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  username: { type: String, default: null },
  fullName: { type: String, default: null },
  role: { type: String, default: null },
  email: { type: String, default: null },
  deviceName: { type: String, default: null },
  deviceType: { type: String, default: null },
  operatingSystem: { type: String, default: null },
  browserName: { type: String, default: null },
  browserVersion: { type: String, default: null },
  ipAddress: { type: String, default: null },
  location: { type: String, default: null },
  loginTime: { type: Date, default: null },
  logoutTime: { type: Date, default: null },
  sessionDuration: { type: Number, default: null }, // in seconds
  sessionId: { type: String, default: null },
  authMethod: { type: String, default: null },
  action: { type: String, required: true }, // Action Performed
  moduleName: { type: String, default: null },
  apiEndpoint: { type: String, default: null },
  requestMethod: { type: String, default: null },
  responseStatus: { type: Number, default: null },
  status: { type: String, enum: ['SUCCESS', 'FAILURE'], default: 'SUCCESS' },
  failureReason: { type: String, default: null },
  details: { type: String, default: null },
  lastActivityTime: { type: Date, default: Date.now },
});
configureSchema(ActivityLogSchema);

// 15. EmergencyAlertSchema Model
const EmergencyAlertSchema = new Schema({
  apartmentId: { type: Schema.Types.ObjectId, ref: 'Apartment', required: true },
  triggeredById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, default: 'PANIC' }, // FIRE, MEDICAL, POLICE, PANIC
  status: { type: String, default: 'ACTIVE' }, // ACTIVE, RESOLVED
  notes: { type: String, default: null },
});
configureSchema(EmergencyAlertSchema);

// 16. Settings Model
const SettingsSchema = new Schema({
  apartmentId: { type: Schema.Types.ObjectId, ref: 'Apartment', required: true, unique: true },
  workingHours: { type: String, default: '06:00 - 22:00' },
  visitorTimeLimit: { type: Number, default: 120 },
  approvalRules: { type: String, default: 'REQUIRE_ALL' },
  qrExpiry: { type: Number, default: 1440 },
  notificationSettings: { type: String, default: 'EMAIL_SMS' },
  theme: { type: String, default: 'LIGHT' },
  language: { type: String, default: 'en' },
  singleSessionPerUser: { type: Boolean, default: false },
});
configureSchema(SettingsSchema);

// Export Models
export const User = mongoose.model('User', UserSchema);
export const Apartment = mongoose.model('Apartment', ApartmentSchema);
export const Block = mongoose.model('Block', BlockSchema);
export const Floor = mongoose.model('Floor', FloorSchema);
export const Flat = mongoose.model('Flat', FlatSchema);
export const Resident = mongoose.model('Resident', ResidentSchema);
export const SecurityGuard = mongoose.model('SecurityGuard', SecurityGuardSchema);
export const Visitor = mongoose.model('Visitor', VisitorSchema);
export const VisitorLog = mongoose.model('VisitorLog', VisitorLogSchema);
export const VisitorApproval = mongoose.model('VisitorApproval', VisitorApprovalSchema);
export const VisitorPass = mongoose.model('VisitorPass', VisitorPassSchema);
export const Notification = mongoose.model('Notification', NotificationSchema);
export const Announcement = mongoose.model('Announcement', AnnouncementSchema);
export const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);
export const EmergencyAlert = mongoose.model('EmergencyAlert', EmergencyAlertSchema);
export const Settings = mongoose.model('Settings', SettingsSchema);

// 17. RefreshToken Model
const RefreshTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  ipAddress: { type: String, default: null },
  userAgent: { type: String, default: null },
  isRevoked: { type: Boolean, default: false },
});
configureSchema(RefreshTokenSchema);
export const RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema);
