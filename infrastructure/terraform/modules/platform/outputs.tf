output "cluster_name" {
  description = "EKS cluster name."
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "EKS cluster API endpoint."
  value       = module.eks.cluster_endpoint
}

output "cluster_oidc_provider_arn" {
  description = "OIDC provider ARN used by IRSA."
  value       = module.eks.oidc_provider_arn
}

output "vpc_id" {
  description = "VPC id for the environment."
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet ids."
  value       = module.vpc.public_subnets
}

output "private_subnet_ids" {
  description = "Private subnet ids."
  value       = module.vpc.private_subnets
}

output "public_hosted_zone_id" {
  description = "Route53 public zone id."
  value       = try(aws_route53_zone.public[0].zone_id, null)
}

output "private_hosted_zone_id" {
  description = "Route53 private zone id."
  value       = try(aws_route53_zone.private[0].zone_id, null)
}

output "acm_certificate_arn" {
  description = "ACM certificate ARN for ingress TLS."
  value       = try(aws_acm_certificate_validation.ingress[0].certificate_arn, null)
}

output "documents_bucket_name" {
  description = "Name of the S3 documents bucket."
  value       = aws_s3_bucket.documents.id
}

output "documents_bucket_arn" {
  description = "ARN of the S3 documents bucket."
  value       = aws_s3_bucket.documents.arn
}

output "documents_s3_role_arn" {
  description = "IAM role ARN for IRSA — annotate the API service account with this."
  value       = aws_iam_role.documents_s3.arn
}
