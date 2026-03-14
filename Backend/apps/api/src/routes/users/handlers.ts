import type { Request, Response, NextFunction } from 'express';
import { eq, and, count, desc } from 'drizzle-orm';
import { db, users, workspaces, invitationTokens } from '@mcq-platform/db';
import { hashPassword, canManageRole } from '@mcq-platform/auth';
import { env } from '@mcq-platform/config';
import { enqueue, QUEUE_NAMES, type NotificationPayload } from '@mcq-platform/queue';
import { AppError } from '../../middleware/error-handler.js';
import { writeAuditLog } from '../../lib/audit.js';
import { parsePagination } from '../../lib/pagination.js';
import crypto from 'node:crypto';
import { buildInvitationEmail } from '../../lib/email-templates.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);

    const items = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        status: users.status,
        lastActiveAt: users.lastActiveAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.workspaceId, req.workspaceId))
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(users)
      .where(eq(users.workspaceId, req.workspaceId));

    // Add initials
    const enriched = items.map((u) => ({
      ...u,
      initials: u.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
    }));

    res.json({
      data: { items: enriched, total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function invite(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, role } = req.body;

    // Check if actor can assign this role
    if (!canManageRole(req.userRole, role)) {
      throw new AppError(403, 'FORBIDDEN', 'Cannot assign a role equal to or higher than your own');
    }

    // Check if already in workspace
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.workspaceId, req.workspaceId), eq(users.email, email.toLowerCase())))
      .limit(1);

    if (existing) {
      throw new AppError(409, 'USER_EXISTS', 'User already exists in this workspace');
    }

    const inviteToken = crypto.randomBytes(24).toString('hex');
    const tempPassword = crypto.randomBytes(16).toString('hex');
    const passwordHash = await hashPassword(tempPassword);
    const tokenHash = crypto.createHash('sha256').update(inviteToken).digest('hex');

    const [{ workspaceName }] = await db
      .select({ workspaceName: workspaces.name })
      .from(workspaces)
      .where(eq(workspaces.id, req.workspaceId))
      .limit(1);

    const { user } = await db.transaction(async (tx) => {
      const [createdUser] = await tx
        .insert(users)
        .values({
          workspaceId: req.workspaceId,
          email: email.toLowerCase(),
          name: email.split('@')[0],
          passwordHash,
          role,
          status: 'invited',
        })
        .returning();

      await tx.insert(invitationTokens).values({
        workspaceId: req.workspaceId,
        userId: createdUser.id,
        invitedBy: req.userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      return { user: createdUser };
    });

    const inviteUrl = `${env.APP_BASE_URL.replace(/\/$/, '')}/accept-invite?token=${inviteToken}`;
    const inviteEmail = buildInvitationEmail({
      workspaceName: workspaceName ?? 'ExtractIQ',
      role,
      inviteUrl,
    });

    await enqueue<NotificationPayload>(QUEUE_NAMES.NOTIFICATION, {
      workspaceId: req.workspaceId,
      userId: req.userId,
      type: 'user_invited',
      title: 'Invitation sent',
      message: `Invitation sent to ${user.email}.`,
      data: { invitedUserId: user.id, invitedEmail: user.email, role: user.role },
      emails: [
        {
          to: user.email,
          subject: inviteEmail.subject,
          text: inviteEmail.text,
          html: inviteEmail.html,
        },
      ],
      relatedType: 'invitation',
      relatedId: user.id,
    });

    writeAuditLog({
      workspaceId: req.workspaceId,
      userId: req.userId,
      resourceType: 'user',
      resourceId: user.id,
      action: 'user.invited',
      details: { email: user.email, role },
    });

    res.status(201).json({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        invitationUrl: inviteUrl,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    // Check target user belongs to workspace
    const [target] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.workspaceId, req.workspaceId)))
      .limit(1);

    if (!target) throw new AppError(404, 'NOT_FOUND', 'User not found');

    // Cannot edit self role
    if (id === req.userId && req.body.role) {
      throw new AppError(400, 'CANNOT_CHANGE_OWN_ROLE', 'Cannot change your own role');
    }

    // Check role hierarchy
    if (req.body.role && !canManageRole(req.userRole, req.body.role)) {
      throw new AppError(403, 'FORBIDDEN', 'Cannot assign a role equal to or higher than your own');
    }

    const updates: Record<string, unknown> = {};
    if (req.body.role) updates.role = req.body.role;
    if (req.body.status) updates.status = req.body.status;
    if (req.body.name) updates.name = req.body.name;

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();

    writeAuditLog({
      workspaceId: req.workspaceId,
      userId: req.userId,
      resourceType: 'user',
      resourceId: id,
      action: 'user.updated',
      details: updates,
    });

    res.json({
      data: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        status: updated.status,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function deactivate(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    if (id === req.userId) {
      throw new AppError(400, 'CANNOT_DEACTIVATE_SELF', 'Cannot deactivate your own account');
    }

    const [user] = await db
      .update(users)
      .set({ status: 'inactive' })
      .where(and(eq(users.id, id), eq(users.workspaceId, req.workspaceId)))
      .returning();

    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');

    writeAuditLog({
      workspaceId: req.workspaceId,
      userId: req.userId,
      resourceType: 'user',
      resourceId: id,
      action: 'user.deactivated',
      details: { email: user.email },
    });

    res.json({ data: { message: 'User deactivated' } });
  } catch (err) {
    next(err);
  }
}
