terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
}

data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}
data "aws_region" "current" {}

variable "aws_region" {
  description = "AWS region for Bedrock, S3, and QuickSight."
  type        = string
  default     = "us-east-1"
}

variable "aws_profile" {
  description = "Optional named AWS CLI profile. Leave null to use environment variables or the default AWS credential chain."
  type        = string
  default     = null
}

variable "app_name" {
  description = "Short app name used in resource names."
  type        = string
  default     = "aisupport"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "personal"
}

variable "bedrock_model_id" {
  description = "Foundation model used by the Bedrock Agent and direct model fallback."
  type        = string
  default     = "us.anthropic.claude-haiku-4-5-20251001-v1:0"
}

variable "quicksight_namespace" {
  description = "QuickSight namespace for registered users."
  type        = string
  default     = "default"
}

locals {
  name_prefix           = "${var.app_name}-${var.environment}-${data.aws_caller_identity.current.account_id}-${var.aws_region}"
  raw_bucket_name       = "${local.name_prefix}-raw"
  analytics_bucket_name = "${local.name_prefix}-analytics"
  model_invoke_resources = [
    "arn:${data.aws_partition.current.partition}:bedrock:*::foundation-model/*",
    "arn:${data.aws_partition.current.partition}:bedrock:${var.aws_region}:${data.aws_caller_identity.current.account_id}:inference-profile/${var.bedrock_model_id}",
  ]

  tags = {
    App         = var.app_name
    Environment = var.environment
    Owner       = "personal"
  }
}

resource "aws_s3_bucket" "raw" {
  bucket = local.raw_bucket_name
  tags   = merge(local.tags, { Name = "${var.app_name}-raw" })
}

resource "aws_s3_bucket" "analytics" {
  bucket = local.analytics_bucket_name
  tags   = merge(local.tags, { Name = "${var.app_name}-analytics" })
}

resource "aws_s3_bucket_public_access_block" "raw" {
  bucket                  = aws_s3_bucket.raw.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "analytics" {
  bucket                  = aws_s3_bucket.analytics.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "raw" {
  bucket = aws_s3_bucket.raw.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "analytics" {
  bucket = aws_s3_bucket.analytics.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "raw" {
  bucket = aws_s3_bucket.raw.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "analytics" {
  bucket = aws_s3_bucket.analytics.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

data "aws_iam_policy_document" "bedrock_agent_trust" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["bedrock.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }

    condition {
      test     = "ArnLike"
      variable = "AWS:SourceArn"
      values   = ["arn:${data.aws_partition.current.partition}:bedrock:${var.aws_region}:${data.aws_caller_identity.current.account_id}:agent/*"]
    }
  }
}

data "aws_iam_policy_document" "bedrock_agent_permissions" {
  statement {
    sid       = "InvokeFoundationModel"
    actions   = ["bedrock:InvokeModel"]
    resources = local.model_invoke_resources
  }
}

resource "aws_iam_role" "bedrock_agent" {
  name               = "AmazonBedrockExecutionRoleForAgents_${var.app_name}_${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.bedrock_agent_trust.json
  tags               = local.tags
}

resource "aws_iam_role_policy" "bedrock_agent" {
  name   = "${var.app_name}-${var.environment}-bedrock-agent"
  role   = aws_iam_role.bedrock_agent.id
  policy = data.aws_iam_policy_document.bedrock_agent_permissions.json
}

resource "aws_bedrockagent_agent" "support_ticket" {
  agent_name                  = "${var.app_name}-${var.environment}-support-ticket-agent"
  agent_resource_role_arn     = aws_iam_role.bedrock_agent.arn
  foundation_model            = var.bedrock_model_id
  idle_session_ttl_in_seconds = 1800
  description                 = "Personal AI support ticket assistant for agents, managers, and executives."
  instruction                 = <<-EOT
    You are the AI assistant for an AI support ticket platform.
    Keep the same project concept: help support agents summarize tickets, draft professional replies, classify priority, detect sentiment, and suggest next actions.
    Help team managers identify SLA risks, workload issues, recurring problems, and escalation patterns.
    Help business executives understand customer sentiment, churn risk, revenue impact, and strategic improvement opportunities.
    Be concise, practical, and do not claim access to data unless the user provides it in the conversation or the application supplies it.
  EOT
  tags                        = local.tags
}

resource "aws_bedrockagent_agent_alias" "support_ticket" {
  agent_alias_name = "${var.environment}-live"
  agent_id         = aws_bedrockagent_agent.support_ticket.agent_id
  description      = "Alias used by the AI support ticket backend."
  tags             = local.tags
}

data "aws_iam_policy_document" "backend_runtime" {
  statement {
    sid = "UseRawTicketBucket"
    actions = [
      "s3:PutObject",
      "s3:GetObject",
    ]
    resources = ["${aws_s3_bucket.raw.arn}/*"]
  }

  statement {
    sid = "ReadAnalyticsBucket"
    actions = [
      "s3:ListBucket",
    ]
    resources = [aws_s3_bucket.analytics.arn]
  }

  statement {
    sid = "ReadAnalyticsObjects"
    actions = [
      "s3:GetObject",
    ]
    resources = ["${aws_s3_bucket.analytics.arn}/*"]
  }

  statement {
    sid       = "InvokeBedrockModel"
    actions   = ["bedrock:InvokeModel"]
    resources = local.model_invoke_resources
  }

  statement {
    sid       = "InvokeBedrockAgent"
    actions   = ["bedrock:InvokeAgent"]
    resources = [aws_bedrockagent_agent_alias.support_ticket.agent_alias_arn]
  }

  statement {
    sid = "GenerateQuickSightEmbedUrl"
    actions = [
      "quicksight:GenerateEmbedUrlForRegisteredUser",
      "quicksight:DescribeUser",
      "quicksight:DescribeDashboard",
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:quicksight:${var.aws_region}:${data.aws_caller_identity.current.account_id}:user/${var.quicksight_namespace}/*",
      "arn:${data.aws_partition.current.partition}:quicksight:${var.aws_region}:${data.aws_caller_identity.current.account_id}:dashboard/*",
    ]
  }
}

resource "aws_iam_policy" "backend_runtime" {
  name        = "${var.app_name}-${var.environment}-backend-runtime"
  description = "Least-privilege runtime access for the AI support backend."
  policy      = data.aws_iam_policy_document.backend_runtime.json
  tags        = local.tags
}

output "aws_account_id" {
  value = data.aws_caller_identity.current.account_id
}

output "aws_region" {
  value = var.aws_region
}

output "raw_bucket_name" {
  value = aws_s3_bucket.raw.bucket
}

output "analytics_bucket_name" {
  value = aws_s3_bucket.analytics.bucket
}

output "bedrock_agent_id" {
  value = aws_bedrockagent_agent.support_ticket.agent_id
}

output "bedrock_agent_alias_id" {
  value = aws_bedrockagent_agent_alias.support_ticket.agent_alias_id
}

output "bedrock_model_id" {
  value = var.bedrock_model_id
}

output "backend_runtime_policy_arn" {
  value = aws_iam_policy.backend_runtime.arn
}
