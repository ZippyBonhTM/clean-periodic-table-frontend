#!/usr/bin/env sh
set -eu

DOCKERHUB_USER="${1:-}"
TAG="${2:-latest}"
IMAGE_NAME="clean-periodic-table-frontend"

if [ -z "$DOCKERHUB_USER" ]; then
  echo "Usage: sh ./scripts/docker/publish.sh <dockerhub-user> [tag]"
  exit 1
fi

IMAGE="$DOCKERHUB_USER/$IMAGE_NAME"

echo "Building $IMAGE:$TAG"
DOCKER_BUILDKIT="${DOCKER_BUILDKIT:-0}" docker build \
  --build-arg NEXT_PUBLIC_AUTH_API_URL="${NEXT_PUBLIC_AUTH_API_URL:-http://localhost:3002}" \
  --build-arg NEXT_PUBLIC_BACKEND_API_URL="${NEXT_PUBLIC_BACKEND_API_URL:-http://localhost:3001}" \
  -t "$IMAGE:$TAG" \
  -t "$IMAGE:latest" \
  .

echo "Pushing $IMAGE:$TAG"
docker push "$IMAGE:$TAG"

echo "Pushing $IMAGE:latest"
docker push "$IMAGE:latest"

echo "Published images:"
echo "- $IMAGE:$TAG"
echo "- $IMAGE:latest"
