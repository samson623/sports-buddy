#!/bin/bash

# Get first game from database
GAME_ID=$(curl -s -X POST "https://znildkucbbehfydowzvr.supabase.co/rest/v1/rpc/read_games" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuaWxka3VjYmJlaGZ5ZG93enZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4Njc2MzQsImV4cCI6MjA3NjQ0MzYzNH0._uxdLUZQjWYd_bFatyaQWfdjE13t7Pb_TVCCeTxLjxQ" \
  -H "Content-Type: application/json" \
  -d '{}' | jq -r '.[0].id')

if [ -z "$GAME_ID" ]; then
  echo "❌ No games found. Run: npm run seed"
  exit 1
fi

echo "🧪 Testing with game: $GAME_ID"
curl -X POST http://localhost:3000/api/generate-analysis \
  -H "Content-Type: application/json" \
  -d "{"gameId": "$GAME_ID"}"
