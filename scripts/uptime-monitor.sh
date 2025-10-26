#!/bin/bash

# PubHub Uptime Monitoring Script
# This script can be used with cron jobs or external monitoring services

# Configuration
APP_URL="${APP_URL:-https://your-app.vercel.app}"
HEALTH_ENDPOINT="/api/health"
TIMEOUT=10
LOG_FILE="/var/log/pubhub-uptime.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to check uptime
check_uptime() {
    local url="$1"
    local endpoint="$2"
    local full_url="${url}${endpoint}"
    
    log "Checking uptime for: $full_url"
    
    # Check if the endpoint is reachable
    if curl -s --max-time "$TIMEOUT" -f "$full_url" > /dev/null 2>&1; then
        log "${GREEN}✅ Uptime check passed${NC}"
        return 0
    else
        log "${RED}❌ Uptime check failed${NC}"
        return 1
    fi
}

# Function to check response time
check_response_time() {
    local url="$1"
    local endpoint="$2"
    local full_url="${url}${endpoint}"
    
    local response_time=$(curl -s --max-time "$TIMEOUT" -w "%{time_total}" -o /dev/null "$full_url")
    
    if [ $? -eq 0 ]; then
        log "Response time: ${response_time}s"
        
        # Alert if response time is too high
        if (( $(echo "$response_time > 3.0" | bc -l) )); then
            log "${YELLOW}⚠️  High response time detected: ${response_time}s${NC}"
        fi
        
        return 0
    else
        log "${RED}❌ Response time check failed${NC}"
        return 1
    fi
}

# Function to check SSL certificate
check_ssl() {
    local url="$1"
    local domain=$(echo "$url" | sed 's|https\?://||' | sed 's|/.*||')
    
    local ssl_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        log "SSL certificate is valid"
        return 0
    else
        log "${RED}❌ SSL certificate check failed${NC}"
        return 1
    fi
}

# Main monitoring function
monitor() {
    log "Starting PubHub uptime monitoring..."
    
    local overall_status=0
    
    # Check uptime
    if ! check_uptime "$APP_URL" "$HEALTH_ENDPOINT"; then
        overall_status=1
    fi
    
    # Check response time
    if ! check_response_time "$APP_URL" "$HEALTH_ENDPOINT"; then
        overall_status=1
    fi
    
    # Check SSL (only for HTTPS)
    if [[ "$APP_URL" == https* ]]; then
        if ! check_ssl "$APP_URL"; then
            overall_status=1
        fi
    fi
    
    # Overall status
    if [ $overall_status -eq 0 ]; then
        log "${GREEN}✅ All checks passed${NC}"
    else
        log "${RED}❌ Some checks failed${NC}"
    fi
    
    return $overall_status
}

# Function to send alert (customize based on your notification method)
send_alert() {
    local message="$1"
    
    # Example: Send to Slack webhook
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 PubHub Alert: $message\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
    
    # Example: Send email
    if [ -n "$ALERT_EMAIL" ]; then
        echo "$message" | mail -s "PubHub Uptime Alert" "$ALERT_EMAIL"
    fi
    
    log "Alert sent: $message"
}

# Function to run continuous monitoring
continuous_monitor() {
    local interval="${1:-300}" # Default 5 minutes
    
    log "Starting continuous monitoring (interval: ${interval}s)"
    
    while true; do
        if ! monitor; then
            send_alert "PubHub is experiencing issues. Check the logs for details."
        fi
        
        sleep "$interval"
    done
}

# Function to show help
show_help() {
    echo "PubHub Uptime Monitoring Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -u, --url URL          App URL to monitor (default: https://your-app.vercel.app)"
    echo "  -e, --endpoint PATH    Health check endpoint (default: /api/health)"
    echo "  -t, --timeout SECONDS Request timeout (default: 10)"
    echo "  -c, --continuous SEC  Run continuously with interval in seconds"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  APP_URL               App URL to monitor"
    echo "  SLACK_WEBHOOK_URL     Slack webhook for alerts"
    echo "  ALERT_EMAIL           Email address for alerts"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Single check"
    echo "  $0 -u https://myapp.vercel.app       # Check specific URL"
    echo "  $0 -c 300                            # Check every 5 minutes"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--url)
            APP_URL="$2"
            shift 2
            ;;
        -e|--endpoint)
            HEALTH_ENDPOINT="$2"
            shift 2
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        -c|--continuous)
            continuous_monitor "$2"
            exit $?
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run single check if no continuous mode
monitor
exit $?
