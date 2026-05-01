#!/bin/bash

echo "🚀 កំពុងចាប់ផ្ដើម Deploy Backend (Django)..."

# ១. ទាញយកកូដថ្មី
git pull origin main

# ២. បើកដំណើរការ Virtual Environment
source venv/bin/activate

# ៣. Update Libraries
pip install -r requirements.txt

# ៤. Update Database Schema
echo "🗄️  កំពុង Migrate Database..."
python manage.py migrate

# ៥. ប្រមូល Static Files
python manage.py collectstatic --noinput

# ៦. Restart Gunicorn តាមរយៈ PM2
echo "🔄 កំពុង Restart PM2..."
pm2 restart all # ឬឈ្មោះ service backend របស់អ្នក

echo "✅ Backend Deploy រួចរាល់ដោយជោគជ័យ!"