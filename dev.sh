#!/usr/bin/env bash
# Start/stop helper for local NeoIP development.
# The app no longer runs as an always-on systemd service - use this
# script to spin it up only while you're actually working on it.
set -euo pipefail

cd "$(dirname "$0")"

PID_FILE=".dev.pid"
LOG_FILE=".dev.log"

start() {
  if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "NeoIP dev server already running (PID $(cat "$PID_FILE"))."
    exit 0
  fi
  nohup npm run dev >"$LOG_FILE" 2>&1 &
  echo $! >"$PID_FILE"
  sleep 1
  echo "NeoIP dev server started (PID $(cat "$PID_FILE")). Logs: $LOG_FILE"
  echo "http://localhost:3000"
}

stop() {
  if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    kill "$(cat "$PID_FILE")"
    rm -f "$PID_FILE"
    echo "NeoIP dev server stopped."
  else
    echo "NeoIP dev server is not running."
    rm -f "$PID_FILE"
  fi
}

status() {
  if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "running (PID $(cat "$PID_FILE"))"
  else
    echo "stopped"
  fi
}

case "${1:-}" in
  start) start ;;
  stop) stop ;;
  restart) stop; start ;;
  status) status ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac
