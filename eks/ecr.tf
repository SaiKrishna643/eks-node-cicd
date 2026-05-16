# ============================================
# ECR Repository for DevPulse
# ============================================

resource "aws_ecr_repository" "devpulse" {
  name                 = "devpulse"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Project     = "devpulse"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# ─── Lifecycle policy: keep last 10 images ───
resource "aws_ecr_lifecycle_policy" "devpulse" {
  repository = aws_ecr_repository.devpulse.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 5 images"
        selection = {
          tagStatus     = "any"
          countType     = "imageCountMoreThan"
          countNumber   = 5
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# ─── Output the repository URL ───
output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.devpulse.repository_url
}

output "ecr_repository_name" {
  description = "ECR repository name"
  value       = aws_ecr_repository.devpulse.name
}
