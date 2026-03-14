#!/usr/bin/env bash

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

workflow_files=()

if [[ "${1:-}" == "--staged" ]]; then
  while IFS= read -r file; do
    workflow_files+=("$file")
  done < <(git diff --cached --name-only --diff-filter=ACMR | rg '^\.github/workflows/.*\.(ya?ml)$' || true)
else
  while IFS= read -r file; do
    workflow_files+=("$file")
  done < <(find .github/workflows -type f \( -name '*.yml' -o -name '*.yaml' \) | sort || true)
fi

if [[ ${#workflow_files[@]} -eq 0 ]]; then
  exit 0
fi

invalid=0

for file in "${workflow_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    continue
  fi

  if rg -n '^\s*if:\s*\$\{\{\s*secrets\.' "$file" >/dev/null; then
    echo "Invalid workflow condition in $file"
    echo "Do not reference secrets directly in an if expression."
    invalid=1
  fi

  if [[ "$file" =~ ^\.github/workflows/.+/.+\.(yml|yaml)$ ]]; then
    echo "Invalid workflow location: $file"
    echo "GitHub Actions only loads workflow files directly under .github/workflows/."
    invalid=1
  fi

  if ! rg -n '^\s*on:' "$file" >/dev/null; then
    echo "Workflow missing top-level 'on:' block: $file"
    invalid=1
  fi

  if ! rg -n '^\s*jobs:' "$file" >/dev/null; then
    echo "Workflow missing top-level 'jobs:' block: $file"
    invalid=1
  fi
done

if [[ $invalid -ne 0 ]]; then
  exit 1
fi
