#!/bin/bash

echo "🚀 កំពុងចាប់ផ្ដើម Deploy Frontend (Next.js)..."

# ១. ទាញយកកូដថ្មីពី GitHub
git pull origin main

# ២. ដំឡើង Library ថ្មីៗ (បើមាន)
bun install

# ៣. Build គម្រោងឡើងវិញ (ជំហានសំខាន់បំផុត)
echo "🏗️  កំពុង Build កូដ..."
bun run build

# ៤. Restart Service ក្នុង PM2
echo "🔄 កំពុង Restart PM2..."
pm2 restart our-novel-frontend

echo "✅ Frontend Deploy រួចរាល់ដោយជោគជ័យ!"