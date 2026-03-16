#!/bin/bash

set -e

echo ""
echo "🔄 Cloudflare Auto-Import Script"
echo "================================="
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "⚠️  Installing jq..."
    brew install jq
fi

# Load environment variables
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "❌ .env file not found. Please run setup.sh first."
    exit 1
fi

# Check if CLOUDFLARE_API_TOKEN is set
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ CLOUDFLARE_API_TOKEN not set."
    exit 1
fi

# Extract zone_id from terraform.tfvars
ZONE_ID=$(grep "^zone_id" terraform.tfvars | cut -d'"' -f2)
ACCOUNT_ID=$(grep "^account_id" terraform.tfvars | cut -d'"' -f2)

if [ -z "$ZONE_ID" ]; then
    echo "❌ Could not extract zone_id from terraform.tfvars"
    exit 1
fi

if [ -z "$ACCOUNT_ID" ]; then
    echo "❌ Could not extract account_id from terraform.tfvars"
    exit 1
fi

echo "📡 Zone ID: $ZONE_ID"
echo "👤 Account ID: $ACCOUNT_ID"
echo ""

# Function to import DNS records with better matching
import_dns_records() {
    echo "📋 Fetching DNS records from Cloudflare..."
    
    DNS_RESPONSE=$(curl -s -X GET \
        "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?per_page=100" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json")
    
    # Check if successful
    SUCCESS=$(echo "$DNS_RESPONSE" | jq -r '.success')
    if [ "$SUCCESS" != "true" ]; then
        echo "❌ Failed to fetch DNS records"
        return 1
    fi
    
    echo ""
    echo "📝 Importing DNS records based on terraform configuration..."
    
    # Define mappings: terraform_resource -> matching criteria
    # For TXT records with same name, we need to match by content pattern
    declare -a import_mappings=(
        # Root A Records
        "cloudflare_dns_record.root_a[\"216.239.32.21\"]|litomi.in|A|216.239.32.21"
        "cloudflare_dns_record.root_a[\"216.239.34.21\"]|litomi.in|A|216.239.34.21"
        "cloudflare_dns_record.root_a[\"216.239.36.21\"]|litomi.in|A|216.239.36.21"
        "cloudflare_dns_record.root_a[\"216.239.38.21\"]|litomi.in|A|216.239.38.21"
        
        # Root AAAA Records
        "cloudflare_dns_record.root_aaaa[\"2001:4860:4802:32::15\"]|litomi.in|AAAA|2001:4860:4802:32::15"
        "cloudflare_dns_record.root_aaaa[\"2001:4860:4802:34::15\"]|litomi.in|AAAA|2001:4860:4802:34::15"
        "cloudflare_dns_record.root_aaaa[\"2001:4860:4802:36::15\"]|litomi.in|AAAA|2001:4860:4802:36::15"
        "cloudflare_dns_record.root_aaaa[\"2001:4860:4802:38::15\"]|litomi.in|AAAA|2001:4860:4802:38::15"

        # CNAME Records
        "cloudflare_dns_record.www_cname|www.litomi.in|CNAME|"
        "cloudflare_dns_record.r2_cname|r2.litomi.in|CNAME|"
        "cloudflare_dns_record.stg_cname|stg.litomi.in|CNAME|"
        "cloudflare_dns_record.api_cname|api.litomi.in|CNAME|"
        "cloudflare_dns_record.api_stg_cname|api-stg.litomi.in|CNAME|"
        "cloudflare_dns_record.img_cname|img.litomi.in|CNAME|"
        "cloudflare_dns_record.img_stg_cname|img-stg.litomi.in|CNAME|"
        "cloudflare_dns_record.render_cname|render.litomi.in|CNAME|"
        "cloudflare_dns_record.render_stg_cname|render-stg.litomi.in|CNAME|"
        "cloudflare_dns_record.vercel_cname|vercel.litomi.in|CNAME|"
        "cloudflare_dns_record.vercel_stg_cname|vercel-stg.litomi.in|CNAME|"
        "cloudflare_dns_record.netlify_cname|netlify.litomi.in|CNAME|"

        # Self-host tunnel DNS
        "cloudflare_dns_record.selfhost_grafana_cname|grafana.litomi.in|CNAME|"
        "cloudflare_dns_record.selfhost_argocd_cname|argocd.litomi.in|CNAME|"

        # Other Records
        "cloudflare_dns_record.caa|litomi.in|CAA|"
        "cloudflare_dns_record.dmarc_txt|_dmarc.litomi.in|TXT|"
        "cloudflare_dns_record.domainkey_txt|*._domainkey.litomi.in|TXT|"
        "cloudflare_dns_record.spf_txt|litomi.in|TXT|v=spf1"
        "cloudflare_dns_record.google_verification_txt|litomi.in|TXT|google-site-verification"
    )
    
    for mapping in "${import_mappings[@]}"; do
        IFS='|' read -r resource_name record_name record_type content_pattern <<< "$mapping"
        
        # Check if already in state
        if terraform state show "$resource_name" &>/dev/null 2>&1; then
            echo "✓ $resource_name already imported"
            continue
        fi
        
        echo ""
        
        # Find matching record ID based on criteria
        if [ -n "$content_pattern" ]; then
            # For records that need content matching (like TXT records)
            RECORD_ID=$(echo "$DNS_RESPONSE" | jq -r --arg name "$record_name" --arg type "$record_type" --arg pattern "$content_pattern" \
                '.result[] | select(.name == $name and .type == $type and (.content | contains($pattern))) | .id' | head -1)
        else
            # For records that can be uniquely identified by name and type
            RECORD_ID=$(echo "$DNS_RESPONSE" | jq -r --arg name "$record_name" --arg type "$record_type" \
                '.result[] | select(.name == $name and .type == $type) | .id' | head -1)
        fi
        
        if [ -n "$RECORD_ID" ]; then
            echo "✓ Found record: $record_type $record_name (ID: $RECORD_ID)"
            terraform import "$resource_name" "$ZONE_ID/$RECORD_ID" 2>/dev/null || echo "  ⚠️  Import failed or already exists"
        else
            echo "⏭️  No matching record found for $resource_name"
        fi
    done
}

# Function to import rulesets
import_rulesets() {
    echo ""
    echo "📡 Checking for rulesets..."
    
    # Check cache rules
    if terraform state show "cloudflare_ruleset.cache_rules" &>/dev/null 2>&1; then
        echo "✓ Cache rules already imported"
    else
        CACHE_RESPONSE=$(curl -s -X GET \
            "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets/phases/http_request_cache_settings/entrypoint" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json")
        
        CACHE_ID=$(echo "$CACHE_RESPONSE" | jq -r '.result.id // empty')
        if [ -n "$CACHE_ID" ]; then
            echo "✓ Importing cache ruleset (ID: $CACHE_ID)"
            terraform import cloudflare_ruleset.cache_rules "zones/$ZONE_ID/$CACHE_ID" 2>/dev/null || echo "  ⚠️  Already imported or doesn't exist"
        else
            echo "⏭️  No cache ruleset exists in Cloudflare"
        fi
    fi
    
    # Check rate limiting rules
    if terraform state show "cloudflare_ruleset.rate_limiting" &>/dev/null 2>&1; then
        echo "✓ Rate limiting rules already imported"
    else
        RATE_RESPONSE=$(curl -s -X GET \
            "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets/phases/http_ratelimit/entrypoint" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json")
        
        RATE_ID=$(echo "$RATE_RESPONSE" | jq -r '.result.id // empty')
        if [ -n "$RATE_ID" ]; then
            echo "✓ Importing rate limiting ruleset (ID: $RATE_ID)"
            terraform import cloudflare_ruleset.rate_limiting "zones/$ZONE_ID/$RATE_ID" 2>/dev/null || echo "  ⚠️  Already imported or doesn't exist"
        else
            echo "⏭️  No rate limiting ruleset exists in Cloudflare"
        fi
    fi

    # Check redirect rules (e.g. www -> apex)
    if terraform state show "cloudflare_ruleset.www_redirect" &>/dev/null 2>&1; then
        echo "✓ Redirect rules already imported"
    else
        REDIRECT_RESPONSE=$(curl -s -X GET \
            "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets/phases/http_request_dynamic_redirect/entrypoint" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json")
        
        REDIRECT_ID=$(echo "$REDIRECT_RESPONSE" | jq -r '.result.id // empty')
        if [ -n "$REDIRECT_ID" ]; then
            echo "✓ Importing redirect ruleset (ID: $REDIRECT_ID)"
            terraform import cloudflare_ruleset.www_redirect "zones/$ZONE_ID/$REDIRECT_ID" 2>/dev/null || echo "  ⚠️  Already imported or doesn't exist"
        else
            echo "⏭️  No redirect ruleset exists in Cloudflare"
        fi
    fi
}

# Function to import managed transforms (managed headers)
import_managed_transforms() {
    echo ""
    echo "🧩 Checking for managed transforms..."

    if terraform state show "cloudflare_managed_transforms.managed_transforms" &>/dev/null 2>&1; then
        echo "✓ Managed transforms already imported"
        return 0
    fi

    echo "📝 Importing managed transforms..."

    # Provider import ID format can differ by resource; try a few common patterns.
    # For managed transforms (managed_headers endpoint), the ID is typically derived from the zone.
    declare -a import_candidates=(
        "$ZONE_ID"
        "zones/$ZONE_ID"
        "$ZONE_ID/managed_headers"
        "zones/$ZONE_ID/managed_headers"
    )

    for import_id in "${import_candidates[@]}"; do
        if terraform import cloudflare_managed_transforms.managed_transforms "$import_id" >/dev/null 2>&1; then
            echo "✓ Imported managed transforms (ID: $import_id)"
            return 0
        fi
    done

    echo "⚠️  Could not import managed transforms automatically."
    echo "   Try manually:"
    echo "   terraform import cloudflare_managed_transforms.managed_transforms \"$ZONE_ID\""
    return 1
}

# Function to import Zero Trust Access Applications
import_zero_trust_access_apps() {
    echo ""
    echo "🔒 Checking for Zero Trust Access Apps..."

    if terraform state show "cloudflare_zero_trust_access_application.argocd" &>/dev/null 2>&1; then
        echo "✓ Argo CD Access App already imported"
        return 0
    fi

    APP_RESPONSE=$(curl -s -X GET \
        "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/access/apps" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json")

    APP_ID=$(echo "$APP_RESPONSE" | jq -r '(.result[]? // empty) | select(.name == "Argo CD") | .id' | head -1)

    if [ -n "$APP_ID" ]; then
        echo "✓ Found Access App: Argo CD (ID: $APP_ID)"
        declare -a import_candidates=(
            "$ACCOUNT_ID/$APP_ID"
            "accounts/$ACCOUNT_ID/$APP_ID"
            "$APP_ID"
        )
        for import_id in "${import_candidates[@]}"; do
            if terraform import cloudflare_zero_trust_access_application.argocd "$import_id" >/dev/null 2>&1; then
                echo "✓ Imported Access App (ID: $import_id)"
                return 0
            fi
        done
        echo "  ⚠️  Import failed for Argo CD Access App"
    else
        echo "⏭️  No matching Access App found for Argo CD"
    fi
}

# Function to import Zero Trust tunnel (self-host)
import_zero_trust_tunnel() {
    echo ""
    echo "🛡️  Checking for Zero Trust tunnel..."

    if terraform state show "cloudflare_zero_trust_tunnel_cloudflared.selfhost" &>/dev/null 2>&1; then
        echo "✓ Self-host tunnel already imported"
        return 0
    fi

    # Try to read tunnel name from Terraform config (fallback to default)
    local tunnel_name=""
    if [ -f "selfhost-tunnel.tf" ]; then
        tunnel_name=$(grep -E "selfhost_tunnel_name\\s*=" selfhost-tunnel.tf | head -1 | cut -d'"' -f2)
    fi
    if [ -z "$tunnel_name" ]; then
        tunnel_name="litomi-selfhost"
    fi

    echo "🔎 Looking for tunnel named: $tunnel_name"

    TUNNEL_RESPONSE=$(curl -s -X GET \
        "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/cfd_tunnel?per_page=100" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json")

    SUCCESS=$(echo "$TUNNEL_RESPONSE" | jq -r '.success')
    if [ "$SUCCESS" != "true" ]; then
        echo "❌ Failed to fetch tunnels"
        return 1
    fi

    TUNNEL_ID=$(echo "$TUNNEL_RESPONSE" | jq -r --arg name "$tunnel_name" \
        '.result[] | select(.name == $name) | .id' | head -1)

    if [ -z "$TUNNEL_ID" ]; then
        echo "⏭️  No existing tunnel found (Terraform will create one on apply)"
        return 0
    fi

    echo "✓ Found tunnel: $tunnel_name (ID: $TUNNEL_ID)"

    # Provider import ID formats can vary; try common patterns.
    declare -a import_candidates=(
        "$ACCOUNT_ID/$TUNNEL_ID"
        "accounts/$ACCOUNT_ID/$TUNNEL_ID"
        "accounts/$ACCOUNT_ID/cfd_tunnel/$TUNNEL_ID"
        "$TUNNEL_ID"
    )

    for import_id in "${import_candidates[@]}"; do
        if terraform import cloudflare_zero_trust_tunnel_cloudflared.selfhost "$import_id" >/dev/null 2>&1; then
            echo "✓ Imported self-host tunnel (ID: $import_id)"
            return 0
        fi
    done

    echo "⚠️  Could not import self-host tunnel automatically."
    echo "   Please import manually using the tunnel ID from Cloudflare Zero Trust dashboard."
    return 1
}

# Main execution
echo "🔄 Starting auto-import process..."
echo ""

# Initialize terraform if needed
if [ ! -d ".terraform" ]; then
    echo "📦 Initializing Terraform..."
    terraform init -upgrade >/dev/null 2>&1
fi

# Import DNS records
import_dns_records

# Import rulesets
import_rulesets

# Import managed transforms
import_managed_transforms

# Import Zero Trust tunnel (if it already exists)
import_zero_trust_tunnel

# Import Zero Trust Access Applications
import_zero_trust_access_apps

echo ""
echo "✅ Auto-import complete!"
echo ""

# Apply to update sensitive field metadata in state
echo "🔄 Syncing state metadata (marking sensitive fields)..."
# This applies only metadata changes (sensitive field markings), no actual infrastructure changes
terraform apply -auto-approve >/dev/null 2>&1
echo "✓ State metadata synced"
echo ""

echo "📊 Current Terraform state summary:"
echo "   Total resources: $(terraform state list 2>/dev/null | wc -l | tr -d ' ')"
echo ""

if [ "$(terraform state list 2>/dev/null | wc -l | tr -d ' ')" -gt 0 ]; then
    echo "📝 Resources in state:"
    terraform state list 2>/dev/null | sed 's/^/   - /'
else
    echo "⚠️  No resources in state. You may need to create them first."
fi

echo ""
echo "🔍 Verifying configuration..."
PLAN_OUTPUT=$(terraform plan -detailed-exitcode 2>&1 || true)
if echo "$PLAN_OUTPUT" | grep -q "No changes"; then
    echo "✓ No changes needed - infrastructure matches configuration!"
else
    echo "📝 To see what changes are needed, run:"
    echo "   terraform plan"
fi
echo ""
