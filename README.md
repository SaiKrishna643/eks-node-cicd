# ⚡ DevPulse — Deploy Node.js App on AWS EKS with CI/CD

A microservices health dashboard deployed on Amazon EKS with automated CI/CD using GitHub Actions.

**Repository:** [github.com/SaiKrishna643/eks-node-cicd](https://github.com/SaiKrishna643/eks-node-cicd)

## Tech Stack

| Layer | Technologies |
|-------|----------------|
| App | Node.js 20, Express, vanilla HTML/CSS/JS |
| Container | Docker (multi-stage, Alpine, non-root) |
| Orchestration | Amazon EKS, kubectl, HPA (2→5 pods) |
| Networking | AWS NLB (LoadBalancer Service) |
| Registry | Amazon ECR |
| IaC | Terraform (VPC, EKS, ECR, IAM) |
| CI/CD | GitHub Actions (PR tests + deploy on merge) |

## Demo

After deploy, open the NLB URL in a browser (`kubectl get svc -n devpulse`).


## Architecture

```
Developer → Feature Branch → PR (tests run) → Merge to Main
                                                    │
                                            GitHub Actions
                                       ┌────────────┼───────────┐
                                       │            │           │
                                     Test      Build/Push    Deploy
                                                    │           │
                                                  ECR ───→ EKS Cluster
                                                            │
                                                     ┌──────┼──────┐
                                                     │      │      │
                                                   Pod1   Pod2   HPA
                                                     │      │
                                                     └──┬───┘
                                                        │
                                                  Service (NLB)
                                                        │
                                                    Internet
                                                        │
                                               ┌────────┼────────┐
                                               │                 │
                                          Dashboard UI       REST API
                                           (Browser)      (curl/Postman)
```

## What It Does

DevPulse monitors microservice health with a live dashboard:

- **Dashboard UI** at `/` — dark-themed status board with colored health indicators
- **REST API** at `/api/services` — full CRUD for service management
- **Auto-refresh** — dashboard updates every 10 seconds
- **Pod display** — shows which Kubernetes pod served each request (load balancing demo)

## Project Structure

```
├── app/
│   ├── server.js              # Express API + static file server
│   ├── public/
│   │   └── index.html         # Dashboard UI (single file, no frameworks)
│   ├── test.js                # API tests
│   ├── package.json
│   ├── Dockerfile             # Multi-stage, Alpine, non-root
│   └── .dockerignore
├── eks/                       # EKS cluster + ECR (Terraform)
│   └── *.tf
├── k8s/
│   ├── namespace.yaml
│   ├── deployment.yaml        # Rolling updates, probes, resource limits
│   ├── service.yaml           # LoadBalancer (NLB)
│   └── hpa.yaml               # Autoscale 2→5 pods (CPU 70%)
└── .github/workflows/
    ├── pr-test.yml            # Runs on Pull Requests (tests + Docker build check)
    └── deploy.yml             # Runs on merge/push to main (test → build → deploy)
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Dashboard UI |
| GET | `/health` | Kubernetes liveness probe |
| GET | `/ready` | Kubernetes readiness probe |
| GET | `/api/info` | App info + pod name |
| GET | `/api/services` | List all services + stats |
| GET | `/api/services/:id` | Get single service |
| POST | `/api/services` | Add a service |
| PUT | `/api/services/:id` | Update service |
| DELETE | `/api/services/:id` | Remove service |

## CI/CD Pipeline

Two workflows — test before merge, deploy after merge:

```
Feature Branch → Push → Create PR
                          │
                   ┌──────┴──────┐
                   │  pr-test    │  ← Tests + Docker build check
                   └──────┬──────┘
                          │ ✅ Green check
                          │
                    Merge to main  (or direct push to main)
                          │
                   ┌──────┴──────┐
                   │  deploy     │  ← Test → Build → Push ECR → Deploy EKS
                   └─────────────┘
```

Default deploy targets (see `.github/workflows/deploy.yml`):

| Setting | Value |
|---------|--------|
| AWS region | `us-east-1` |
| EKS cluster | `eks-demo` |
| Namespace | `devpulse` |
| ECR repo | `devpulse` |

## Prerequisites

- AWS CLI configured (`aws configure`)
- Terraform >= 1.5
- `kubectl` installed
- Docker installed (local testing optional; CI builds in Actions)
- GitHub repository secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

## Quick Start

```bash
# 1. Clone
git clone https://github.com/SaiKrishna643/eks-node-cicd.git
cd eks-node-cicd

# 2. Create EKS cluster + ECR (first time only; ~15–20 min)
cd eks && terraform init && terraform apply
cd ..

# 3. Configure kubectl for the cluster
aws eks update-kubeconfig --name eks-demo --region us-east-1

# 4. Add GitHub Secrets: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

# 5. Push to main to trigger first deploy
git push origin main

# 6. Ship a feature
git checkout -b feature/my-change
# make changes...
git add . && git commit -m "feat: my change"
git push origin feature/my-change
# Create PR on GitHub → tests run → merge → auto deploys

# 7. Get your app URL
kubectl get svc -n devpulse
# Use EXTERNAL-IP (NLB hostname) — open http://<EXTERNAL-IP>/ in a browser
```

## Teardown (avoid AWS charges)

When you are done experimenting, remove workloads first, then destroy infrastructure.

```bash
# 1. Delete Kubernetes resources (optional if destroying cluster)
kubectl delete namespace devpulse --ignore-not-found

# 2. Destroy EKS, VPC, and related resources
cd eks
terraform destroy

# 3. Clean up ECR images (Terraform may remove the repo; delete leftover images if needed)
aws ecr list-images --repository-name devpulse --region us-east-1
# aws ecr batch-delete-image --repository-name devpulse --region us-east-1 --image-ids ...
```

**Cost reminder:** EKS control plane, EC2 worker nodes, NLB, and NAT (if used) incur charges while running. Run `terraform destroy` when you are not actively using the lab.

## Resume / portfolio bullets

Use these as starting points on your CV or LinkedIn:

- Built a Node.js microservice health dashboard on **Amazon EKS** with **Docker**, **ECR**, and **Terraform** (VPC + cluster).
- Implemented **GitHub Actions** CI/CD: PR tests, image build/push, and automated rollout to EKS with **HPA** and **NLB** exposure.
- Designed Kubernetes manifests with health probes, resource limits, rolling updates, and horizontal autoscaling (2–5 pods).
