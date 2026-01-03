const pino = require("pino");
const fs = require("fs");
const path = require("path");

const isDev = process.env.NODE_ENV !== "production";

// Load log level from config.json
let logLevel = isDev ? "debug" : "info";
try {
    const configPath = path.join(__dirname, "config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (config.logging && config.logging.level) {
        logLevel = config.logging.level;
    }
} catch (err) {
    // Fallback to default if config can't be read
}

const logger = pino({
    level: logLevel,
    base: undefined, // avoid pid/hostname clutter
    timestamp: pino.stdTimeFunctions.isoTime,
    transport: isDev
        ? {
              target: "pino-pretty",
              options: {
                  translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
                  colorize: true,
                  ignore: "pid,hostname",
              },
          }
        : undefined,
});

module.exports = logger;
