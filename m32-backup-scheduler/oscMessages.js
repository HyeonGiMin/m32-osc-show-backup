/**
 * M32/X32 OSC Message Definitions (Comprehensive)
 * Reference: https://wiki.munichmakerlab.de/images/1/17/UNOFFICIAL_X32_OSC_REMOTE_PROTOCOL_%281%29.pdf
 *
 * All common OSC addresses and helper functions for Behringer M32/X32 console
 *
 * OSC Protocol Data Types:
 * - string: Null-terminated, padded to multiple of 4 bytes with \0
 * - enum(integer): Int corresponding to element in a list of strings
 *   Can be sent as either string or integer
 * - int(integer): Signed 32-bit int, [min, max], step size = 1
 * - linf(float): Float [min, max, step], linear scale, range 0.0-1.0
 * - logf(float): Float [min, max, steps], log scale, range 0.0-1.0
 * - level(float): Float with 4 linear dB ranges
 * - bitmap(%int): Int with bitwise OR of multiple bits
 *
 * Format Rules:
 * - All data is big-endian, 4-byte aligned/padded with null bytes
 * - Float parameters: 0.0-1.0 range (big-endian 32-bit)
 * - Boolean maps to {OFF, ON} or {0, 1}
 * - /xremote timeout: 10 seconds (must renew)
 * - Discrete values only (rounds to nearest known value)
 */

// ============================================================================
// 1. GLOBAL / SYSTEM
// ============================================================================

const SYSTEM = {
    INFO: "/info",
    XINFO: "/xinfo",
    STATUS: "/status",
    XREMOTE: "/xremote",
    RENEW: "/renew",
};

// ============================================================================
// 2. CHANNEL (Input) - /ch/{01-32}
// ============================================================================

const CHANNEL_CONFIG = {
    NAME: "/ch/{ch}/config/name",
    ICON: "/ch/{ch}/config/icon",
    COLOR: "/ch/{ch}/config/color",
};

const CHANNEL_PREAMP = {
    TRIM: "/ch/{ch}/preamp/trim",
    INVERT: "/ch/{ch}/preamp/invert",
    HPON: "/ch/{ch}/preamp/hpon",
    HPF: "/ch/{ch}/preamp/hpf",
};

const CHANNEL_GATE = {
    ON: "/ch/{ch}/gate/on",
    MODE: "/ch/{ch}/gate/mode",
    THRESHOLD: "/ch/{ch}/gate/thr",
    RANGE: "/ch/{ch}/gate/range",
    ATTACK: "/ch/{ch}/gate/attack",
    HOLD: "/ch/{ch}/gate/hold",
    RELEASE: "/ch/{ch}/gate/release",
    KEYSRC: "/ch/{ch}/gate/keysrc",
};

const CHANNEL_DYN = {
    ON: "/ch/{ch}/dyn/on",
    MODE: "/ch/{ch}/dyn/mode",
    THRESHOLD: "/ch/{ch}/dyn/thr",
    RATIO: "/ch/{ch}/dyn/ratio",
    KNEE: "/ch/{ch}/dyn/knee",
    ATTACK: "/ch/{ch}/dyn/attack",
    HOLD: "/ch/{ch}/dyn/hold",
    RELEASE: "/ch/{ch}/dyn/release",
    MAKEUP: "/ch/{ch}/dyn/makeup",
    KEYSRC: "/ch/{ch}/dyn/keysrc",
};

const CHANNEL_EQ = {
    ON: "/ch/{ch}/eq/on",
    // 4-band EQ (1-4)
    BAND_TYPE: "/ch/{ch}/eq/{band}/type",
    BAND_FREQ: "/ch/{ch}/eq/{band}/f",
    BAND_GAIN: "/ch/{ch}/eq/{band}/g",
    BAND_Q: "/ch/{ch}/eq/{band}/q",
};

const CHANNEL_MIX = {
    ON: "/ch/{ch}/mix/on",
    FADER: "/ch/{ch}/mix/fader",
    PAN: "/ch/{ch}/mix/pan",
    MUTE: "/ch/{ch}/mix/mute",
};

const CHANNEL_SENDS = {
    // Bus sends: /ch/{ch}/mix/{bus}/on|level|pan
    ON: "/ch/{ch}/mix/{bus}/on",
    LEVEL: "/ch/{ch}/mix/{bus}/level",
    PAN: "/ch/{ch}/mix/{bus}/pan",
    TAP: "/ch/{ch}/mix/{bus}/tap",
};

// ============================================================================
// 3. BUS - /bus/{01-16}
// ============================================================================

const BUS_CONFIG = {
    NAME: "/bus/{bus}/config/name",
    COLOR: "/bus/{bus}/config/color",
};

const BUS_EQ_DYN = {
    EQ_ON: "/bus/{bus}/eq/on",
    DYN_ON: "/bus/{bus}/dyn/on",
};

const BUS_MIX = {
    ON: "/bus/{bus}/mix/on",
    FADER: "/bus/{bus}/mix/fader",
    PAN: "/bus/{bus}/mix/pan",
};

// ============================================================================
// 4. FX - /fx/{1-8}
// ============================================================================

const FX_SLOT = {
    TYPE: "/fx/{fx}/type",
    ON: "/fx/{fx}/on",
};

const FX_PARAMS = {
    // /fx/{fx}/par/{01-16}
    BASE: "/fx/{fx}/par/{par}",
};

const FX_RETURN = {
    FADER: "/fxrtn/{fx}/mix/fader",
    MUTE: "/fxrtn/{fx}/mix/mute",
};

// ============================================================================
// 5. MATRIX - /mtx/{01-06}
// ============================================================================

const MATRIX = {
    ON: "/mtx/{mtx}/mix/on",
    FADER: "/mtx/{mtx}/mix/fader",
    PAN: "/mtx/{mtx}/mix/pan",
};

// ============================================================================
// 6. MAIN (Stereo / Mono)
// ============================================================================

const MAIN_STEREO = {
    FADER: "/main/st/mix/fader",
    PAN: "/main/st/mix/pan",
    ON: "/main/st/mix/on",
};

const MAIN_MONO = {
    FADER: "/main/m/mix/fader",
    ON: "/main/m/mix/on",
};

// ============================================================================
// 7. DCA - /dca/{01-08}
// ============================================================================

const DCA = {
    ON: "/dca/{dca}/on",
    FADER: "/dca/{dca}/fader",
};

// ============================================================================
// 8. AUX IN - /auxin/{01-08}
// ============================================================================

const AUXIN = {
    FADER: "/auxin/{aux}/mix/fader",
    PAN: "/auxin/{aux}/mix/pan",
    ON: "/auxin/{aux}/mix/on",
};

// ============================================================================
// 9. OUTPUT ROUTING - /output/{01-16}
// ============================================================================

const OUTPUT = {
    SOURCE: "/output/{out}/src",
    DELAY: "/output/{out}/delay",
    INVERT: "/output/{out}/invert",
};

// ============================================================================
// 10. HEADAMP
// ============================================================================

const HEADAMP = {
    GAIN: "/headamp/{i}/gain",
    PHANTOM: "/headamp/{i}/phantom",
    INVERT: "/headamp/{i}/invert",
};

// ============================================================================
// 11. METERING & MONITORING
// ============================================================================

const METERS = {
    REQUEST: "/meters",
};

const STATUS_PATHS = {
    SOLO_SWITCH: "/-stat/solosw/{ch}",
    SOLO: "/-stat/solo",
};

// ============================================================================
// 12. SCENE & SNIPPET
// ============================================================================

const SCENE = {
    LOAD: "/-snap/load",
    SAVE: "/-snap/save",
    NAME: "/-snap/name",
    INDEX: "/-snap/index",
};

const SNIPPET = {
    // Similar structure to SCENE
};

// ============================================================================
// 13. NODE & ADVANCED
// ============================================================================

const NODE = {
    GET: "/node",
    SET: "/",
};

const SUBSCRIBE = {
    BASIC: "/subscribe",
    FORMAT: "/formatsubscribe",
    BATCH: "/batchsubscribe",
};

// ============================================================================
// HELPER FUNCTIONS - Path Templating
// ============================================================================

/**
 * Replace placeholders in OSC path
 * @param {string} path - Path with placeholders (e.g., /ch/{ch}/mix/fader)
 * @param {object} vars - Variables to replace (e.g., { ch: "01" })
 * @returns {string} Resolved path
 */
function resolvePath(path, vars = {}) {
    let resolved = path;
    for (const [key, value] of Object.entries(vars)) {
        const placeholder = new RegExp(`\\{${key}\\}`, "g");
        resolved = resolved.replace(placeholder, value);
    }
    return resolved;
}

/**
 * Format channel number (1 -> "01")
 * @param {number} ch - Channel number (1-32)
 * @returns {string} Formatted channel ("01"-"32")
 */
function formatChannel(ch) {
    return ch.toString().padStart(2, "0");
}

/**
 * Format bus number (1 -> "01")
 * @param {number} bus - Bus number (1-16)
 * @returns {string} Formatted bus ("01"-"16")
 */
function formatBus(bus) {
    return bus.toString().padStart(2, "0");
}

/**
 * Format index (1 -> "01")
 * @param {number} index - Index number
 * @returns {string} Formatted index
 */
function formatIndex(index) {
    return index.toString().padStart(2, "0");
}

// ============================================================================
// HELPER FUNCTIONS - Message Creation
// ============================================================================

/**
 * Create generic OSC message
 * @param {string} address - OSC address
 * @param {string} type - Type: 's' (string), 'i' (int), 'f' (float)
 * @param {*} value - Value
 * @returns {object} OSC message
 */
function createMessage(address, type, value) {
    return {
        address: address,
        args: [{ type: type, value: value }],
    };
}

/**
 * Create OSC message with no arguments
 * @param {string} address - OSC address
 * @returns {object} OSC message
 */
function createEmptyMessage(address) {
    return {
        address: address,
        args: [],
    };
}

// ============================================================================
// HELPER FUNCTIONS - System
// ============================================================================

/**
 * Request console info
 * @returns {object} OSC message
 */
function getInfo() {
    return createEmptyMessage(SYSTEM.INFO);
}

/**
 * Request extended console info (firmware, IP, model)
 * @returns {object} OSC message
 */
function getXInfo() {
    return createEmptyMessage(SYSTEM.XINFO);
}

/**
 * Request console status
 * @returns {object} OSC message
 */
function getStatus() {
    return createEmptyMessage(SYSTEM.STATUS);
}

/**
 * Send xremote (keepalive, 10s timeout)
 * @returns {object} OSC message
 */
function xremote() {
    return createEmptyMessage(SYSTEM.XREMOTE);
}

/**
 * Renew data request
 * @param {string} dataPath - Path to renew
 * @returns {object} OSC message
 */
function renew(dataPath) {
    return createMessage(SYSTEM.RENEW, "s", dataPath);
}

// ============================================================================
// HELPER FUNCTIONS - Scene/Show
// ============================================================================

/**
 * Load scene from slot
 * @param {number} slot - Slot number (0-99)
 * @returns {object} OSC message
 */
function loadScene(slot) {
    return createMessage(SCENE.LOAD, "i", slot);
}

/**
 * Save scene to slot
 * @param {number} slot - Slot number (0-99)
 * @returns {object} OSC message
 */
function saveScene(slot) {
    return createMessage(SCENE.SAVE, "i", slot);
}

/**
 * Load show from slot
 * @param {number} slot - Slot number
 * @returns {object} OSC message
 */
function loadShow(slot) {
    return createMessage("/-show/showfile/load", "i", slot);
}

/**
 * Save show to slot
 * @param {number} slot - Slot number
 * @returns {object} OSC message
 */
function saveShow(slot) {
    return createMessage("/-show/showfile/save", "i", slot);
}

// ============================================================================
// HELPER FUNCTIONS - Channel
// ============================================================================

/**
 * Set channel fader (0.0-1.0)
 * @param {number} ch - Channel (1-32)
 * @param {number} level - Level (0.0-1.0)
 * @returns {object} OSC message
 */
function setChannelFader(ch, level) {
    const path = resolvePath(CHANNEL_MIX.FADER, { ch: formatChannel(ch) });
    return createMessage(path, "f", level);
}

/**
 * Get channel fader
 * @param {number} ch - Channel (1-32)
 * @returns {object} OSC message
 */
function getChannelFader(ch) {
    const path = resolvePath(CHANNEL_MIX.FADER, { ch: formatChannel(ch) });
    return createEmptyMessage(path);
}

/**
 * Set channel on/off
 * @param {number} ch - Channel (1-32)
 * @param {boolean} on - True/false
 * @returns {object} OSC message
 */
function setChannelOn(ch, on) {
    const path = resolvePath(CHANNEL_MIX.ON, { ch: formatChannel(ch) });
    return createMessage(path, "i", on ? 1 : 0);
}

/**
 * Set channel pan (-1.0 to +1.0, or 0.0-1.0)
 * @param {number} ch - Channel (1-32)
 * @param {number} pan - Pan value (0.0=left, 0.5=center, 1.0=right)
 * @returns {object} OSC message
 */
function setChannelPan(ch, pan) {
    const path = resolvePath(CHANNEL_MIX.PAN, { ch: formatChannel(ch) });
    return createMessage(path, "f", pan);
}

/**
 * Set channel mute
 * @param {number} ch - Channel (1-32)
 * @param {boolean} mute - True/false
 * @returns {object} OSC message
 */
function setChannelMute(ch, mute) {
    const path = resolvePath(CHANNEL_MIX.MUTE, { ch: formatChannel(ch) });
    return createMessage(path, "i", mute ? 1 : 0);
}

/**
 * Set channel trim (preamp)
 * @param {number} ch - Channel (1-32)
 * @param {number} trim - Trim value in dB (-18.0 to +18.0 mapped to 0.0-1.0)
 * @returns {object} OSC message
 */
function setChannelTrim(ch, trim) {
    // Trim is typically linf (-18, +18, 0.04), map dB to 0.0-1.0
    const level = (trim + 18) / 36; // -18..+18 -> 0..1
    const path = resolvePath(CHANNEL_PREAMP.TRIM, { ch: formatChannel(ch) });
    return createMessage(path, "f", Math.max(0, Math.min(1, level)));
}

/**
 * Subscribe to channel parameter changes
 * @param {number} ch - Channel (1-32)
 * @param {string} param - Parameter (e.g., "mix/fader")
 * @param {number} [frequency] - Update frequency
 * @returns {object} OSC message
 */
function subscribeToChannel(ch, param, frequency) {
    const path = `/ch/${formatChannel(ch)}/${param}`;
    const args = [{ type: "s", value: path }];
    if (frequency !== undefined) {
        args.push({ type: "i", value: frequency });
    }
    return {
        address: SUBSCRIBE.BASIC,
        args: args,
    };
}

// ============================================================================
// HELPER FUNCTIONS - Bus
// ============================================================================

/**
 * Set bus fader
 * @param {number} bus - Bus (1-16)
 * @param {number} level - Level (0.0-1.0)
 * @returns {object} OSC message
 */
function setBusFader(bus, level) {
    const path = resolvePath(BUS_MIX.FADER, { bus: formatBus(bus) });
    return createMessage(path, "f", level);
}

/**
 * Set bus on/off
 * @param {number} bus - Bus (1-16)
 * @param {boolean} on - True/false
 * @returns {object} OSC message
 */
function setBusOn(bus, on) {
    const path = resolvePath(BUS_MIX.ON, { bus: formatBus(bus) });
    return createMessage(path, "i", on ? 1 : 0);
}

// ============================================================================
// HELPER FUNCTIONS - Level Conversion
// ============================================================================

/**
 * Convert dB to level (0.0-1.0) using X32/M32 curve
 * @param {number} db - dB value (-90 to +10, -Infinity for mute)
 * @returns {number} Level (0.0-1.0)
 */
function dbToLevel(db) {
    if (db <= -90 || db === -Infinity) return 0.0;
    if (db >= 10) return 1.0;

    if (db >= -10) {
        return 0.5 + ((db + 10) / 20) * 0.5;
    } else if (db >= -30) {
        return 0.25 + ((db + 30) / 20) * 0.25;
    } else if (db >= -60) {
        return 0.0625 + ((db + 60) / 30) * 0.1875;
    } else {
        return ((db + 90) / 30) * 0.0625;
    }
}

/**
 * Convert level (0.0-1.0) to dB using X32/M32 curve
 * @param {number} level - Level (0.0-1.0)
 * @returns {number} dB value (-90 to +10, -Infinity if 0)
 */
function levelToDb(level) {
    if (level <= 0) return -Infinity;
    if (level >= 1.0) return 10.0;

    if (level >= 0.5) {
        return -10 + ((level - 0.5) / 0.5) * 20;
    } else if (level >= 0.25) {
        return -30 + ((level - 0.25) / 0.25) * 20;
    } else if (level >= 0.0625) {
        return -60 + ((level - 0.0625) / 0.1875) * 30;
    } else {
        return -90 + (level / 0.0625) * 30;
    }
}

/**
 * Set channel fader in dB
 * @param {number} ch - Channel (1-32)
 * @param {number} db - dB value (-90 to +10)
 * @returns {object} OSC message
 */
function setChannelFaderDb(ch, db) {
    return setChannelFader(ch, dbToLevel(db));
}

/**
 * Set bus fader in dB
 * @param {number} bus - Bus (1-16)
 * @param {number} db - dB value (-90 to +10)
 * @returns {object} OSC message
 */
function setBusFaderDb(bus, db) {
    return setBusFader(bus, dbToLevel(db));
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Constants - All OSC paths grouped by category
    SYSTEM,
    CHANNEL_CONFIG,
    CHANNEL_PREAMP,
    CHANNEL_GATE,
    CHANNEL_DYN,
    CHANNEL_EQ,
    CHANNEL_MIX,
    CHANNEL_SENDS,
    BUS_CONFIG,
    BUS_EQ_DYN,
    BUS_MIX,
    FX_SLOT,
    FX_PARAMS,
    FX_RETURN,
    MATRIX,
    MAIN_STEREO,
    MAIN_MONO,
    DCA,
    AUXIN,
    OUTPUT,
    HEADAMP,
    METERS,
    STATUS_PATHS,
    SCENE,
    SNIPPET,
    NODE,
    SUBSCRIBE,

    // Path helpers
    resolvePath,
    formatChannel,
    formatBus,
    formatIndex,

    // Message creation
    createMessage,
    createEmptyMessage,

    // System functions
    getInfo,
    getXInfo,
    getStatus,
    xremote,
    renew,

    // Scene/Show functions
    loadScene,
    saveScene,
    loadShow,
    saveShow,

    // Channel functions
    setChannelFader,
    getChannelFader,
    setChannelOn,
    setChannelPan,
    setChannelMute,
    setChannelTrim,
    subscribeToChannel,

    // Bus functions
    setBusFader,
    setBusOn,

    // Level conversion
    dbToLevel,
    levelToDb,
    setChannelFaderDb,
    setBusFaderDb,
};
