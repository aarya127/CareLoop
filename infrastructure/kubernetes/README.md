# Kubernetes Manifests for CareLoop

This directory contains baseline manifests for staging deployment.

## Apply order

1. Create namespaces:

```bash
kubectl apply -f namespaces/namespaces.yaml
```

2. Deploy ingress-nginx and cert-manager (Helm recommended), then apply ingress controller config:

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  -f ingress/ingress-nginx-values.yaml

kubectl apply -f ingress/nginx-security-headers-configmap.yaml
kubectl apply -f ingress/nginx-controller-configmap.yaml
kubectl apply -f ingress/clusterissuer-letsencrypt-prod.yaml
```

3. Create app secrets (edit template first):

```bash
kubectl apply -f secrets/careloop-secrets.template.yaml
```

4. Apply core workloads and ingress:

```bash
kubectl apply -k .
```

## Notes

- Domains in ingress are set to:
  - app.staging.careloop.company.com
  - api.staging.careloop.company.com
- Update secret values and image tags before deploy.
- For production, duplicate manifests with `careloop-prod` namespace and prod domains.
