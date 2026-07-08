import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ActivityLog } from '../models';
import { AuthenticatedRequest } from './auth';

interface UserAgentDetails {
  deviceName: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  operatingSystem: string;
  browserName: string;
  browserVersion: string;
}

/**
 * Lightweight, regex-based user agent parser to extract device/OS/browser metadata.
 */
export function parseUserAgent(uaString: string): UserAgentDetails {
  let deviceName = 'Windows PC';
  let deviceType: 'Desktop' | 'Mobile' | 'Tablet' = 'Desktop';
  let operatingSystem = 'Windows';
  let browserName = 'Chrome';
  let browserVersion = 'Latest';

  if (!uaString) {
    return { deviceName, deviceType, operatingSystem, browserName, browserVersion };
  }

  // Detect Device Type
  if (/tablet|ipad|playbook|silk/i.test(uaString)) {
    deviceType = 'Tablet';
  } else if (/mobile|phone|iphone|ipod|android|blackberry|iemobile|opera mini/i.test(uaString)) {
    deviceType = 'Mobile';
  }

  // Detect OS
  if (/windows/i.test(uaString)) {
    operatingSystem = 'Windows';
    if (/windows nt 10.0/i.test(uaString)) operatingSystem = 'Windows 10/11';
    else if (/windows nt 6.3/i.test(uaString)) operatingSystem = 'Windows 8.1';
    else if (/windows nt 6.2/i.test(uaString)) operatingSystem = 'Windows 8';
    else if (/windows nt 6.1/i.test(uaString)) operatingSystem = 'Windows 7';
  } else if (/macintosh|mac os x/i.test(uaString)) {
    operatingSystem = 'Mac OS X';
  } else if (/android/i.test(uaString)) {
    operatingSystem = 'Android';
  } else if (/iphone|ipad|ipod/i.test(uaString)) {
    operatingSystem = 'iOS';
  } else if (/linux/i.test(uaString)) {
    operatingSystem = 'Linux';
  }

  // Detect Browser Name & Version
  const browserRegexes = [
    { name: 'Firefox', regex: /firefox\/(\d+(\.\d+)*)/i },
    { name: 'Edge', regex: /edge?\/(\d+(\.\d+)*)/i },
    { name: 'Chrome', regex: /chrome\/(\d+(\.\d+)*)/i },
    { name: 'Safari', regex: /version\/(\d+(\.\d+)*) .*safari/i },
    { name: 'Opera', regex: /opera|opr\/(\d+(\.\d+)*)/i },
  ];

  for (const b of browserRegexes) {
    const match = uaString.match(b.regex);
    if (match) {
      browserName = b.name;
      browserVersion = match[1] || 'Latest';
      break;
    }
  }

  // Device Name Specifics
  if (/iphone/i.test(uaString)) deviceName = 'iPhone';
  else if (/ipad/i.test(uaString)) deviceName = 'iPad';
  else if (/macintosh/i.test(uaString)) deviceName = 'Macbook / iMac';
  else if (/android/i.test(uaString)) {
    const modelMatch = uaString.match(/android\s+[^;]+;\s+([^;)]+)/i);
    deviceName = modelMatch ? modelMatch[1].trim() : 'Android Device';
  } else if (/windows/i.test(uaString)) {
    deviceName = 'Windows PC';
  }

  return { deviceName, deviceType, operatingSystem, browserName, browserVersion };
}

/**
 * Resolves geolocation based on client IP. Falls back to Localhost or Unknown.
 */
export async function getLocation(ip: string): Promise<string> {
  const cleanIp = ip.replace('::ffff:', '');
  if (cleanIp === '::1' || cleanIp === '127.0.0.1' || cleanIp.startsWith('10.') || cleanIp.startsWith('192.168.')) {
    return 'Localhost Network (Bengaluru, Karnataka)';
  }
  try {
    const response = await fetch(`http://ip-api.com/json/${cleanIp}`);
    if (response.ok) {
      const data = await response.json() as any;
      if (data.status === 'success') {
        return `${data.city}, ${data.regionName}, ${data.country}`;
      }
    }
  } catch (err) {
    // Fail silently
  }
  return 'Unknown Location';
}

/**
 * Express middleware to automatically generate comprehensive Audit Logs for mutations, reports, and auth.
 */
export function auditLogger(moduleName: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const ua = req.headers['user-agent'] || '';
    const ip = req.ip || req.socket.remoteAddress || 'Unknown';
    
    // Asynchronously resolve UA and Geo Location
    const { deviceName, deviceType, operatingSystem, browserName, browserVersion } = parseUserAgent(ua);
    const location = await getLocation(ip);

    // Capture standard response finish event
    res.on('finish', async () => {
      const method = req.method;
      const path = req.path;
      
      // Determine if this is a loggable request (mutations, login/out, emergency, analytics, reports)
      const isMutation = ['POST', 'PUT', 'DELETE'].includes(method);
      const isSpecial = path.includes('/login') || path.includes('/logout') || path.includes('/emergency') || path.includes('/reports') || path.includes('/backup');
      
      if (!isMutation && !isSpecial) {
        return; // Skip read-only GET requests to save DB storage
      }

      const responseStatus = res.statusCode;
      const status = responseStatus >= 200 && responseStatus < 400 ? 'SUCCESS' : 'FAILURE';

      // Parse nice action name
      let action = `${method} ${req.baseUrl}${path}`;
      if (path.includes('/login')) action = 'USER_LOGIN';
      else if (path.includes('/logout')) action = 'USER_LOGOUT';
      else if (path.includes('/register')) action = 'RESIDENT_SIGNUP';
      else if (path.includes('/emergency')) action = 'EMERGENCY_TRIGGER';
      else if (path.includes('/backup')) action = 'DB_BACKUP';
      
      // Resolve operator attributes
      let userId = null;
      let username = 'system';
      let fullName = 'System Automaton';
      let role = 'SYSTEM';
      let email = 'system@visitor.com';

      if (req.user) {
        userId = req.user.id;
        username = req.user.email.split('@')[0];
        fullName = req.user.name;
        role = req.user.role;
        email = req.user.email;
      }

      // Generate or retrieve session tracking details
      const sessionId = req.headers['x-session-id'] as string || crypto.randomBytes(16).toString('hex');

      try {
        await ActivityLog.create({
          userId,
          username,
          fullName,
          role,
          email,
          deviceName,
          deviceType,
          operatingSystem,
          browserName,
          browserVersion,
          ipAddress: ip.replace('::ffff:', ''),
          location,
          action,
          moduleName,
          apiEndpoint: `${req.baseUrl}${path}`,
          requestMethod: method,
          responseStatus,
          status,
          failureReason: status === 'FAILURE' ? `Failed with status code ${responseStatus}` : null,
          sessionDuration: Math.max(1, Math.round((Date.now() - startTime) / 1000)),
          sessionId,
          authMethod: req.headers.authorization ? 'JWT Bearer' : 'Credentials',
          lastActivityTime: new Date(),
        });
      } catch (err) {
        console.error('[Audit Logger Error]:', err);
      }
    });

    next();
  };
}
