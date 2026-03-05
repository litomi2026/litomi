#!/usr/bin/env bash
# shellcheck shell=bash

init_runtime() {
  if [[ "$(id -u)" -eq 0 ]]; then
    SUDO_ARR=()
  else
    SUDO_ARR=(sudo)
  fi

  if [[ ${#SUDO_ARR[@]} -eq 0 ]]; then
    DEFAULT_KUBECTL_CMD="kubectl"
  else
    DEFAULT_KUBECTL_CMD="sudo kubectl"
  fi

  if [[ -z "$KUBECTL_CMD" ]]; then
    KUBECTL_CMD="$DEFAULT_KUBECTL_CMD"
  fi
  read -r -a KUBECTL_ARR <<< "${KUBECTL_CMD}"

  init_ui
}

init_ui() {
  UI_WIDTH="${UI_WIDTH:-80}"
  local ui_width_max=80
  UI_USE_COLOR="false"

  if [[ -t 1 ]]; then
    if [[ -z "${NO_COLOR:-}" ]]; then
      UI_USE_COLOR="true"
    fi
    if command -v tput >/dev/null 2>&1; then
      local cols
      cols="$(tput cols 2>/dev/null || true)"
      if [[ "$cols" =~ ^[0-9]+$ ]] && (( cols >= 60 )); then
        UI_WIDTH="$cols"
      fi
    fi
  fi

  if [[ "$UI_WIDTH" =~ ^[0-9]+$ ]] && (( UI_WIDTH > ui_width_max )); then
    UI_WIDTH="$ui_width_max"
  fi

  if [[ "$UI_USE_COLOR" == "true" ]]; then
    C_RESET=$'\033[0m'
    C_BOLD=$'\033[1m'
    C_DIM=$'\033[2m'
    C_BLUE=$'\033[34m'
    C_CYAN=$'\033[36m'
    C_GREEN=$'\033[32m'
    C_YELLOW=$'\033[33m'
    C_RED=$'\033[31m'
  else
    C_RESET=""
    C_BOLD=""
    C_DIM=""
    C_BLUE=""
    C_CYAN=""
    C_GREEN=""
    C_YELLOW=""
    C_RED=""
  fi
}

hr() {
  local char="${1:--}"
  printf '%*s\n' "$UI_WIDTH" '' | tr ' ' "$char"
}

log() {
  printf '%s[%s]%s %s\n' "$C_DIM" "$(date '+%H:%M:%S')" "$C_RESET" "$*"
}

step() {
  printf '\n'
  hr "="
  printf '%s[STEP ]%s %s\n' "${C_BOLD}${C_CYAN}" "$C_RESET" "$*"
  hr "="
}

ok() {
  OK_COUNT=$((OK_COUNT + 1))
  printf '%s[ OK  ]%s %s\n' "$C_GREEN" "$C_RESET" "$*"
}

warn() {
  WARN_COUNT=$((WARN_COUNT + 1))
  printf '%s[WARN ]%s %s\n' "$C_YELLOW" "$C_RESET" "$*"
}

elapsed_seconds() {
  echo $(( $(date +%s) - SCRIPT_START_EPOCH ))
}

format_elapsed() {
  local seconds="${1:-0}"
  printf '%02dm%02ds' "$((seconds / 60))" "$((seconds % 60))"
}

print_summary() {
  local status="$1"
  local detail="${2:-}"
  local color="$C_GREEN"
  local elapsed

  if [[ "$status" == "FAIL" ]]; then
    color="$C_RED"
  fi

  elapsed="$(format_elapsed "$(elapsed_seconds)")"

  printf '\n'
  hr "="
  printf '%s[RESULT]%s %s | ok=%d warn=%d | elapsed=%s\n' \
    "${C_BOLD}${color}" "$C_RESET" "$status" "$OK_COUNT" "$WARN_COUNT" "$elapsed"
  if [[ -n "$detail" ]]; then
    printf '         %s\n' "$detail"
  fi
  hr "="
}

die() {
  printf '%s[FAIL ]%s %s\n' "$C_RED" "$C_RESET" "$*" >&2
  print_summary "FAIL" "$*" >&2
  exit 1
}

run() {
  printf '%s[CMD  ]%s %s\n' "$C_BLUE" "$C_RESET" "$*"
  if ! "$@"; then
    die "command failed: $*"
  fi
}

run_quiet_or_return() {
  local output_file
  local rc

  output_file="$(mktemp)"
  if "$@" >"$output_file" 2>&1; then
    rm -f "$output_file"
    return 0
  else
    # Capture the wrapped command status here. Outside this if-block, $? is the
    # exit status of the if compound command (often 0), which can mask failures.
    rc=$?
  fi
  if [[ -s "$output_file" ]]; then
    cat "$output_file" >&2
  fi
  rm -f "$output_file"
  return "$rc"
}

run_quiet() {
  if run_quiet_or_return "$@"; then
    return 0
  fi
  printf '%s[CMD! ]%s %s\n' "$C_RED" "$C_RESET" "$*" >&2
  die "command failed: $*"
}

run_root() {
  if [[ ${#SUDO_ARR[@]} -eq 0 ]]; then
    run "$@"
  else
    run "${SUDO_ARR[@]}" "$@"
  fi
}

run_root_quiet() {
  if [[ ${#SUDO_ARR[@]} -eq 0 ]]; then
    run_quiet "$@"
  else
    run_quiet "${SUDO_ARR[@]}" "$@"
  fi
}

run_root_quiet_or_return() {
  if [[ ${#SUDO_ARR[@]} -eq 0 ]]; then
    run_quiet_or_return "$@"
  else
    run_quiet_or_return "${SUDO_ARR[@]}" "$@"
  fi
}

k() {
  "${KUBECTL_ARR[@]}" "$@"
}

k_quiet_or_return() {
  run_quiet_or_return "${KUBECTL_ARR[@]}" "$@"
}

k_quiet() {
  run_quiet "${KUBECTL_ARR[@]}" "$@"
}

as_positive_int_or_default() {
  local value="$1"
  local fallback="$2"
  if [[ "$value" =~ ^[0-9]+$ ]] && (( value > 0 )); then
    printf '%s' "$value"
    return
  fi
  printf '%s' "$fallback"
}

trim() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
}

assert_file_exists() {
  local path="$1"
  [[ -f "$path" ]] || die "missing file: ${path}"
}

assert_command_exists() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || die "missing command: ${cmd}"
}

should_emit_wait_log() {
  local waited="${1:-0}"
  local every

  every="$(as_positive_int_or_default "$WAIT_PROGRESS_EVERY_SECONDS" "30")"
  (( waited % every == 0 ))
}

wait_until() {
  local timeout_seconds="$1"
  local label="$2"
  local check_fn="$3"
  shift 3

  local waited=0
  while (( waited < timeout_seconds )); do
    if "$check_fn" "$@"; then
      return 0
    fi
    if should_emit_wait_log "$waited"; then
      log "waiting for ${label} (${waited}s/${timeout_seconds}s)"
    fi
    sleep "$CHECK_INTERVAL_SECONDS"
    waited=$((waited + CHECK_INTERVAL_SECONDS))
  done
  return 1
}
