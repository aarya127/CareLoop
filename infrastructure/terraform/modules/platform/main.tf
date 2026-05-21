locals {
  cluster_name = "${var.name_prefix}-${var.environment}"

  public_subnet_tags = {
    "kubernetes.io/role/elb"                    = "1"
    "kubernetes.io/cluster/${local.cluster_name}" = "shared"
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb"           = "1"
    "kubernetes.io/cluster/${local.cluster_name}" = "shared"
  }

  public_zone_id = var.existing_public_zone_id != "" ? var.existing_public_zone_id : (
    var.create_public_zone ? aws_route53_zone.public[0].zone_id : ""
  )
}

data "aws_availability_zones" "available" {
  state = "available"
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.name_prefix}-vpc"
  cidr = var.vpc_cidr

  azs             = slice(data.aws_availability_zones.available.names, 0, 3)
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs

  enable_nat_gateway = var.enable_nat_gateway
  single_nat_gateway = var.single_nat_gateway

  enable_dns_hostnames = true
  enable_dns_support   = true

  public_subnet_tags  = local.public_subnet_tags
  private_subnet_tags = local.private_subnet_tags

  tags = var.tags
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = local.cluster_name
  cluster_version = var.kubernetes_version

  cluster_endpoint_public_access  = var.cluster_endpoint_public_access
  enable_cluster_creator_admin_permissions = true

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    default = {
      min_size       = var.node_group_min_size
      max_size       = var.node_group_max_size
      desired_size   = var.node_group_desired_size
      instance_types = var.node_instance_types
      capacity_type  = "ON_DEMAND"
      labels = {
        environment = var.environment
      }
    }
  }

  cluster_addons = {
    coredns = {}
    kube-proxy = {}
    vpc-cni = {}
  }

  tags = merge(var.tags, {
    "Environment" = var.environment
  })
}

resource "aws_route53_zone" "public" {
  count = var.create_public_zone ? 1 : 0

  name = var.public_domain_name

  tags = merge(var.tags, {
    Environment = var.environment
    Scope       = "public"
  })
}

resource "aws_route53_zone" "private" {
  count = var.create_private_zone ? 1 : 0

  name = var.private_domain_name

  vpc {
    vpc_id = module.vpc.vpc_id
  }

  tags = merge(var.tags, {
    Environment = var.environment
    Scope       = "private"
  })
}

resource "aws_acm_certificate" "ingress" {
  count = var.create_acm_certificate && local.public_zone_id != "" ? 1 : 0

  domain_name               = var.acm_certificate_domain
  validation_method         = "DNS"
  subject_alternative_names = var.acm_certificate_san_domains

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

resource "aws_route53_record" "ingress_cert_validation" {
  for_each = var.create_acm_certificate && local.public_zone_id != "" ? {
    for dvo in aws_acm_certificate.ingress[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  zone_id = local.public_zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 60
  records = [each.value.record]
}

resource "aws_acm_certificate_validation" "ingress" {
  count = var.create_acm_certificate && local.public_zone_id != "" ? 1 : 0

  certificate_arn = aws_acm_certificate.ingress[0].arn
  validation_record_fqdns = [for rec in aws_route53_record.ingress_cert_validation : rec.fqdn]
}

# ---------------------------------------------------------------------------
# S3 — Document storage bucket
# ---------------------------------------------------------------------------

resource "aws_s3_bucket" "documents" {
  bucket = "${var.name_prefix}-documents-${var.environment}"

  tags = merge(var.tags, {
    Environment = var.environment
    Purpose     = "document-storage"
  })
}

resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "documents" {
  bucket = aws_s3_bucket.documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT"]
    allowed_origins = var.cors_allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

# ---------------------------------------------------------------------------
# IRSA — IAM role for API pods to access the documents bucket
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "documents_s3" {
  statement {
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
    ]
    resources = ["${aws_s3_bucket.documents.arn}/*"]
  }

  statement {
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.documents.arn]
  }
}

resource "aws_iam_policy" "documents_s3" {
  name        = "${local.cluster_name}-documents-s3"
  description = "Allows API pods to access the CareLoop documents S3 bucket"
  policy      = data.aws_iam_policy_document.documents_s3.json

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

data "aws_iam_policy_document" "documents_s3_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [module.eks.oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "${replace(module.eks.cluster_oidc_issuer_url, "https://", "")}:sub"
      values   = ["system:serviceaccount:${var.api_service_account_namespace}:${var.api_service_account_name}"]
    }

    condition {
      test     = "StringEquals"
      variable = "${replace(module.eks.cluster_oidc_issuer_url, "https://", "")}:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "documents_s3" {
  name               = "${local.cluster_name}-documents-s3"
  assume_role_policy = data.aws_iam_policy_document.documents_s3_assume_role.json

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

resource "aws_iam_role_policy_attachment" "documents_s3" {
  role       = aws_iam_role.documents_s3.name
  policy_arn = aws_iam_policy.documents_s3.arn
}
