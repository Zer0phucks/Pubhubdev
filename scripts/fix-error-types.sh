#!/bin/bash

# Script to systematically fix error: any types across components
# Usage: bash scripts/fix-error-types.sh

echo "Fixing error: any types in components..."

# Find all files with 'catch (error: any)' or 'catch (err: any)'
files=$(grep -rl "catch (error: any)\|catch (err: any)" src/components/*.tsx 2>/dev/null)

count=0
for file in $files; do
  # Check if AppError import exists
  if ! grep -q "import.*AppError.*from.*types" "$file"; then
    echo "Processing: $file (adding AppError import)"
    # This would need manual verification - just report
    echo "  ⚠️  Needs manual AppError import"
  else
    echo "✓ $file already has AppError import"
  fi
  ((count++))
done

echo "Found $count files with error: any patterns"
echo "Next steps: Update each catch block to use: const appError = error as AppError"
