# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains Node.js tools for automating backups of **Behringer M32/X32 audio mixing consoles** via OSC (Open Sound Control) over UDP. The console must be on the same LAN as the machine running these scripts.

## Subprojects

Each subdirectory is an independent Node.js project with its own `package.json` and `node_modules`. Run `npm install` inside each before running.

| Directory | Purpose |
|---|---|
| `m32-show-backup/` | One-shot script: saves current state as a named Show, rotates old ones |
| `m32-scene-backup/` | One-shot script: saves to a Scene slot (80–99), rotating via `scene-index.json` |
| `m32-osc-command/` | Interactive CLI REPL for sending arbitrary OSC commands to the console |
| `m32-backup-scheduler/` | Cron-based scheduler that wraps OSC backup operations |
| `mockup-server/` | Local UDP server that simulates M32 responses for testing without hardware |

## Running Each Tool

```bash
# Show backup (one-shot)
cd m32-show-backup && node backup.js

# Scene backup (one-shot)
cd m32-scene-backup && node backup.js

# Interactive OSC command sender
cd m32-osc-command && node send.js

# Scheduler (long-running daemon)
cd m32-backup-scheduler && node index.js
# or: npm start

# Mock server (for local testing without M32 hardware)
cd mockup-server && node server.js

# Test oscMessages API (no hardware needed)
cd m32-backup-scheduler && node test.js
```

## Configuration

**Environment variables** (apply to all scripts):
- `M32_IP` — console IP address (default varies by script, typically `192.168.0.96` or `192.168.0.2`)
- `M32_PORT` — OSC UDP port (default: `10023`)

**`m32-show-backup/backup.js`** also reads:
- `MAX_SHOWS` — max Show slots to retain (default: `10`)
- `SHOW_PREFIX` — name prefix for auto-saved Shows (default: `auto_weekly_`)

**`m32-backup-scheduler/config.json`** — primary config for the scheduler:
- `m32.ip`, `m32.port` — console target
- `sceneBackup.slotRange` — Scene slot range (default: 80–99)
- `schedules[]` — array of `{ name, enabled, cron }` entries

The scheduler also supports a `.env` file (`dotenv`) to override `M32_IP` and `M32_PORT`.

## Architecture

### OSC Communication Pattern
All scripts use the `osc` npm package with `UDPPort`. The pattern is:
1. Create `UDPPort` with `localPort: 0` (ephemeral) and `metadata: true`
2. Wait for `"ready"` event before sending
3. Send messages via `udpPort.send({ address, args }, M32_IP, M32_PORT)`
4. OSC args use typed objects: `{ type: "s"|"i"|"f", value: ... }`

### Show vs Scene backup distinction
- **Show** backup (`/save/show`, `/delete/show`): Saves the full showfile by name. The M32 does not expose a Show list via OSC, so `shows.json` tracks names locally.
- **Scene** backup (`/save` with `"scene"` arg + slot index): Saves to a numbered slot (0–99). `scene-index.json` tracks the current slot and wraps around within the configured range.

### `m32-backup-scheduler` structure
- `index.js` — entry point; loads `config.json`, initializes `OSCClient`, sets up `node-cron` jobs
- `oscClient.js` — `OSCClient` class wrapping `osc.UDPPort`; exposes `connect()`, `sendMessage()`, `backupScene()`, `backupShow()`
- `oscMessages.js` — comprehensive M32/X32 OSC address constants and message builder helpers (reference: unofficial X32 OSC protocol PDF)
- `logger.js` — `pino`-based structured logger
- `test.js` — standalone test harness for `oscMessages.js` (no network needed)

### Console reachability check
`m32-scene-backup/backup.js` sends `/info` and waits up to 2 seconds for a response before proceeding. This prevents silent failures when the console is offline.

## Key Constraints
- The M32 **does not support querying the Show list** via OSC — `shows.json` is the source of truth for auto-backup Show names.
- Scene slots 0–79 are reserved for manual use; auto-backup uses slots 80–99 by default.
- Do not load Shows during a live performance (`/show/showfile/load` resets the console state).
- The `osc` library requires Node.js LTS or later.
