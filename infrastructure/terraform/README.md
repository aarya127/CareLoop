# Terraform Foundation for CareLoop

This Terraform layout provisions a Phase 1 AWS foundation:

- VPC (public/private subnets across 3 AZs)
- EKS cluster with managed node group
- Route53 public/private hosted zones
- ACM certificate and DNS validation (optional)

## Structure

- modules/platform: reusable infrastructure module
- environments/dev: low-cost non-prod baseline
- environments/staging: production-like non-prod baseline
- environments/prod: isolated production baseline

## Usage

Example for staging:

```bash
cd environments/staging
terraform init
terraform plan
terraform apply
```

## Same-Account Route53 Guidance (Staging + Prod)

If staging and prod share one AWS account, only one environment should create the
public hosted zone (`careloop.company.com`) to avoid duplicate zone conflicts.

Recommended ownership:

- `prod`: `create_public_zone = true`
- `staging`: `create_public_zone = false` and reuse the prod zone via `existing_public_zone_id`

Apply order:

1. Apply prod first and capture the public zone id.
2. Apply staging with that id.

Example staging command:

```bash
cd environments/staging
terraform init
terraform plan -var='existing_public_zone_id=Z1234567890ABC'
terraform apply -var='existing_public_zone_id=Z1234567890ABC'
```

## Required follow-up integrations

After EKS creation, install:

- ingress-nginx
- cert-manager
- AWS Load Balancer Controller
- ExternalDNS

These are intentionally separated from Terraform core networking so upgrades are simpler and less coupled.
