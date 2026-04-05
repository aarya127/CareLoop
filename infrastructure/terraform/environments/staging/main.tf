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
    key    = "staging/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "careloop"
      Environment = "staging"
      ManagedBy   = "terraform"
    }
  }
}

variable "aws_region" {
  description = "AWS region for staging infrastructure."
  default = "us-east-1"
}

variable "existing_public_zone_id" {
  description = "Route53 public hosted zone ID for careloop.company.com (reuse prod-owned zone when in same AWS account)."
  type        = string
}

module "platform" {
  source = "../../modules/platform"

  environment = "staging"
  name_prefix = "careloop"

  vpc_cidr             = "10.20.0.0/16"
  public_subnet_cidrs  = ["10.20.0.0/24", "10.20.1.0/24", "10.20.2.0/24"]
  private_subnet_cidrs = ["10.20.10.0/24", "10.20.11.0/24", "10.20.12.0/24"]

  enable_nat_gateway  = true
  single_nat_gateway  = true
  kubernetes_version  = "1.30"
  node_instance_types = ["t3.large"]

  node_group_min_size     = 2
  node_group_desired_size = 2
  node_group_max_size     = 4

  create_public_zone       = false
  create_private_zone      = true
  public_domain_name       = "careloop.company.com"
  private_domain_name      = "staging.careloop.company.internal"
  existing_public_zone_id  = var.existing_public_zone_id
  create_acm_certificate   = true
  acm_certificate_domain   = "app.staging.careloop.company.com"
  acm_certificate_san_domains = [
    "api.staging.careloop.company.com"
  ]

  tags = {
    Owner = "platform"
    Tier  = "non-prod"
  }
}

output "cluster_name" {
  value = module.platform.cluster_name
}

output "acm_certificate_arn" {
  value = module.platform.acm_certificate_arn
}
