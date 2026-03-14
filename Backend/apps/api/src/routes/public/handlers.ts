import type { Request, Response, NextFunction } from 'express';
import { db, publicSubmissions } from '@mcq-platform/db';
import { env } from '@mcq-platform/config';
import { enqueue, QUEUE_NAMES, type NotificationPayload } from '@mcq-platform/queue';
import {
  buildCustomerAcknowledgementEmail,
  buildSubmissionNotificationEmail,
} from '../../lib/email-templates.js';

export async function submitDemoRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const { firstName, lastName, email, company, role, monthlyVolume, useCase } = req.body;
    const fullName = `${firstName} ${lastName}`.trim();

    const [submission] = await db.insert(publicSubmissions).values({
      submissionType: 'demo_request',
      fullName,
      email,
      company,
      role: role ?? null,
      monthlyVolume: monthlyVolume ?? null,
      message: useCase ?? null,
      metadata: {
        sourcePath: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') ?? '',
      },
    }).returning();

    const adminEmail = buildSubmissionNotificationEmail({
      subject: `New ExtractIQ demo request from ${fullName}`,
      eyebrow: 'Demo Request',
      title: 'New demo request received',
      intro: `${fullName} requested an ExtractIQ platform demo for ${company}.`,
      detailLines: [
        `Name: ${fullName}`,
        `Email: ${email}`,
        `Company: ${company}`,
        `Role: ${role || 'Not provided'}`,
        `Monthly volume: ${monthlyVolume || 'Not provided'}`,
        `Use case: ${useCase || 'Not provided'}`,
      ],
    });
    const customerEmail = buildCustomerAcknowledgementEmail({
      subject: 'Your ExtractIQ demo request has been received',
      eyebrow: 'Demo Request Received',
      title: 'Thanks for requesting a live ExtractIQ demo',
      intro: `Hi ${fullName}, thanks for your interest in ExtractIQ. Our team has received your request and will reach out with next steps within one business day.`,
      detailLines: [
        `Company: ${company}`,
        `Request type: Platform demo`,
      ],
      ctaLabel: 'Explore ExtractIQ',
      ctaUrl: env.APP_BASE_URL,
    });

    await enqueue<NotificationPayload>(QUEUE_NAMES.NOTIFICATION, {
      type: 'public_demo_request',
      title: 'New demo request',
      message: `${fullName} requested a demo for ${company}.`,
      emails: [
        {
          to: env.SALES_NOTIFICATION_EMAIL,
          subject: adminEmail.subject,
          text: adminEmail.text,
          html: adminEmail.html,
        },
        {
          to: email,
          subject: customerEmail.subject,
          text: customerEmail.text,
          html: customerEmail.html,
        },
      ],
      relatedType: 'public_submission',
      relatedId: submission.id,
    });

    res.status(201).json({
      data: {
        id: submission.id,
        status: submission.status,
        message: 'Demo request received',
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function submitContactRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const { fullName, email, company, useCase } = req.body;

    const [submission] = await db.insert(publicSubmissions).values({
      submissionType: 'contact_request',
      fullName,
      email,
      company,
      message: useCase ?? null,
      metadata: {
        sourcePath: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') ?? '',
      },
    }).returning();

    const adminEmail = buildSubmissionNotificationEmail({
      subject: `New ExtractIQ website contact from ${fullName}`,
      eyebrow: 'Website Contact',
      title: 'New website contact received',
      intro: `${fullName} submitted a contact request for ${company}.`,
      detailLines: [
        `Name: ${fullName}`,
        `Email: ${email}`,
        `Company: ${company}`,
        `Use case: ${useCase || 'Not provided'}`,
      ],
    });
    const customerEmail = buildCustomerAcknowledgementEmail({
      subject: 'We received your ExtractIQ request',
      eyebrow: 'Contact Confirmation',
      title: 'Your message is with the ExtractIQ team',
      intro: `Hi ${fullName}, thank you for contacting ExtractIQ. We’ve received your request and will respond as soon as possible.`,
      detailLines: [
        `Company: ${company}`,
        'Request type: Website contact',
      ],
      ctaLabel: 'Open ExtractIQ',
      ctaUrl: env.APP_BASE_URL,
    });

    await enqueue<NotificationPayload>(QUEUE_NAMES.NOTIFICATION, {
      type: 'public_contact_request',
      title: 'New website contact',
      message: `${fullName} reached out from ${company}.`,
      emails: [
        {
          to: env.SUPPORT_NOTIFICATION_EMAIL,
          subject: adminEmail.subject,
          text: adminEmail.text,
          html: adminEmail.html,
        },
        {
          to: email,
          subject: customerEmail.subject,
          text: customerEmail.text,
          html: customerEmail.html,
        },
      ],
      relatedType: 'public_submission',
      relatedId: submission.id,
    });

    res.status(201).json({
      data: {
        id: submission.id,
        status: submission.status,
        message: 'Contact request received',
      },
    });
  } catch (err) {
    next(err);
  }
}
