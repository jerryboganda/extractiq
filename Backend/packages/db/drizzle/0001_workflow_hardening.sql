CREATE TABLE IF NOT EXISTS invitation_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES users(id),
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS invitation_tokens_token_hash_idx ON invitation_tokens(token_hash);
CREATE INDEX IF NOT EXISTS invitation_tokens_workspace_id_idx ON invitation_tokens(workspace_id);
CREATE INDEX IF NOT EXISTS invitation_tokens_user_id_idx ON invitation_tokens(user_id);

CREATE TABLE IF NOT EXISTS public_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_type varchar(30) NOT NULL,
  full_name varchar(100) NOT NULL,
  email varchar(255) NOT NULL,
  company varchar(150) NOT NULL,
  role varchar(100),
  monthly_volume varchar(100),
  message text,
  status varchar(20) NOT NULL DEFAULT 'received',
  source varchar(30) NOT NULL DEFAULT 'website',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS public_submissions_type_idx ON public_submissions(submission_type);
CREATE INDEX IF NOT EXISTS public_submissions_status_idx ON public_submissions(status);
CREATE INDEX IF NOT EXISTS public_submissions_created_at_idx ON public_submissions(created_at);

CREATE TABLE IF NOT EXISTS email_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  notification_id uuid REFERENCES notifications(id) ON DELETE SET NULL,
  recipient varchar(255) NOT NULL,
  subject varchar(255) NOT NULL,
  body_text text NOT NULL,
  body_html text,
  status varchar(20) NOT NULL DEFAULT 'queued',
  related_type varchar(50),
  related_id uuid,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_deliveries_workspace_id_idx ON email_deliveries(workspace_id);
CREATE INDEX IF NOT EXISTS email_deliveries_status_idx ON email_deliveries(status);
CREATE INDEX IF NOT EXISTS email_deliveries_related_idx ON email_deliveries(related_type, related_id);
