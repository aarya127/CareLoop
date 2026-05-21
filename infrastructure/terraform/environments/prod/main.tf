terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "careloop-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "careloop"
      Environment = "prod"
      ManagedBy   = "terraform"
    }
  }
}

variable "aws_region" {
  description = "AWS region for production infrastructure."
  default = "us-east-1"
}

module "platform" {
  source = "../../modules/platform"

  environment = "prod"
  name_prefix = "careloop"

  vpc_cidr             = "10.30.0.0/16"
  public_subnet_cidrs  = ["10.30.0.0/24", "10.30.1.0/24", "10.30.2.0/24"]
  private_subnet_cidrs = ["10.30.10.0/24", "10.30.11.0/24", "10.30.12.0/24"]

  enable_nat_gateway  = true
  single_nat_gateway  = false
  kubernetes_version  = "1.30"
  node_instance_types = ["m6i.large"]

  node_group_min_size     = 3
  node_group_desired_size = 4
  node_group_max_size     = 10

  create_public_zone       = true
  create_private_zone      = true
  public_domain_name       = "careloop.company.com"
  private_domain_name      = "careloop.company.internal"
  create_acm_certificate   = true
  acm_certificate_domain   = "app.careloop.company.com"
  acm_certificate_san_domains = [
    "api.careloop.company.com"
  ]

  cors_allowed_origins          = ["https://app.careloop.company.com"]
  api_service_account_namespace = "careloop"
  api_service_account_name      = "careloop-api"

  tags = {
    Owner = "platform"
    Tier  = "prod"
  }
}

output "cluster_name" {
  value = module.platform.cluster_name
}

output "acm_certificate_arn" {
  value = module.platform.acm_certificate_arn
}

output "documents_bucket_name" {
  value = module.platform.documents_bucket_name
}

output "documents_s3_role_arn" {
  value = module.platform.documents_s3_role_arn
}
