#!/bin/sh
# Shared checks for the pre-commit and commit-msg hooks.
# Enable once per clone: git config core.hooksPath .githooks
# Clone-local patterns (never committed): .git/info/private-patterns, one extended regex per line.

GIT_DIR_PATH=$(git rev-parse --git-dir)
PATTERNS_FILE="$GIT_DIR_PATH/info/private-patterns"

# Credential-shaped strings.
CRED_RE='AIza[0-9A-Za-z_-]{35}|mongodb(\+srv)?://[^:/@[:space:]]+:[^@<[:space:]]+@|-----BEGIN [A-Z ]*PRIVATE KEY-----(\\{1,2}n)?([A-Za-z0-9+/=]{20,}|$)|gsk_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{30,}|xox[baprs]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}|eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.|(token|bearer|secret|api[_-]?key|app[_-]?key|password|passwd)["'\'' :=]{1,6}[A-Za-z0-9+/_.-]{20,}'

# Addresses allowed in committed text: example domains, the owner's own, noreply.
EMAIL_RE='[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
EMAIL_OK='@example\.(com|org|net)$|@test-project\.iam\.gserviceaccount\.com$|^tamara\.sovcik@gmail\.com$|^tamara@sovcik\.net$|noreply'

# check_text <label> <file> : prints problems found in <file>, returns 1 if any.
check_text() {
  label=$1; file=$2; bad=0
  hits=$(grep -E -i -o "$CRED_RE" "$file" | cut -c1-8 | sed 's/$/.../' | sort -u | tr '\n' ' ')
  if [ -n "$hits" ]; then echo "[privacy] $label: credential-shaped string: $hits" >&2; bad=1; fi
  emails=$(grep -E -o "$EMAIL_RE" "$file" | grep -E -v -i "$EMAIL_OK" | sort -u | tr '\n' ' ')
  if [ -n "$emails" ]; then echo "[privacy] $label: email outside example domains: $emails" >&2; bad=1; fi
  if [ -f "$PATTERNS_FILE" ]; then
    pats="$GIT_DIR_PATH/privacy-patterns.tmp"
    grep -v -E '^[[:space:]]*(#|$)' "$PATTERNS_FILE" > "$pats"
    if [ -s "$pats" ]; then
      priv=$(grep -E -i -o -f "$pats" "$file"); rc=$?
      priv=$(printf '%s' "$priv" | sort -u | tr '\n' ' ')
      if [ $rc -gt 1 ]; then echo "[privacy] $label: .git/info/private-patterns has an invalid pattern (fix it; failing closed)" >&2; bad=1
      elif [ -n "$priv" ]; then echo "[privacy] $label: matches .git/info/private-patterns: $priv" >&2; bad=1; fi
    fi
    rm -f "$pats"
  fi
  return $bad
}
