import type { Request, Response, NextFunction } from 'express';
import { eq, and, isNull } from 'drizzle-orm';
import { db, users, workspaces, refreshTokens, invitationTokens } from '@mcq-platform/db';
import { hashPassword, verifyPassword, signToken, signRefreshToken, verifyToken } from '@mcq-platform/auth';
import { env } from '@mcq-platform/config';
import { createLogger } from '@mcq-platform/logger';
import { AppError } from '../../middleware/error-handler.js';
import { enqueue, QUEUE_NAMES, type NotificationPayload } from '@mcq-platform/queue';
import crypto from 'node:crypto';

const logger = createLogger('auth-handlers');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

function hashOpaqueToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name, workspaceName } = req.body;

    // Check if email already exists
    const existing = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      throw new AppError(409, 'EMAIL_EXISTS', 'An account with this email already exists');
    }

    const passwordHash = await hashPassword(password);

    // Create workspace + user in one transaction
    const result = await db.transaction(async (tx) => {
      const slug = workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const [workspace] = await tx.insert(workspaces).values({
        name: workspaceName,
        slug: slug + '-' + Date.now().toString(36),
        plan: 'free',
        settings: { emailNotifications: true, webhookUrl: null, defaultExtractionProfile: null },
      }).returning();

      const [user] = await tx.insert(users).values({
        workspaceId: workspace.id,
        email: email.toLowerCase(),
        name,
        passwordHash,
        role: 'workspace_admin',
        status: 'active',
      }).returning();

      return { user, workspace };
    });

    const token = signToken(
      { sub: result.user.id, wid: result.workspace.id, role: result.user.role },
      env.JWT_SECRET,
    );

    const refresh = signRefreshToken(
      { sub: result.user.id, wid: result.workspace.id, role: result.user.role },
      env.JWT_SECRET,
    );

    // Store refresh token hash
    const refreshHash = crypto.createHash('sha256').update(refresh).digest('hex');
    await db.insert(refreshTokens).values({
      userId: result.user.id,
      tokenHash: refreshHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.cookie('access_token', token, { ...COOKIE_OPTIONS, maxAge: 24 * 60 * 60 * 1000 });
    res.cookie('refresh_token', refresh, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });

    logger.info({ userId: result.user.id }, 'User registered');

    res.status(201).json({
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          workspaceId: result.workspace.id,
        },
        token,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const [user] = await db.select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    if (user.status !== 'active') {
      throw new AppError(403, 'ACCOUNT_INACTIVE', 'Account is not active');
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Update last active
    await db.update(users)
      .set({ lastActiveAt: new Date() })
      .where(eq(users.id, user.id));

    const token = signToken(
      { sub: user.id, wid: user.workspaceId, role: user.role },
      env.JWT_SECRET,
    );

    const refresh = signRefreshToken(
      { sub: user.id, wid: user.workspaceId, role: user.role },
      env.JWT_SECRET,
    );

    // Store refresh token hash
    const refreshHash = crypto.createHash('sha256').update(refresh).digest('hex');
    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: refreshHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.cookie('access_token', token, { ...COOKIE_OPTIONS, maxAge: 24 * 60 * 60 * 1000 });
    res.cookie('refresh_token', refresh, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });

    logger.info({ userId: user.id }, 'User logged in');

    res.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          workspaceId: user.workspaceId,
        },
        token,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getInvitation(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.params.token as string;
    const tokenHash = hashOpaqueToken(token);

    const [invitation] = await db.select({
      id: invitationTokens.id,
      expiresAt: invitationTokens.expiresAt,
      acceptedAt: invitationTokens.acceptedAt,
      workspaceId: invitationTokens.workspaceId,
      email: users.email,
      role: users.role,
      status: users.status,
      name: users.name,
      workspaceName: workspaces.name,
    })
      .from(invitationTokens)
      .innerJoin(users, eq(users.id, invitationTokens.userId))
      .innerJoin(workspaces, eq(workspaces.id, invitationTokens.workspaceId))
      .where(eq(invitationTokens.tokenHash, tokenHash))
      .limit(1);

    if (!invitation) {
      throw new AppError(404, 'INVITATION_NOT_FOUND', 'Invitation not found');
    }

    const expired = invitation.expiresAt.getTime() < Date.now();
    const accepted = Boolean(invitation.acceptedAt);

    res.json({
      data: {
        email: invitation.email,
        role: invitation.role,
        workspaceId: invitation.workspaceId,
        workspaceName: invitation.workspaceName,
        invitedName: invitation.name,
        expiresAt: invitation.expiresAt,
        accepted,
        expired,
        status: expired ? 'expired' : accepted ? 'accepted' : 'pending',
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function acceptInvitation(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, name, password } = req.body;
    const tokenHash = hashOpaqueToken(token);

    const [invitation] = await db.select({
      id: invitationTokens.id,
      workspaceId: invitationTokens.workspaceId,
      userId: invitationTokens.userId,
      expiresAt: invitationTokens.expiresAt,
      acceptedAt: invitationTokens.acceptedAt,
      role: users.role,
      email: users.email,
    })
      .from(invitationTokens)
      .innerJoin(users, eq(users.id, invitationTokens.userId))
      .where(eq(invitationTokens.tokenHash, tokenHash))
      .limit(1);

    if (!invitation) {
      throw new AppError(404, 'INVITATION_NOT_FOUND', 'Invitation not found');
    }

    if (invitation.acceptedAt) {
      throw new AppError(409, 'INVITATION_ALREADY_ACCEPTED', 'Invitation has already been accepted');
    }

    if (invitation.expiresAt.getTime() < Date.now()) {
      throw new AppError(410, 'INVITATION_EXPIRED', 'Invitation has expired');
    }

    const passwordHash = await hashPassword(password);

    const result = await db.transaction(async (tx) => {
      const [user] = await tx.update(users)
        .set({
          name,
          passwordHash,
          status: 'active',
          lastActiveAt: new Date(),
        })
        .where(eq(users.id, invitation.userId))
        .returning();

      await tx.update(invitationTokens)
        .set({ acceptedAt: new Date() })
        .where(eq(invitationTokens.id, invitation.id));

      await tx.update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(and(eq(refreshTokens.userId, invitation.userId), isNull(refreshTokens.revokedAt)));

      return user;
    });

    const accessToken = signToken(
      { sub: result.id, wid: invitation.workspaceId, role: result.role },
      env.JWT_SECRET,
    );

    const refreshToken = signRefreshToken(
      { sub: result.id, wid: invitation.workspaceId, role: result.role },
      env.JWT_SECRET,
    );

    await db.insert(refreshTokens).values({
      userId: result.id,
      tokenHash: hashOpaqueToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.cookie('access_token', accessToken, { ...COOKIE_OPTIONS, maxAge: 24 * 60 * 60 * 1000 });
    res.cookie('refresh_token', refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });

    await enqueue<NotificationPayload>(QUEUE_NAMES.NOTIFICATION, {
      workspaceId: invitation.workspaceId,
      userId: result.id,
      type: 'user.invitation_accepted',
      title: 'Invitation accepted',
      message: `${result.name} joined the workspace.`,
      data: { userId: result.id },
    });

    res.json({
      data: {
        user: {
          id: result.id,
          email: invitation.email,
          name: result.name,
          role: result.role,
          workspaceId: invitation.workspaceId,
        },
        token: accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    // Revoke all refresh tokens for this user
    const refreshCookie = req.cookies?.refresh_token;
    if (refreshCookie) {
      const refreshHash = crypto.createHash('sha256').update(refreshCookie).digest('hex');
      await db.update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.tokenHash, refreshHash));
    }

    res.clearCookie('access_token', COOKIE_OPTIONS);
    res.clearCookie('refresh_token', COOKIE_OPTIONS);

    res.json({ data: { message: 'Logged out' } });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshCookie = req.cookies?.refresh_token;
    if (!refreshCookie) {
      throw new AppError(401, 'NO_REFRESH_TOKEN', 'Refresh token required');
    }

    // Verify the refresh token
    let payload;
    try {
      payload = verifyToken(refreshCookie, env.JWT_SECRET);
    } catch {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token');
    }

    // Check if token is in DB and not revoked
    const refreshHash = crypto.createHash('sha256').update(refreshCookie).digest('hex');
    const [stored] = await db.select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, refreshHash))
      .limit(1);

    if (!stored || stored.revokedAt) {
      throw new AppError(401, 'REVOKED_TOKEN', 'Refresh token has been revoked');
    }

    // Get fresh user data
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!user || user.status !== 'active') {
      throw new AppError(401, 'ACCOUNT_INACTIVE', 'Account is not active');
    }

    // Issue new access token
    const newToken = signToken(
      { sub: user.id, wid: user.workspaceId, role: user.role },
      env.JWT_SECRET,
    );

    res.cookie('access_token', newToken, { ...COOKIE_OPTIONS, maxAge: 24 * 60 * 60 * 1000 });

    res.json({
      data: { token: newToken },
    });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body;

    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, req.userId))
      .limit(1);

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      throw new AppError(401, 'INVALID_PASSWORD', 'Current password is incorrect');
    }

    const newHash = await hashPassword(newPassword);
    await db.update(users)
      .set({ passwordHash: newHash })
      .where(eq(users.id, req.userId));

    logger.info({ userId: req.userId }, 'Password changed');

    res.json({ data: { message: 'Password changed successfully' } });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      status: users.status,
      workspaceId: users.workspaceId,
      avatarUrl: users.avatarUrl,
      lastActiveAt: users.lastActiveAt,
      createdAt: users.createdAt,
    })
      .from(users)
      .where(eq(users.id, req.userId))
      .limit(1);

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    res.json({ data: { user } });
  } catch (err) {
    next(err);
  }
}
