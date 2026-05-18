terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" {
  region = var.aws_region
}

# --- Variables ---
variable "aws_region"   { default = "us-east-1" }
variable "app_name"     { default = "aisupport" }
variable "environment"  { default = "production" }

# --- S3 Bucket for File Uploads ---
resource "aws_s3_bucket" "uploads" {
  bucket = "${var.app_name}-uploads-${var.environment}"
  tags   = { Name = "${var.app_name}-uploads", Environment = var.environment }
}

resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  versioning_configuration { status = "Enabled" }
}

# --- ECS Cluster ---
resource "aws_ecs_cluster" "main" {
  name = "${var.app_name}-cluster"
  setting { name = "containerInsights", value = "enabled" }
}

# --- Lambda for AI Processing ---
resource "aws_lambda_function" "ai_processor" {
  function_name = "${var.app_name}-ai-processor"
  runtime       = "nodejs20.x"
  handler       = "index.handler"
  role          = aws_iam_role.lambda_exec.arn
  filename      = "lambda_placeholder.zip"
  timeout       = 30
  memory_size   = 512

  environment {
    variables = {
      BEDROCK_MODEL_ID = "anthropic.claude-3-sonnet-20240229-v1:0"
      ENVIRONMENT      = var.environment
    }
  }
}

resource "aws_iam_role" "lambda_exec" {
  name = "${var.app_name}-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_bedrock" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonBedrockFullAccess"
}

# --- CloudFront for Frontend ---
resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  default_root_object = "index.html"

  origin {
    domain_name = aws_s3_bucket.uploads.bucket_regional_domain_name
    origin_id   = "S3Origin"
  }

  default_cache_behavior {
    target_origin_id       = "S3Origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
  }

  restrictions { geo_restriction { restriction_type = "none" } }
  viewer_certificate { cloudfront_default_certificate = true }
}

# --- Outputs ---
output "s3_bucket_name"     { value = aws_s3_bucket.uploads.bucket }
output "ecs_cluster_name"   { value = aws_ecs_cluster.main.name }
output "lambda_function_name" { value = aws_lambda_function.ai_processor.function_name }
output "cloudfront_domain"  { value = aws_cloudfront_distribution.frontend.domain_name }
