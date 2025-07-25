#!/bin/bash

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "\n${BLUE}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

# Header
echo -e "\n${BOLD}${PURPLE}🧪 E2E Test Runner with Docker PostgreSQL${NC}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Start Docker PostgreSQL
print_step "Starting PostgreSQL test database..."
if docker compose -f ./e2e/docker-compose.test.yml up -d; then
    print_success "PostgreSQL container started successfully"
else
    print_error "Failed to start PostgreSQL container"
    exit 1
fi

# Wait for PostgreSQL to be ready
print_step "Waiting for PostgreSQL to be ready..."
RETRIES=10
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $RETRIES ]; do
    if docker compose -f ./e2e/docker-compose.test.yml exec -T litomi pg_isready -U e2e_test_user -d e2e_test_db >/dev/null 2>&1; then
        print_success "PostgreSQL is ready!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $RETRIES ]; then
        print_error "PostgreSQL failed to start after $RETRIES attempts"
        docker compose -f ./e2e/docker-compose.test.yml down -v
        exit 1
    fi
    echo -ne "  ${YELLOW}Attempt $RETRY_COUNT/$RETRIES${NC} - Waiting...\r"
    sleep 1
done

# Load environment variables from .env files if they exist
print_step "Loading environment variables..."
ENV_LOADED=false

if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs) 2>/dev/null
    print_success "Loaded .env.local"
    ENV_LOADED=true
fi

if [ -f .env.test.local ]; then
    export $(cat .env.test.local | grep -v '^#' | xargs) 2>/dev/null
    print_success "Loaded .env.test.local"
    ENV_LOADED=true
fi

# Set the test database URL (this will override any existing POSTGRES_URL)
export POSTGRES_URL="postgresql://e2e_test_user:e2e_test_password@localhost:5433/e2e_test_db"
export POSTGRES_URL_NON_POOLING="postgresql://e2e_test_user:e2e_test_password@localhost:5433/e2e_test_db"
print_success "Test database URL configured"

# Initialize database schema
print_step "Initializing database schema..."
if bunx drizzle-kit push; then
    print_success "Database schema initialized successfully"
else
    print_error "Failed to initialize database schema"
    docker compose -f ./e2e/docker-compose.test.yml down -v
    exit 1
fi

# Display test information
print_step "Test Configuration"
echo -e "  ${CYAN}Database:${NC} ${BOLD}e2e_test_db${NC}"
echo -e "  ${CYAN}Port:${NC} ${BOLD}5433${NC}"
echo -e "  ${CYAN}User:${NC} ${BOLD}e2e_test_user${NC}"

# Check if specific test files were provided
if [ $# -gt 0 ]; then
    echo -e "  ${CYAN}Test files:${NC} ${BOLD}$@${NC}"
else
    echo -e "  ${CYAN}Test files:${NC} ${BOLD}All tests${NC}"
fi

echo -e "\n${PURPLE}────────────────────────────────────────────${NC}"
print_step "Running e2e tests..."

bun test:e2e "$@"
TEST_EXIT_CODE=$?

echo -e "${PURPLE}────────────────────────────────────────────${NC}"

# Always clean up Docker containers
print_step "Cleaning up..."
if docker compose -f ./e2e/docker-compose.test.yml down -v; then
    print_success "PostgreSQL container stopped and removed"
else
    print_warning "Failed to stop PostgreSQL container cleanly"
fi

# Final status
echo -e "\n${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${BOLD}${GREEN}✅ E2E tests completed successfully!${NC}\n"
else
    echo -e "${BOLD}${RED}❌ E2E tests failed with exit code: $TEST_EXIT_CODE${NC}\n"
fi

# Exit with the same code as the tests
exit $TEST_EXIT_CODE 