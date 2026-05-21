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
    key    = "dev/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "careloop"
      Environment = "dev"
      ManagedBy   = "terraform"
    }
  }
}

variable "aws_region" {
  description = "AWS region for dev infrastructure."
  default = "us-east-1"
}

module "platform" {
  source = "../../modules/platform"

  environment = "dev"
  name_prefix = "careloop"

  vpc_cidr             = "10.10.0.0/16"
  public_subnet_cidrs  = ["10.10.0.0/24", "10.10.1.0/24", "10.10.2.0/24"]
  private_subnet_cidrs = ["10.10.10.0/24", "10.10.11.0/24", "10.10.12.0/24"]

  enable_nat_gateway  = true
  single_nat_gateway  = true
  kubernetes_version  = "1.30"
  node_instance_types = ["t3.large"]

  node_group_min_size     = 1
  node_group_desired_size = 2
  node_group_max_size     = 3

  create_public_zone      = false
  create_private_zone     = true
  private_domain_name     = "dev.careloop.company.internal"
  create_acm_certificate  = false

  cors_allowed_origins          = ["http://localhost:3000"]
  api_service_account_namespace = "careloop"
  api_service_account_name      = "careloop-api"

  tags = {
    Owner = "platform"
    Tier  = "non-prod"
  }
}

output "cluster_name" {
  value = module.platform.cluster_name
}

output "cluster_endpoint" {
  value = module.platform.cluster_endpoint
}

output "documents_bucket_name" {
  value = module.platform.documents_bucket_name
}

output "documents_s3_role_arn" {
  value = module.platform.documents_s3_role_arn
}
