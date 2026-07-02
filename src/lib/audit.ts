import { db } from '@/db';
import { auditLogs } from '@/db/schema';

export async function logAction({
  userId,
  action,
  resource,
  details,
}: {
  userId: string;
  action: string;
  resource: string;
  details?: any;
}) {
  await db.insert(auditLogs).values({
    userId,
    action,
    resource,
    details,
  });
}