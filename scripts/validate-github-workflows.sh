#!/usr/bin/env bash

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

has_rg=0
if command -v rg >/dev/null 2>&1; then
  has_rg=1
fi

list_staged_workflows() {
  if [[ $has_rg -eq 1 ]]; then
    git diff --cached --name-only --diff-filter=ACMR | rg '^\.github/workflows/.*\.(ya?ml)$' || true
  else
    git diff --cached --name-only --diff-filter=ACMR | grep -E '^\.github/workflows/.*\.(ya?ml)$' || true
  fi
}

find_pattern() {
  local pattern="$1"
  local file="$2"

  if [[ $has_rg -eq 1 ]]; then
    rg -n "$pattern" "$file" >/dev/null
  else
    grep -En "$pattern" "$file" >/dev/null
  fi
}

workflow_files=()

if [[ "${1:-}" == "--staged" ]]; then
  while IFS= read -r file; do
    workflow_files+=("$file")
  done < <(list_staged_workflows)
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

  if find_pattern '^[[:space:]]*if:[[:space:]]*\$\{\{[[:space:]]*secrets\.' "$file"; then
    echo "Invalid workflow condition in $file"
    echo "Do not reference secrets directly in an if expression."
    invalid=1
  fi

  if [[ "$file" =~ ^\.github/workflows/.+/.+\.(yml|yaml)$ ]]; then
    echo "Invalid workflow location: $file"
    echo "GitHub Actions only loads workflow files directly under .github/workflows/."
    invalid=1
  fi

  if ! find_pattern '^[[:space:]]*on:' "$file"; then
    echo "Workflow missing top-level 'on:' block: $file"
    invalid=1
  fi

  if ! find_pattern '^[[:space:]]*jobs:' "$file"; then
    echo "Workflow missing top-level 'jobs:' block: $file"
    invalid=1
  fi
done

if [[ $invalid -ne 0 ]]; then
  exit 1
fi
