"""
Simple keep-alive HTTP server and optional self-pinger for Replit.

Usage (in your entrypoint, e.g. main.py):
  from utils.keep_alive import start_keepalive
  start_keepalive()

Environment variables:
  KEEP_ALIVE            -> if 'true'/'1', starts the HTTP server (default: false)
  KEEPALIVE_PORT        -> port for the HTTP server (default: 8080)
  KEEPALIVE_URL         -> full URL to ping periodically (e.g. https://your-repl-url)
  KEEPALIVE_INTERVAL_S  -> seconds between pings (default: 240)

Notes:
  - Replit free tiers usually require external pings (e.g., UptimeRobot) to prevent sleep.
    Self-pinging may not always prevent sleep, but it's provided as an option.
  - This module uses only Python stdlib (no extra dependencies).
"""

from __future__ import annotations

import os
import threading
import time
import socket
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib import request as urllib_request
from urllib.error import URLError, HTTPError


class _HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):  # noqa: N802 (http.server naming)
        if self.path in ("/", "/health", "/ping"):
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write(b"OK")
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format: str, *args):  # silence default logging
        return


def _run_http_server(host: str, port: int):
    httpd = HTTPServer((host, port), _HealthHandler)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()


def _infer_replit_url() -> str | None:
    # Try common Replit env vars; fall back to None
    # Newer Replit deployments may set RENDER_EXTERNAL_URL-like variables, but not guaranteed.
    for key in ("REPLIT_APP_URL", "REPLIT_URL", "REPL_URL"):
        url = os.environ.get(key)
        if url:
            return url

    slug = os.environ.get("REPL_SLUG")
    owner = os.environ.get("REPL_OWNER")
    if slug and owner:
        return f"https://{slug}.{owner}.repl.co"

    return None


def _self_ping_loop(url: str, interval_s: int):
    while True:
        try:
            req = urllib_request.Request(url, method="GET")
            with urllib_request.urlopen(req, timeout=10) as resp:
                # Consume response to keep connection clean
                _ = resp.read(16)
        except (URLError, HTTPError, socket.timeout) as e:
            # Avoid noisy logs; print a brief note occasionally
            print(f"[keep-alive] Ping failed: {e}")
        except Exception as e:  # noqa: BLE001
            print(f"[keep-alive] Unexpected ping error: {e}")
        time.sleep(max(30, interval_s))


def start_keepalive():
    """Start the keep-alive HTTP server and optional self-pinger if configured.

    Behavior is controlled by environment variables (see module docstring).
    Safe to call multiple times; subsequent calls no-op.
    """
    # Idempotence guard
    if getattr(start_keepalive, "_started", False):
        return

    host = "0.0.0.0"
    # Prefer Replit-provided PORT, fall back to custom var or 8080
    port = int(os.environ.get("PORT") or os.environ.get("KEEPALIVE_PORT", "8080"))
    enable_server = os.environ.get("KEEP_ALIVE", "false").lower() in {"1", "true", "yes", "on"}

    if enable_server:
        t = threading.Thread(target=_run_http_server, args=(host, port), daemon=True)
        t.start()
        print(f"[keep-alive] HTTP server running on {host}:{port}")

    # Optional self-ping
    ping_url = os.environ.get("KEEPALIVE_URL") or _infer_replit_url()
    interval_s = int(os.environ.get("KEEPALIVE_INTERVAL_S", "240"))

    if ping_url:
        t2 = threading.Thread(target=_self_ping_loop, args=(ping_url, interval_s), daemon=True)
        t2.start()
        print(f"[keep-alive] Self-pinging {ping_url} every {interval_s}s")
    else:
        print("[keep-alive] No KEEPALIVE_URL found; self-ping disabled")

    start_keepalive._started = True  # type: ignore[attr-defined]
