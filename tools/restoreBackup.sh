#!/bin/bash

# Restore script for database backups from GitHub Actions artifacts
# Usage: ./tools/restoreBackup.sh [backup_file.dump.gpg] [target_database_url]

set -e

echo "========================================="
echo "Database Backup Restore Tool"
echo "========================================="

# Check if required tools are installed
check_requirements() {
    local missing_tools=()
    
    if ! command -v gpg &> /dev/null; then
        missing_tools+=("gpg")
    fi
    
    if ! command -v docker &> /dev/null && ! command -v pg_restore &> /dev/null; then
        missing_tools+=("docker or postgresql-client")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        echo "❌ Missing required tools: ${missing_tools[*]}"
        echo "Please install them before running this script."
        exit 1
    fi
}

# Function to download artifact from GitHub
download_artifact() {
    echo ""
    echo "📦 To download artifacts from GitHub Actions:"
    echo "1. Go to: https://github.com/ridi25/litomi/actions"
    echo "2. Click on the latest 'Database Backup' workflow run"
    echo "3. Download the artifact (e.g., litomi-backup-YYYYMMDD-HHMM)"
    echo "4. Extract the downloaded ZIP file"
    echo ""
    read -p "Press Enter when you have the backup file ready..."
}

# Main restore process
main() {
    check_requirements
    
    # Get backup file path
    if [ -z "$1" ]; then
        echo ""
        echo "📁 Please provide the path to the encrypted backup file"
        echo "Example: ./tools/restoreBackup.sh ~/Downloads/litomi-20251002-0127.dump.gpg"
        exit 1
    fi
    
    ENCRYPTED_FILE="$1"
    
    if [ ! -f "$ENCRYPTED_FILE" ]; then
        download_artifact
        read -p "Enter the path to the encrypted backup file (.dump.gpg): " ENCRYPTED_FILE
        
        if [ ! -f "$ENCRYPTED_FILE" ]; then
            echo "❌ File not found: $ENCRYPTED_FILE"
            exit 1
        fi
    fi
    
    # Get target database URL
    if [ -z "$2" ]; then
        echo ""
        echo "🔗 Enter your local PostgreSQL database URL"
        echo "Format: postgresql://username:password@localhost:5432/database_name"
        read -sp "Database URL: " DATABASE_URL
        echo ""
    else
        DATABASE_URL="$2"
    fi
    
    # Get encryption key
    echo ""
    echo "🔐 Enter the backup encryption key (BACKUP_ENCRYPTION_KEY)"
    read -sp "Encryption key: " BACKUP_ENCRYPTION_KEY
    echo ""
    
    # Create temporary directory
    TEMP_DIR=$(mktemp -d)
    DECRYPTED_FILE="${TEMP_DIR}/backup.dump"
    
    # Verify checksum if available
    CHECKSUM_FILE="${ENCRYPTED_FILE}.sha256"
    if [ -f "$CHECKSUM_FILE" ]; then
        echo ""
        echo "🔍 Verifying checksum..."
        BACKUP_DIR=$(dirname "$ENCRYPTED_FILE")
        BACKUP_FILENAME=$(basename "$ENCRYPTED_FILE")
        if (cd "$BACKUP_DIR" && sha256sum -c "${BACKUP_FILENAME}.sha256" 2>/dev/null); then
            echo "✅ Checksum verified"
        else
            echo "⚠️  Checksum verification failed"
            read -p "Continue anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                rm -rf "$TEMP_DIR"
                exit 1
            fi
        fi
    else
        echo "⚠️  No checksum file found, skipping verification"
    fi
    
    # Decrypt the backup
    echo ""
    echo "🔓 Decrypting backup..."
    gpg --batch --yes \
        --passphrase="$BACKUP_ENCRYPTION_KEY" \
        --decrypt \
        --output "$DECRYPTED_FILE" \
        "$ENCRYPTED_FILE"
    
    if [ $? -ne 0 ]; then
        echo "❌ Decryption failed. Please check your encryption key."
        rm -rf "$TEMP_DIR"
        exit 1
    fi
    echo "✅ Backup decrypted successfully"
    
    # Restore the database
    echo ""
    echo "🔄 Restoring database..."
    echo "⚠️  WARNING: This will overwrite data in the target database!"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Restore cancelled"
        rm -rf "$TEMP_DIR"
        exit 1
    fi
    
    # Create database if it doesn't exist (extract database name from URL)
    DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:\/]*\).*/\1/p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\).*/\1/p')
    
    echo ""
    echo "Creating database if it doesn't exist: $DB_NAME"
    PGPASSWORD=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\).*/\1/p') \
        psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
    
    # Restore with --disable-triggers to handle circular foreign keys
    # Filter out expected Supabase extension errors for cleaner output
    pg_restore \
        --dbname="$DATABASE_URL" \
        --clean \
        --if-exists \
        --no-owner \
        --no-privileges \
        --disable-triggers \
        "$DECRYPTED_FILE" 2>&1 | \
    grep -v -E "(pg_cron|pgsodium|supabase_vault|cron\.|pgsodium\.|vault\.)" | \
    grep -v "extension.*is not available" || true
    
    RESTORE_EXIT_CODE=$?
    
    # pg_restore returns exit code 1 when there are warnings but data was restored
    if [ $RESTORE_EXIT_CODE -eq 0 ] || [ $RESTORE_EXIT_CODE -eq 1 ]; then
      TABLE_COUNT=$(PGPASSWORD=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\).*/\1/p') \
        psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
      
      if [ "$TABLE_COUNT" -gt 0 ]; then
        echo "✅ Database restored successfully!"
        echo ""
        echo "ℹ️  Note: Errors about missing extensions (pg_cron, pgsodium, supabase_vault) are EXPECTED"
        echo "ℹ️  Note: The --disable-triggers flag was used to handle circular foreign key constraints."
      else
        echo "⚠️  Restore completed with warnings. Please verify your data."
      fi
    else
      echo "❌ Restore failed. Please check the error messages above."
      echo ""
      echo "Common issues:"
      echo "- Ensure PostgreSQL is running locally"
      echo "- Check database connection credentials"
      echo "- Verify the target database exists or can be created"
    fi
    
    # Cleanup
    echo ""
    echo "🧹 Cleaning up temporary files..."
    rm -rf "$TEMP_DIR"
    
    echo ""
    echo "========================================="
    echo "Restore process completed"
    echo "========================================="
}

# Run the main function
main "$@"
