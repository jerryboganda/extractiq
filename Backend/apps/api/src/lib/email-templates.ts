type EmailTemplate = {
  subject: string;
  text: string;
  html: string;
};

type EmailShellOptions = {
  preheader: string;
  eyebrow: string;
  title: string;
  intro: string;
  detailLines?: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderDetailList(lines: string[]) {
  if (lines.length === 0) return '';

  return `
    <div style="margin: 24px 0; border: 1px solid #dbe4f0; border-radius: 18px; background: #f8fbff; overflow: hidden;">
      ${lines
        .map(
          (line, index) => `
            <div style="padding: 14px 18px; font-size: 14px; line-height: 22px; color: #10233f; ${
              index < lines.length - 1 ? 'border-bottom: 1px solid #dbe4f0;' : ''
            }">
              ${escapeHtml(line)}
            </div>`,
        )
        .join('')}
    </div>
  `;
}

function buildEmailShell(options: EmailShellOptions): Pick<EmailTemplate, 'html' | 'text'> {
  const detailLines = options.detailLines ?? [];
  const escapedTitle = escapeHtml(options.title);
  const escapedEyebrow = escapeHtml(options.eyebrow);
  const escapedIntro = escapeHtml(options.intro);
  const escapedFooterNote = options.footerNote ? escapeHtml(options.footerNote) : '';

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${escapedTitle}</title>
  </head>
  <body style="margin: 0; padding: 0; background: #eef4fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #10233f;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent;">
      ${escapeHtml(options.preheader)}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #eef4fb; padding: 24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px;">
            <tr>
              <td style="padding: 0 0 16px 0; text-align: center; font-size: 13px; line-height: 20px; color: #48617d;">
                ExtractIQ Document Intelligence Platform
              </td>
            </tr>
            <tr>
              <td style="background: linear-gradient(135deg, #0d1728 0%, #132540 50%, #1e56d8 100%); border-radius: 28px; padding: 32px;">
                <div style="display: inline-block; padding: 6px 12px; border-radius: 999px; background: rgba(255,255,255,0.12); color: #dbe8ff; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">
                  ${escapedEyebrow}
                </div>
                <h1 style="margin: 18px 0 12px; color: #ffffff; font-size: 30px; line-height: 38px; font-weight: 800;">
                  ${escapedTitle}
                </h1>
                <p style="margin: 0; color: #dbe8ff; font-size: 16px; line-height: 26px;">
                  ${escapedIntro}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #ffffff; border-radius: 28px; border: 1px solid #dbe4f0;">
                  <tr>
                    <td style="padding: 32px 28px;">
                      ${renderDetailList(detailLines)}
                      ${
                        options.ctaLabel && options.ctaUrl
                          ? `
                        <div style="margin: 28px 0 18px;">
                          <a
                            href="${escapeHtml(options.ctaUrl)}"
                            style="display: inline-block; padding: 14px 22px; border-radius: 14px; background: linear-gradient(135deg, #1e56d8 0%, #2563eb 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700;"
                          >
                            ${escapeHtml(options.ctaLabel)}
                          </a>
                        </div>`
                          : ''
                      }
                      <p style="margin: 0; color: #5f7590; font-size: 13px; line-height: 22px;">
                        ${escapedFooterNote || 'This email was sent by ExtractIQ to support a real platform workflow.'}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 18px 12px 0; text-align: center; font-size: 12px; line-height: 20px; color: #68809d;">
                ExtractIQ helps teams convert source documents into validated, review-ready MCQ datasets.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const textParts = [
    options.title,
    '',
    options.intro,
    '',
    ...detailLines,
  ];

  if (options.ctaLabel && options.ctaUrl) {
    textParts.push('', `${options.ctaLabel}: ${options.ctaUrl}`);
  }

  textParts.push('', options.footerNote ?? 'Sent by ExtractIQ Document Intelligence Platform.');

  return {
    html,
    text: textParts.join('\n'),
  };
}

export function buildInvitationEmail(input: {
  workspaceName: string;
  role: string;
  inviteUrl: string;
}): EmailTemplate {
  const subject = `Join ${input.workspaceName} on ExtractIQ Document Intelligence`;
  const title = `You’re invited to join ${input.workspaceName}`;

  const body = buildEmailShell({
    preheader: `Accept your invitation to ${input.workspaceName} and start using ExtractIQ.`,
    eyebrow: 'Workspace Invitation',
    title,
    intro: `You’ve been invited to join the ${input.workspaceName} workspace as ${input.role}. Accept your secure invitation to access document processing, MCQ review, and export workflows in ExtractIQ.`,
    detailLines: [
      `Workspace: ${input.workspaceName}`,
      `Assigned role: ${input.role}`,
      'Invitation access: secure email-based onboarding',
    ],
    ctaLabel: 'Accept Invitation',
    ctaUrl: input.inviteUrl,
    footerNote: 'If you were not expecting this invitation, you can safely ignore this email.',
  });

  return {
    subject,
    ...body,
  };
}

export function buildSubmissionNotificationEmail(input: {
  subject: string;
  eyebrow: string;
  title: string;
  intro: string;
  detailLines: string[];
}): EmailTemplate {
  const body = buildEmailShell({
    preheader: input.title,
    eyebrow: input.eyebrow,
    title: input.title,
    intro: input.intro,
    detailLines: input.detailLines,
    footerNote: 'Review this lead in the ExtractIQ operations workflow and follow up through the assigned team inbox.',
  });

  return {
    subject: input.subject,
    ...body,
  };
}

export function buildCustomerAcknowledgementEmail(input: {
  subject: string;
  eyebrow: string;
  title: string;
  intro: string;
  detailLines?: string[];
  ctaLabel?: string;
  ctaUrl?: string;
}): EmailTemplate {
  const body = buildEmailShell({
    preheader: input.title,
    eyebrow: input.eyebrow,
    title: input.title,
    intro: input.intro,
    detailLines: input.detailLines ?? [],
    ctaLabel: input.ctaLabel,
    ctaUrl: input.ctaUrl,
    footerNote: 'This message confirms your request was received by the ExtractIQ team.',
  });

  return {
    subject: input.subject,
    ...body,
  };
}
