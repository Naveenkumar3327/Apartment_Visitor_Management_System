import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { encrypt } from './crypto';

/**
 * Dumps all database collections, serializes, encrypts using AES-256-GCM,
 * and saves the encrypted backup to the server/backups/ directory.
 * @returns The name of the generated backup file.
 */
export async function runEncryptedBackup(): Promise<string> {
  try {
    const backupDir = path.resolve(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupData: Record<string, any[]> = {};
    
    // Ensure database connection is active
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      throw new Error('Database connection is not fully initialized');
    }
    
    const collections = await mongoose.connection.db.collections();

    for (const collection of collections) {
      const name = collection.collectionName;
      // Skip system collections
      if (name.startsWith('system.')) continue;
      
      const docs = await collection.find({}).toArray();
      backupData[name] = docs;
    }

    const serialized = JSON.stringify(backupData);
    const encrypted = encrypt(serialized);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.enc`;
    const filepath = path.join(backupDir, filename);

    fs.writeFileSync(filepath, encrypted, 'utf8');
    
    // Maintain max 7 backup files to save disk space
    cleanOldBackups(backupDir);

    console.log(`[Backup] Encrypted backup created successfully: ${filename}`);
    return filename;
  } catch (error: any) {
    console.error('[Backup Error]:', error);
    throw new Error(`Database backup failed: ${error.message}`);
  }
}

/**
 * Cleans up old backups keeping only the latest 7 files.
 */
function cleanOldBackups(backupDir: string) {
  try {
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('backup-') && file.endsWith('.enc'))
      .map(file => ({
        name: file,
        time: fs.statSync(path.join(backupDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // descending: newest first

    if (files.length > 7) {
      const toDelete = files.slice(7);
      for (const file of toDelete) {
        fs.unlinkSync(path.join(backupDir, file.name));
        console.log(`[Backup Cleanup] Deleted old backup file: ${file.name}`);
      }
    }
  } catch (err) {
    console.error('[Backup Cleanup Error]:', err);
  }
}
