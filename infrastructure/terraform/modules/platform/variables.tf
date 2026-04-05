variable "environment" {
  description = "Environment name (dev, staging, prod)."
  type        = string
}

variable "name_prefix" {
  description = "Prefix for AWS resource names."
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block."
  type        = string
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDRs across AZs."
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDRs across AZs."
  type        = list(string)
}

variable "enable_nat_gateway" {
  description = "Enable NAT gateway for private subnet egress."
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use a single NAT gateway to reduce cost."
  type        = bool
  default     = true
}

variable "kubernetes_version" {
  description = "EKS Kubernetes version."
  type        = string
  default     = "1.30"
}

variable "cluster_endpoint_public_access" {
  description = "Whether the EKS API endpoint is publicly reachable."
  type        = bool
  default     = true
}

variable "node_instance_types" {
  description = "Instance types for EKS managed node group."
  type        = list(string)
  default     = ["t3.large"]
}

variable "node_group_min_size" {
  description = "Minimum nodes in default node group."
  type        = number
}

variable "node_group_max_size" {
  description = "Maximum nodes in default node group."
  type        = number
}

variable "node_group_desired_size" {
  description = "Desired nodes in default node group."
  type        = number
}

variable "create_public_zone" {
  description = "Whether to create a Route53 public hosted zone."
  type        = bool
  default     = false
}

variable "create_private_zone" {
  description = "Whether to create a Route53 private hosted zone."
  type        = bool
  default     = true
}

variable "public_domain_name" {
  description = "Public hosted zone name."
  type        = string
  default     = ""
}

variable "private_domain_name" {
  description = "Private hosted zone name."
  type        = string
  default     = ""
}

variable "existing_public_zone_id" {
  description = "Existing Route53 public zone id. Leave empty to create a zone."
  type        = string
  default     = ""
}

variable "create_acm_certificate" {
  description = "Whether to create and validate ACM cert for ingress hosts."
  type        = bool
  default     = false
}

variable "acm_certificate_domain" {
  description = "Primary cert domain."
  type        = string
  default     = ""
}

variable "acm_certificate_san_domains" {
  description = "Subject alternative names for cert."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Common tags for all resources."
  type        = map(string)
  default     = {}
}
