#!/bin/bash
# filepath: /home/thorsten/Development/rhajaina_requirements/run-use-cases.sh

echo "🎯 Starting Rhajaina Use Case Generation..."
echo "📂 Checking for docs folder..."

if [ ! -d "./docs" ]; then
    echo "❌ Error: ./docs folder not found!"
    echo "Please ensure all requirements are copied to the ./docs folder"
    exit 1
fi

echo "✅ Found docs folder"
echo "📄 Requirements files found:"
ls -la ./docs/*.md

echo ""
echo "🚀 Starting use case generation..."
node kaiban-use-cases.config.js

echo ""
echo "📋 Use case generation completed!"
echo "📁 Results saved in ./outputs/use-cases/"