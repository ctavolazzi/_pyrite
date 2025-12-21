#!/bin/bash
# Run cursor-coding-protocols test suite

CCP_DIR="/Users/ctavolazzi/Code/cursor-coding-protocols"

echo "🧪 cursor-coding-protocols Test Runner"
echo "========================================"
echo ""

cd "$CCP_DIR" || { echo "❌ Cannot access cursor-coding-protocols"; exit 1; }

if [ "$1" = "update" ] || [ "$1" = "" ]; then
    echo "📦 Running Update System Tests..."
    node tests/update-system.test.js
fi

if [ "$1" = "security" ] || [ "$1" = "all" ]; then
    echo ""
    echo "🔒 Running Security Tests..."
    node tests/version-manager-security.test.js
fi

if [ "$1" = "work-efforts" ] || [ "$1" = "all" ]; then
    echo ""
    echo "📋 Running Work Efforts Tests..."
    node tests/work-efforts-server.test.js
fi

if [ "$1" = "all" ]; then
    echo ""
    echo "📝 Running All Version Manager Tests..."
    for test in tests/version-manager*.test.js; do
        echo "  → $test"
        node "$test" 2>&1 | tail -5
    done
fi

echo ""
echo "✅ Test run complete"
