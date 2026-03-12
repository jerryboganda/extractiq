CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"extraction_profile" jsonb,
	"quality_thresholds" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(30) DEFAULT 'reviewer' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"avatar_url" text,
	"last_active_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"plan" varchar(20) DEFAULT 'free' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"max_file_size_mb" integer DEFAULT 100 NOT NULL,
	"auto_approve_threshold" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"page_number" integer NOT NULL,
	"page_type" varchar(30) DEFAULT 'question' NOT NULL,
	"text_layer_present" varchar(10) DEFAULT 'false' NOT NULL,
	"visual_complexity_score" real,
	"routing_decision" varchar(30) DEFAULT 'ocr_then_llm' NOT NULL,
	"raw_text" text,
	"classification" text
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"filename" varchar(500) NOT NULL,
	"s3_key" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"page_count" integer,
	"status" varchar(30) DEFAULT 'uploaded' NOT NULL,
	"checksum_sha256" varchar(64),
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"mcq_count" integer DEFAULT 0 NOT NULL,
	"confidence_avg" real,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_page_id" uuid NOT NULL,
	"s3_key" text NOT NULL,
	"dpi" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"format" varchar(20) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"document_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"document_id" uuid,
	"document_page_id" uuid,
	"task_type" varchar(30) NOT NULL,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"provider_config_id" uuid,
	"input_data" jsonb,
	"output_data" jsonb,
	"error_message" text,
	"latency_ms" integer,
	"cost_usd" real,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"total_documents" integer DEFAULT 0 NOT NULL,
	"total_pages" integer,
	"total_tasks" integer DEFAULT 0 NOT NULL,
	"completed_tasks" integer DEFAULT 0 NOT NULL,
	"failed_tasks" integer DEFAULT 0 NOT NULL,
	"progress_percent" real DEFAULT 0 NOT NULL,
	"extraction_profile" jsonb,
	"error_summary" jsonb,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcq_record_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mcq_record_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"previous_values" jsonb NOT NULL,
	"changed_by" uuid NOT NULL,
	"change_type" varchar(30) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcq_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"source_page" integer NOT NULL,
	"source_page_end" integer,
	"source_page_image_ref" text,
	"source_excerpt" text,
	"question_number" varchar(30),
	"question_text" text NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"correct_answer" text,
	"explanation" text,
	"question_type" varchar(30) DEFAULT 'single_choice' NOT NULL,
	"subject" varchar(200),
	"topic" varchar(200),
	"difficulty" varchar(30),
	"language" varchar(10) DEFAULT 'en' NOT NULL,
	"extraction_pathway" varchar(30) NOT NULL,
	"provider_used" varchar(50) NOT NULL,
	"model_used" varchar(100) NOT NULL,
	"confidence" real NOT NULL,
	"confidence_breakdown" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"hallucination_risk_tier" varchar(30) DEFAULT 'low' NOT NULL,
	"review_status" varchar(30) DEFAULT 'pending' NOT NULL,
	"cost_attribution" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"schema_version" varchar(20) DEFAULT '1.0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_item_id" uuid NOT NULL,
	"action_type" varchar(30) NOT NULL,
	"performed_by" uuid NOT NULL,
	"changes" jsonb,
	"reviewer_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mcq_record_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"severity" varchar(30) NOT NULL,
	"flag_types" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reason_summary" text,
	"assigned_to" uuid,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ocr_artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_page_id" uuid NOT NULL,
	"provider_config_id" uuid NOT NULL,
	"raw_text" text,
	"markdown_text" text,
	"confidence" real,
	"bounding_boxes" jsonb,
	"latency_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_benchmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_config_id" uuid NOT NULL,
	"accuracy" real,
	"avg_latency_ms" real,
	"cost_per_record" real,
	"error_rate" real,
	"total_records" integer DEFAULT 0 NOT NULL,
	"total_cost" real DEFAULT 0 NOT NULL,
	"measured_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"category" varchar(30) NOT NULL,
	"provider_type" varchar(30) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"api_key_encrypted" text NOT NULL,
	"models" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"health_status" varchar(20) DEFAULT 'unknown' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"last_health_check" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"document_page_id" uuid,
	"raw_text" text NOT NULL,
	"segment_type" varchar(30) NOT NULL,
	"question_number_detected" varchar(30),
	"start_offset" integer,
	"end_offset" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vlm_outputs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_page_id" uuid NOT NULL,
	"provider_config_id" uuid NOT NULL,
	"raw_output" jsonb,
	"extracted_mcqs" jsonb,
	"confidence" real,
	"cost_usd" real,
	"latency_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" varchar(12) NOT NULL,
	"name" varchar(100) NOT NULL,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid,
	"resource_type" varchar(50) NOT NULL,
	"resource_id" uuid,
	"action" varchar(50) NOT NULL,
	"details" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cost_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"job_id" uuid,
	"job_task_id" uuid,
	"provider_config_id" uuid,
	"operation_type" varchar(50) NOT NULL,
	"cost_usd" real NOT NULL,
	"token_count" integer,
	"input_tokens" integer,
	"output_tokens" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "export_artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"export_job_id" uuid NOT NULL,
	"s3_key" text NOT NULL,
	"filename" varchar(500) NOT NULL,
	"file_size" integer NOT NULL,
	"content_type" varchar(100) NOT NULL,
	"download_url_expiry" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "export_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"format" varchar(20) NOT NULL,
	"scope" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"total_records" integer,
	"file_size" integer,
	"progress_percent" real DEFAULT 0 NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "hallucination_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mcq_record_id" uuid NOT NULL,
	"detection_tier" varchar(30) NOT NULL,
	"detection_rule" varchar(100) NOT NULL,
	"severity" varchar(30) NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(30) NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"data" jsonb,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_id" varchar(100) NOT NULL,
	"version" integer NOT NULL,
	"task_type" varchar(50) NOT NULL,
	"template" text NOT NULL,
	"variables" jsonb,
	"schema_ref" text,
	"performance_metrics" jsonb,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "validation_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"total_records" integer NOT NULL,
	"passed_count" integer NOT NULL,
	"flagged_count" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"failed_count" integer NOT NULL,
	"duplicate_count" integer DEFAULT 0 NOT NULL,
	"weak_ocr_count" integer DEFAULT 0 NOT NULL,
	"export_ready_count" integer DEFAULT 0 NOT NULL,
	"rule_breakdown" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"estimated_total_cost" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"integration_type" varchar(30) NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_pages" ADD CONSTRAINT "document_pages_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_images" ADD CONSTRAINT "page_images_document_page_id_document_pages_id_fk" FOREIGN KEY ("document_page_id") REFERENCES "public"."document_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_documents" ADD CONSTRAINT "job_documents_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_documents" ADD CONSTRAINT "job_documents_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_tasks" ADD CONSTRAINT "job_tasks_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_tasks" ADD CONSTRAINT "job_tasks_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_tasks" ADD CONSTRAINT "job_tasks_document_page_id_document_pages_id_fk" FOREIGN KEY ("document_page_id") REFERENCES "public"."document_pages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcq_record_history" ADD CONSTRAINT "mcq_record_history_mcq_record_id_mcq_records_id_fk" FOREIGN KEY ("mcq_record_id") REFERENCES "public"."mcq_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcq_records" ADD CONSTRAINT "mcq_records_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcq_records" ADD CONSTRAINT "mcq_records_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcq_records" ADD CONSTRAINT "mcq_records_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcq_records" ADD CONSTRAINT "mcq_records_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_actions" ADD CONSTRAINT "review_actions_review_item_id_review_items_id_fk" FOREIGN KEY ("review_item_id") REFERENCES "public"."review_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_mcq_record_id_mcq_records_id_fk" FOREIGN KEY ("mcq_record_id") REFERENCES "public"."mcq_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocr_artifacts" ADD CONSTRAINT "ocr_artifacts_document_page_id_document_pages_id_fk" FOREIGN KEY ("document_page_id") REFERENCES "public"."document_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocr_artifacts" ADD CONSTRAINT "ocr_artifacts_provider_config_id_provider_configs_id_fk" FOREIGN KEY ("provider_config_id") REFERENCES "public"."provider_configs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_benchmarks" ADD CONSTRAINT "provider_benchmarks_provider_config_id_provider_configs_id_fk" FOREIGN KEY ("provider_config_id") REFERENCES "public"."provider_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_configs" ADD CONSTRAINT "provider_configs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "segments" ADD CONSTRAINT "segments_document_page_id_document_pages_id_fk" FOREIGN KEY ("document_page_id") REFERENCES "public"."document_pages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vlm_outputs" ADD CONSTRAINT "vlm_outputs_document_page_id_document_pages_id_fk" FOREIGN KEY ("document_page_id") REFERENCES "public"."document_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vlm_outputs" ADD CONSTRAINT "vlm_outputs_provider_config_id_provider_configs_id_fk" FOREIGN KEY ("provider_config_id") REFERENCES "public"."provider_configs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_records" ADD CONSTRAINT "cost_records_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_records" ADD CONSTRAINT "cost_records_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_records" ADD CONSTRAINT "cost_records_job_task_id_job_tasks_id_fk" FOREIGN KEY ("job_task_id") REFERENCES "public"."job_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_records" ADD CONSTRAINT "cost_records_provider_config_id_provider_configs_id_fk" FOREIGN KEY ("provider_config_id") REFERENCES "public"."provider_configs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_artifacts" ADD CONSTRAINT "export_artifacts_export_job_id_export_jobs_id_fk" FOREIGN KEY ("export_job_id") REFERENCES "public"."export_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hallucination_events" ADD CONSTRAINT "hallucination_events_mcq_record_id_mcq_records_id_fk" FOREIGN KEY ("mcq_record_id") REFERENCES "public"."mcq_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validation_reports" ADD CONSTRAINT "validation_reports_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_integrations" ADD CONSTRAINT "workspace_integrations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "projects_workspace_id_idx" ON "projects" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "projects_status_idx" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "users_workspace_email_idx" ON "users" USING btree ("workspace_id","email");--> statement-breakpoint
CREATE INDEX "users_workspace_id_idx" ON "users" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_slug_idx" ON "workspaces" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "document_pages_document_id_idx" ON "document_pages" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "document_pages_page_number_idx" ON "document_pages" USING btree ("document_id","page_number");--> statement-breakpoint
CREATE INDEX "documents_workspace_id_idx" ON "documents" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "documents_project_id_idx" ON "documents" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "documents_status_idx" ON "documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "documents_uploaded_by_idx" ON "documents" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "page_images_document_page_id_idx" ON "page_images" USING btree ("document_page_id");--> statement-breakpoint
CREATE INDEX "job_documents_job_id_idx" ON "job_documents" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "job_documents_document_id_idx" ON "job_documents" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "job_tasks_job_id_idx" ON "job_tasks" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "job_tasks_status_idx" ON "job_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_tasks_task_type_idx" ON "job_tasks" USING btree ("task_type");--> statement-breakpoint
CREATE INDEX "job_tasks_document_id_idx" ON "job_tasks" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "jobs_workspace_id_idx" ON "jobs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "jobs_project_id_idx" ON "jobs" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "jobs_status_idx" ON "jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "mcq_record_history_mcq_record_id_idx" ON "mcq_record_history" USING btree ("mcq_record_id");--> statement-breakpoint
CREATE INDEX "mcq_records_workspace_id_idx" ON "mcq_records" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "mcq_records_project_id_idx" ON "mcq_records" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "mcq_records_document_id_idx" ON "mcq_records" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "mcq_records_job_id_idx" ON "mcq_records" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "mcq_records_review_status_idx" ON "mcq_records" USING btree ("review_status");--> statement-breakpoint
CREATE INDEX "mcq_records_confidence_idx" ON "mcq_records" USING btree ("confidence");--> statement-breakpoint
CREATE INDEX "mcq_records_hallucination_tier_idx" ON "mcq_records" USING btree ("hallucination_risk_tier");--> statement-breakpoint
CREATE INDEX "review_actions_review_item_id_idx" ON "review_actions" USING btree ("review_item_id");--> statement-breakpoint
CREATE INDEX "review_items_mcq_record_id_idx" ON "review_items" USING btree ("mcq_record_id");--> statement-breakpoint
CREATE INDEX "review_items_workspace_id_idx" ON "review_items" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "review_items_status_idx" ON "review_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "review_items_assigned_to_idx" ON "review_items" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "ocr_artifacts_document_page_id_idx" ON "ocr_artifacts" USING btree ("document_page_id");--> statement-breakpoint
CREATE INDEX "provider_benchmarks_provider_config_id_idx" ON "provider_benchmarks" USING btree ("provider_config_id");--> statement-breakpoint
CREATE INDEX "provider_configs_workspace_id_idx" ON "provider_configs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "provider_configs_category_idx" ON "provider_configs" USING btree ("category");--> statement-breakpoint
CREATE INDEX "provider_configs_provider_type_idx" ON "provider_configs" USING btree ("provider_type");--> statement-breakpoint
CREATE INDEX "segments_document_id_idx" ON "segments" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "segments_document_page_id_idx" ON "segments" USING btree ("document_page_id");--> statement-breakpoint
CREATE INDEX "vlm_outputs_document_page_id_idx" ON "vlm_outputs" USING btree ("document_page_id");--> statement-breakpoint
CREATE INDEX "api_keys_workspace_id_idx" ON "api_keys" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "api_keys_key_hash_idx" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "audit_logs_workspace_id_idx" ON "audit_logs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "cost_records_workspace_id_idx" ON "cost_records" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "cost_records_job_id_idx" ON "cost_records" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "cost_records_provider_config_id_idx" ON "cost_records" USING btree ("provider_config_id");--> statement-breakpoint
CREATE INDEX "export_artifacts_export_job_id_idx" ON "export_artifacts" USING btree ("export_job_id");--> statement-breakpoint
CREATE INDEX "export_jobs_workspace_id_idx" ON "export_jobs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "export_jobs_status_idx" ON "export_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "hallucination_events_mcq_record_id_idx" ON "hallucination_events" USING btree ("mcq_record_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_workspace_id_idx" ON "notifications" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("read");--> statement-breakpoint
CREATE INDEX "prompt_versions_prompt_id_idx" ON "prompt_versions" USING btree ("prompt_id");--> statement-breakpoint
CREATE INDEX "prompt_versions_task_type_idx" ON "prompt_versions" USING btree ("task_type");--> statement-breakpoint
CREATE INDEX "prompt_versions_is_active_idx" ON "prompt_versions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "validation_reports_job_id_idx" ON "validation_reports" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "workspace_integrations_workspace_id_idx" ON "workspace_integrations" USING btree ("workspace_id");