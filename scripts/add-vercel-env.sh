#!/bin/bash

# Add Supabase environment variables to Vercel

echo "Adding Supabase environment variables to Vercel..."

# Supabase
echo "https://ykzckfwdvmzuzxhezthv.supabase.co" | vercel env add VITE_SUPABASE_URL production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlremNrZndkdm16dXp4aGV6dGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MTM2OTIsImV4cCI6MjA3Njk4OTY5Mn0.UoI8-lcWPepwOJz0nML-70f3MnxseCwB_AMedHLoVZE" | vercel env add VITE_SUPABASE_ANON_KEY production

echo "Environment variables added. Deploying..."
vercel deploy --prod

echo "Done!"