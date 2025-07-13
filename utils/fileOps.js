import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USER_FILE = path.join(__dirname, '../data/users.json');
const AUDIT_FILE = path.join(__dirname, '../data/audit-log.json');

/**
 * Updates a user's field in the users.json file and logs the change
 * in audit-log.json with optional RAG context.
 *
 * @param {Object} parsed - { name, field, value, reason }
 * @param {Array} context - Array of similar audit entries from RAG
 * @returns {boolean}
 */
export async function updateUserData({ name, field, value, reason }, context = []) {
  // Load current users
  const users = JSON.parse(await fs.readFile(USER_FILE, 'utf-8'));

  // Find user by name (case-insensitive)
  const user = users.find(u => u.name.toLowerCase() === name.toLowerCase());
  if (!user) {
    throw new Error(`User "${name}" not found`);
  }

  // Store previous value, update field
  const oldValue = user[field];
  user[field] = value;

  // Save updated users list
  await fs.writeFile(USER_FILE, JSON.stringify(users, null, 2));

  // Append audit log entry
  const auditLog = JSON.parse(await fs.readFile(AUDIT_FILE, 'utf-8'));
  auditLog.push({
    timestamp: new Date().toISOString(),
    name,
    field,
    oldValue,
    newValue: value,
    reason,
    context: context.map(entry => entry.reason)
  });
  await fs.writeFile(AUDIT_FILE, JSON.stringify(auditLog, null, 2));

  return true;
}

