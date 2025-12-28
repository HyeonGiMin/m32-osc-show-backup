require('dotenv').config();
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const OSCClient = require('./oscClient');
const logger = require('./logger');

// Configuration file path
const CONFIG_PATH = path.join(__dirname, 'config.json');

// Load configuration
function loadConfig() {
    try {
        const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
        const config = JSON.parse(configData);
        
        // Apply .env overrides
        if (process.env.M32_IP) {
            config.m32.ip = process.env.M32_IP;
        }
        if (process.env.M32_PORT) {
            config.m32.port = parseInt(process.env.M32_PORT, 10);
        }
        
        return config;
    } catch (error) {
        console.error('Failed to load config.json:', error.message);
        process.exit(1);
    }
}

// Main function
async function main() {
    logger.info('=== M32 Backup Scheduler ===');
    
    // Load configuration
    const config = loadConfig();
    logger.info(`Loaded configuration from ${CONFIG_PATH}`);
    logger.info(`Target: ${config.m32.ip}:${config.m32.port}`);
    logger.info(
        `Scene backup range: ${config.sceneBackup.slotRange.start}-${config.sceneBackup.slotRange.end}`,
    );
    logger.info(`Schedules: ${config.schedules.length} configured`);
    
    // Initialize OSC Client
    const oscClient = new OSCClient(config.m32.ip, config.m32.port);
    
    try {
        await oscClient.connect();
        
        // Setup cron jobs for enabled schedules
        const enabledSchedules = config.schedules.filter((s) => s.enabled);
        logger.info(`Enabled schedules: ${enabledSchedules.length}`);
        
        enabledSchedules.forEach(schedule => {
            if (!cron.validate(schedule.cron)) {
                logger.error(
                    `✗ ${schedule.name}: Invalid cron expression "${schedule.cron}"`,
                );
                return;
            }
            
            cron.schedule(schedule.cron, async () => {
                logger.info(
                    `[${new Date().toISOString()}] Executing: ${schedule.name}`,
                );
                try {
                    await performBackup(
                        oscClient,
                        config.sceneBackup.slotRange,
                    );
                    logger.info('Backup completed successfully');
                } catch (error) {
                    logger.error({ err: error }, 'Backup failed');
                }
            });
            
            logger.info(`✓ ${schedule.name}: ${schedule.cron}`);
        });
        
        logger.info('Scheduler is running... (Press Ctrl+C to stop)');
        
    } catch (error) {
        logger.error({ err: error }, 'Failed to start scheduler');
        process.exit(1);
    }
}

async function performBackup(oscClient, slotRange) {
    // TODO: Implement backup logic with slot range
    console.log(`Performing backup to slots ${slotRange.start}-${slotRange.end}`);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    logger.info('Shutting down scheduler...');
    process.exit(0);
});

// Start the application
main();
