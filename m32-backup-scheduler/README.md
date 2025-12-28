# M32 Backup Scheduler

Schedule and automate M32/X32 console backups via OSC protocol.

## Installation

```bash
npm install
```

## Configuration

Edit `config.json`:

### M32 Connection

```json
"m32": {
  "ip": "192.168.0.2",
  "port": 10023
}
```

### Scene Backup Range

```json
"sceneBackup": {
  "slotRange": {
    "start": 80,
    "end": 99
  }
}
```

### Schedules (Cron)

```json
"schedules": [
  {
    "name": "Daily Backup",
    "enabled": true,
    "cron": "0 2 * * *"
  }
]
```

## Cron Expression Format

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, 0 and 7 = Sunday)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

### Examples

| Expression       | Description                                    |
| ---------------- | ---------------------------------------------- |
| `0 2 * * *`      | Every day at 2:00 AM                           |
| `0 * * * *`      | Every hour                                     |
| `0 */6 * * *`    | Every 6 hours                                  |
| `30 14 * * *`    | Every day at 2:30 PM                           |
| `0 0 * * 0`      | Every Sunday at midnight                       |
| `0 0 1 * *`      | First day of every month                       |
| `*/15 * * * *`   | Every 15 minutes                               |
| `0 9-17 * * 1-5` | Every hour from 9 AM to 5 PM, Monday to Friday |

### Special Characters

-   `*` : Any value
-   `,` : Value list separator (e.g., `1,3,5`)
-   `-` : Range of values (e.g., `1-5`)
-   `/` : Step values (e.g., `*/10`)

## Usage

```bash
npm start
```

## Features

-   Cron-based automatic backup scheduling
-   Configurable scene slot range (default: 80-99)
-   OSC communication with M32/X32 console
-   Multiple schedule support

## Dependencies

-   `osc`: OSC protocol implementation for Node.js
-   `node-cron`: Cron job scheduler
-   `pino` + `pino-pretty`: Fast structured logging (pretty in dev)
-   `node-cron`: Cron job scheduler

## License

MIT
