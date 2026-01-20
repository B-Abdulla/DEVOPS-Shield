#!/bin/bash
# Health Check Script for Railway Deployment
# Run this after deployment to verify the service is running

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the Railway URL from command line or use localhost
RAILWAY_URL="${1:-http://localhost:8080}"

echo -e "${YELLOW}=== DevOps Shield Health Check ===${NC}\n"

# Function to check endpoint
check_endpoint() {
    local endpoint=$1
    local description=$2
    
    echo -n "Checking $description... "
    
    response=$(curl -s -w "\n%{http_code}" "$RAILWAY_URL$endpoint" || echo "000")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED (HTTP $http_code)${NC}"
        return 1
    fi
}

# Run health checks
echo "Target: $RAILWAY_URL"
echo ""

FAILED=0

# Check root endpoint
if check_endpoint "/" "Root endpoint"; then
    echo "$body" | jq . 2>/dev/null || echo "$body"
else
    FAILED=$((FAILED + 1))
fi
echo ""

# Check health endpoint
if check_endpoint "/health" "Health endpoint"; then
    echo "$body" | jq . 2>/dev/null || echo "$body"
else
    FAILED=$((FAILED + 1))
fi
echo ""

# Check metrics endpoint
if check_endpoint "/metrics" "Metrics endpoint"; then
    echo "Metrics available"
else
    FAILED=$((FAILED + 1))
fi
echo ""

# Check API docs
if check_endpoint "/docs" "API Documentation"; then
    echo "API docs available"
else
    FAILED=$((FAILED + 1))
fi
echo ""

# Summary
echo -e "${YELLOW}=== Summary ===${NC}"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All checks passed!${NC}"
    echo ""
    echo "Your DevOps Shield API is running successfully! 🚀"
    echo ""
    echo "Available endpoints:"
    echo "  - API Docs: $RAILWAY_URL/docs"
    echo "  - Health: $RAILWAY_URL/health"
    echo "  - Metrics: $RAILWAY_URL/metrics"
    exit 0
else
    echo -e "${RED}$FAILED check(s) failed${NC}"
    echo ""
    echo "Please check Railway logs for errors:"
    echo "  railway logs"
    exit 1
fi
