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

const FX_SOURCE = {
    // Only FX 1-4 support L/R source selection
    L: "/fx/{fx}/source/l",
    R: "/fx/{fx}/source/r",
};

const FX_PARAMS = {
    // /fx/{fx}/par/{01-64}
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

const MAIN_STEREO_CONFIG = {
    NAME: "/main/st/config/name",
    ICON: "/main/st/config/icon",
    COLOR: "/main/st/config/color",
};

const MAIN_STEREO_DYN = {
    ON: "/main/st/dyn/on",
    MODE: "/main/st/dyn/mode",
    DET: "/main/st/dyn/det",
    ENV: "/main/st/dyn/env",
    THR: "/main/st/dyn/thr",
    RATIO: "/main/st/dyn/ratio",
    KNEE: "/main/st/dyn/knee",
    MGAIN: "/main/st/dyn/mgain",
    ATTACK: "/main/st/dyn/attack",
    HOLD: "/main/st/dyn/hold",
    RELEASE: "/main/st/dyn/release",
    POS: "/main/st/dyn/pos",
    MIX: "/main/st/dyn/mix",
    AUTO: "/main/st/dyn/auto",
};

const MAIN_STEREO_DYN_FILTER = {
    ON: "/main/st/dyn/filter/on",
    TYPE: "/main/st/dyn/filter/type",
    FREQ: "/main/st/dyn/filter/f",
};

const MAIN_STEREO_INSERT = {
    ON: "/main/st/insert/on",
    POS: "/main/st/insert/pos",
    SEL: "/main/st/insert/sel",
};

const MAIN_STEREO_EQ = {
    ON: "/main/st/eq/on",
    BAND_TYPE: "/main/st/eq/{band}/type",
    BAND_FREQ: "/main/st/eq/{band}/f",
    BAND_GAIN: "/main/st/eq/{band}/g",
    BAND_Q: "/main/st/eq/{band}/q",
};

const MAIN_STEREO_MIX = {
    ON: "/main/st/mix/on",
    FADER: "/main/st/mix/fader",
    PAN: "/main/st/mix/pan",
    SEND_ON: "/main/st/mix/{mtx}/on",
    SEND_LEVEL: "/main/st/mix/{mtx}/level",
    SEND_PAN: "/main/st/mix/{mtx}/pan",
};

const MAIN_MONO_CONFIG = {
    NAME: "/main/m/config/name",
    ICON: "/main/m/config/icon",
    COLOR: "/main/m/config/color",
};

const MAIN_MONO_DYN = {
    ON: "/main/m/dyn/on",
    MODE: "/main/m/dyn/mode",
    DET: "/main/m/dyn/det",
    ENV: "/main/m/dyn/env",
    THR: "/main/m/dyn/thr",
    RATIO: "/main/m/dyn/ratio",
    KNEE: "/main/m/dyn/knee",
    MGAIN: "/main/m/dyn/mgain",
    ATTACK: "/main/m/dyn/attack",
    HOLD: "/main/m/dyn/hold",
    RELEASE: "/main/m/dyn/release",
    POS: "/main/m/dyn/pos",
    MIX: "/main/m/dyn/mix",
    AUTO: "/main/m/dyn/auto",
};

const MAIN_MONO_DYN_FILTER = {
    ON: "/main/m/dyn/filter/on",
    TYPE: "/main/m/dyn/filter/type",
    FREQ: "/main/m/dyn/filter/f",
};

const MAIN_MONO_INSERT = {
    ON: "/main/m/insert/on",
    POS: "/main/m/insert/pos",
    SEL: "/main/m/insert/sel",
};

const MAIN_MONO_EQ = {
    ON: "/main/m/eq/on",
    BAND_TYPE: "/main/m/eq/{band}/type",
    BAND_FREQ: "/main/m/eq/{band}/f",
    BAND_GAIN: "/main/m/eq/{band}/g",
    BAND_Q: "/main/m/eq/{band}/q",
};

const MAIN_MONO_MIX = {
    ON: "/main/m/mix/on",
    FADER: "/main/m/mix/fader",
    SEND_ON: "/main/m/mix/{mtx}/on",
    SEND_LEVEL: "/main/m/mix/{mtx}/level",
    SEND_PAN: "/main/m/mix/{mtx}/pan",
};

// ============================================================================
// 7. DCA - /dca/{01-08}
// ============================================================================

const DCA = {
    ON: "/dca/{dca}/on",
    FADER: "/dca/{dca}/fader",
};

const DCA_CONFIG = {
    NAME: "/dca/{dca}/config/name",
    ICON: "/dca/{dca}/config/icon",
    COLOR: "/dca/{dca}/config/color",
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

const OUTPUT_MAIN = {
    SRC: "/outputs/main/{out}/src",
    POS: "/outputs/main/{out}/pos",
    INVERT: "/outputs/main/{out}/invert",
    DELAY_ON: "/outputs/main/{out}/delay/on",
    DELAY_TIME: "/outputs/main/{out}/delay/time",
};

const OUTPUT_AUX = {
    SRC: "/outputs/aux/{out}/src",
    POS: "/outputs/aux/{out}/pos",
    INVERT: "/outputs/aux/{out}/invert",
};

const OUTPUT_P16 = {
    SRC: "/outputs/p16/{out}/src",
    POS: "/outputs/p16/{out}/pos",
    INVERT: "/outputs/p16/{out}/invert",
    IQ_GROUP: "/outputs/p16/{out}/iQ/group",
    IQ_SPEAKER: "/outputs/p16/{out}/iQ/speaker",
    IQ_EQ: "/outputs/p16/{out}/iQ/eq",
    IQ_MODEL: "/outputs/p16/{out}/iQ/model",
};

const OUTPUT_AES = {
    SRC: "/outputs/aes/{out}/src",
    POS: "/outputs/aes/{out}/pos",
    INVERT: "/outputs/aes/{out}/invert",
};

const OUTPUT_REC = {
    SRC: "/outputs/rec/{out}/src",
    POS: "/outputs/rec/{out}/pos",
    INVERT: "/outputs/rec/{out}/invert",
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
    UNSUBSCRIBE: "/unsubscribe",
};

// ============================================================================
// 14. SHOW / CUE / SCENE / SNIPPET / PRESETS
// ============================================================================

const SHOW = {
    DUMP: "/showdump",
    PREPOS_CURRENT: "/-show/prepos/current",
    NAME: "/-show/showfile/show/name",
    SHOW_INPUTS_SAFE: "/-show/showfile/show/inputs",
    SHOW_MXSENDS_SAFE: "/-show/showfile/show/mxsends",
    SHOW_MXBUSES_SAFE: "/-show/showfile/show/mxbuses",
    SHOW_CONSOLE_SAFE: "/-show/showfile/show/console",
    SHOW_CHAN16_SAFE: "/-show/showfile/show/chan16",
    SHOW_CHAN32_SAFE: "/-show/showfile/show/chan32",
    SHOW_RETURN_SAFE: "/-show/showfile/show/return",
    SHOW_BUSES_SAFE: "/-show/showfile/show/buses",
    SHOW_LRMTXDCA_SAFE: "/-show/showfile/show/lrmtxdca",
    SHOW_EFFECTS_SAFE: "/-show/showfile/show/effects",
};

const SHOW_CUE = {
    NUMB: "/-show/showfile/cue/{cue}/numb",
    NAME: "/-show/showfile/cue/{cue}/name",
    SKIP: "/-show/showfile/cue/{cue}/skip",
    SCENE: "/-show/showfile/cue/{cue}/scene",
    SNIPPET: "/-show/showfile/cue/{cue}/bit",
    MIDI_TYPE: "/-show/showfile/cue/{cue}/miditype",
    MIDI_CHAN: "/-show/showfile/cue/{cue}/midichan",
    MIDI_PARA1: "/-show/showfile/cue/{cue}/midipara1",
    MIDI_PARA2: "/-show/showfile/cue/{cue}/midipara2",
};

const SHOW_SCENE = {
    NAME: "/-show/showfile/scene/{scene}/name",
    NOTES: "/-show/showfile/scene/{scene}/notes",
    SAFES: "/-show/showfile/scene/{scene}/safes",
    HAS_DATA: "/-show/showfile/scene/{scene}/hasdata",
};

const SHOW_SNIPPET = {
    NAME: "/-show/showfile/snippet/{snippet}/name",
    EVENTTYP: "/-show/showfile/snippet/{snippet}/eventtyp",
    CHANNELS: "/-show/showfile/snippet/{snippet}/channels",
    AUXBUSES: "/-show/showfile/snippet/{snippet}/auxbuses",
    MAINGRPS: "/-show/showfile/snippet/{snippet}/maingrps",
    HAS_DATA: "/-show/showfile/snippet/{snippet}/hasdata",
};

const LIBS_CH = {
    POS: "/-libs/ch/{idx}/pos",
    NAME: "/-libs/ch/{idx}/name",
    TYPE: "/-libs/ch/{idx}/type",
    FLAGS: "/-libs/ch/{idx}/flags",
    HAS_DATA: "/-libs/ch/{idx}/hasdata",
};

const LIBS_FX = {
    POS: "/-libs/fx/{idx}/pos",
    SHOW: "/-show/showfile/show",
    SHOW_CUE: "/-show/showfile/cue",
    SHOW_SCENE: "/-show/showfile/scene",
    SHOW_SNIPPET: "/-show/showfile/snippet",
    NAME: "/-libs/fx/{idx}/name",
    TYPE: "/-libs/fx/{idx}/type",
    FLAGS: "/-libs/fx/{idx}/flags",
    HAS_DATA: "/-libs/fx/{idx}/hasdata",
};

const LIBS_ROUTING = {
    POS: "/-libs/r/{idx}/pos",
    NAME: "/-libs/r/{idx}/name",
    TYPE: "/-libs/r/{idx}/type",
    FLAGS: "/-libs/r/{idx}/flags",
    HAS_DATA: "/-libs/r/{idx}/hasdata",
};

const LIBS_MON = {
    POS: "/-libs/mon/{idx}/pos",
    NAME: "/-libs/mon/{idx}/name",
    TYPE: "/-libs/mon/{idx}/type",
    FLAGS: "/-libs/mon/{idx}/flags",
    HAS_DATA: "/-libs/mon/{idx}/hasdata",
};

// ============================================================================
// 15. PREFS (Preferences) - /-prefs
// ============================================================================

const PREFS = {
    STYLE: "/-prefs/style",
    BRIGHT: "/-prefs/bright",
    LCD_CONT: "/-prefs/lcdcont",
    LED_BRIGHT: "/-prefs/ledbright",
    LAMP: "/-prefs/lamp",
    LAMP_ON: "/-prefs/lampon",
    CLOCK_RATE: "/-prefs/clockrate",
    CLOCK_SOURCE: "/-prefs/clocksource",
    CONFIRM_GENERAL: "/-prefs/confirm_general",
    CONFIRM_OVERWRITE: "/-prefs/confirm_overwrite",
    CONFIRM_SCENELOAD: "/-prefs/confirm_sceneload",
    VIEW_RETURN: "/-prefs/viewrtn",
    SELF_FOLLOWS_BANK: "/-prefs/selfollowsbank",
    SCENE_ADVANCE: "/-prefs/scene_advance",
    SAFE_MASTER_LEVELS: "/-prefs/safe_masterlevels",
    HAFLAGS: "/-prefs/haflags",
    AUTOSEL43: "/-prefs/autosel43",
    SHOW_CONTROL: "/-prefs/show_control",
    CLOCKMODE: "/-prefs/clockmode",
    HARDMUTE: "/-prefs/hardmute",
    DCAMUTE: "/-prefs/dcamute",
    INVERTMUTES: "/-prefs/invertmutes",
    NAME: "/-prefs/name",
    REC_CONTROL: "/-prefs/rec_control",
    FAST_FADERS: "/-prefs/fastFaders",
};

const PREFS_IP = {
    DHCP: "/-prefs/ip/dhcp",
    ADDR: "/-prefs/ip/addr/{octet}",
    MASK: "/-prefs/ip/mask/{octet}",
    GATEWAY: "/-prefs/ip/gateway/{octet}",
};

const PREFS_REMOTE = {
    ENABLE: "/-prefs/remote/enable",
    PROTOCOL: "/-prefs/remote/protocol",
    PORT: "/-prefs/remote/port",
    IOENABLE: "/-prefs/remote/ioenable",
};

const PREFS_CARD = {
    UFIFC: "/-prefs/card/UFifc",
    UFMODE: "/-prefs/card/UFmode",
    USBMODE: "/-prefs/card/USBmode",
    ADAT_WC: "/-prefs/card/ADATwc",
    ADAT_SYNC: "/-prefs/card/ADATsync",
    MADI_MODE: "/-prefs/card/MADImode",
    MADI_IN: "/-prefs/card/MADIin",
    MADI_OUT: "/-prefs/card/MADIout",
    MADI_SRC: "/-prefs/card/MADIsrc",
    UREC_SDSEL: "/-prefs/card/URECsdsel",
    UREC_TRACKS: "/-prefs/card/URECtracks",
    UREC_PLAYB: "/-prefs/card/URECplayb",
    UREC_ROUT: "/-prefs/card/URECrout",
};

const PREFS_RTA = {
    VISIBILITY: "/-prefs/rta/visibility",
    GAIN: "/-prefs/rta/gain",
    AUTOGAIN: "/-prefs/rta/autogain",
    SOURCE: "/-prefs/rta/source",
    POS: "/-prefs/rta/pos",
    MODE: "/-prefs/rta/mode",
    OPTIONS: "/-prefs/rta/options",
    DET: "/-prefs/rta/det",
    DECAY: "/-prefs/rta/decay",
    PEAKHOLD: "/-prefs/rta/peakhold",
};

const PREFS_IQ = {
    MODEL: "/-prefs/iQ/{slot}/iQmodel",
    EQSET: "/-prefs/iQ/{slot}/iQeqset",
    SOUND: "/-prefs/iQ/{slot}/iQsound",
};

const PREFS_KEY = {
    LAYOUT: "/-prefs/key/layout",
    HISTORY: "/-prefs/key/{idx}",
};

// ============================================================================
// 16. USB (/ -usb)
// ============================================================================

const USB = {
    PATH: "/-usb/path",
    TITLE: "/-usb/title",
    DIR_POS: "/-usb/dir/dirpos",
    DIR_MAXPOS: "/-usb/dir/maxpos",
    DIR_TYPE: "/-usb/dir/{entry}/type",
    DIR_NAME: "/-usb/dir/{entry}/name",
};

// ============================================================================
// 17. STATUS (/ -stat) additions
// ============================================================================

const STATUS = {
    SELIDX: "/-stat/selidx",
    CHFADERBANK: "/-stat/chfaderbank",
    GRPFADERBANK: "/-stat/grpfaderbank",
    SENDSONFADER: "/-stat/sendsonfader",
    BUSSENDBANK: "/-stat/bussendbank",
    EQBAND: "/-stat/eqband",
    SOLO: "/-stat/solo",
    KEYSOLO: "/-stat/keysolo",
    USERBANK: "/-stat/userbank",
    AUTOSAVE: "/-stat/autosave",
    LOCK: "/-stat/lock",
    USBMOUNTED: "/-stat/usbmounted",
    REMOTE: "/-stat/remote",
    RTA_MODE_EQ: "/-stat/rtamodeeq",
    RTA_MODE_GEQ: "/-stat/rtamodegeq",
    RTA_EQ_PRE: "/-stat/rtaeqpre",
    RTA_GEQ_POST: "/-stat/rtageqpost",
    RTA_SOURCE: "/-stat/rtasource",
    XCARDTYPE: "/-stat/xcardtype",
    XCARD_SYNC: "/-stat/xcardsync",
    GEQ_ON_FDR: "/-stat/geqonfdr",
    GEQ_POS: "/-stat/geqpos",
    SCREEN: "/-stat/screen/screen",
    SCREEN_MUTEGRP: "/-stat/screen/mutegrp",
    SCREEN_UTILS: "/-stat/screen/utils",
    SCREEN_CHAN_PAGE: "/-stat/screen/CHAN/page",
    SCREEN_METER_PAGE: "/-stat/screen/METER/page",
    SCREEN_ROUTE_PAGE: "/-stat/screen/ROUTE/page",
    SCREEN_SETUP_PAGE: "/-stat/screen/SETUP/page",
    SCREEN_LIB_PAGE: "/-stat/screen/LIB/page",
    SCREEN_FX_PAGE: "/-stat/screen/FX/page",
    SCREEN_MON_PAGE: "/-stat/screen/MON/page",
    SCREEN_USB_PAGE: "/-stat/screen/USB/page",
    SCREEN_SCENE_PAGE: "/-stat/screen/SCENE/page",
    SCREEN_ASSIGN_PAGE: "/-stat/screen/ASSIGN/page",
    AES50_STATE: "/-stat/aes50/state",
    AES50_CHAIN_A: "/-stat/aes50/A",
    AES50_CHAIN_B: "/-stat/aes50/B",
    SOLO_SWITCH: "/-stat/solosw/{ch}",
    TALK: "/-stat/talk/{line}",
    OSC_ON: "/-stat/osc/on",
    TAPE_STATE: "/-stat/tape/state",
    TAPE_FILE: "/-stat/tape/file",
    TAPE_ETIME: "/-stat/tape/etime",
    TAPE_RTIME: "/-stat/tape/rtime",
    USERPAR_VALUE: "/-stat/userpar/{id}/value",
    UREC_STATE: "/-stat/urec/state",
    UREC_ETIME_MS: "/-stat/urec/etime",
    UREC_RTIME_MS: "/-stat/urec/rtime",
};

// ============================================================================
// 18. ACTION (/ -action) and UNDO (/ -undo)
// ============================================================================

const ACTION = {
    SETIP: "/-action/setip",
    SETCLOCK: "/-action/setclock",
    INITALL: "/-action/initall",
    INITLIB: "/-action/initlib",
    INITSHOW: "/-action/initshow",
    SAVESTATE: "/-action/savestate",
    UNDOPT: "/-action/undopt",
    DOUNDO: "/-action/doundo",
    PLAYTRACK: "/-action/playtrack",
    NEWSCREEN: "/-action/newscreen",
    CLEARSOLO: "/-action/clearsolo",
    SETPREBUS: "/-action/setprebus",
    SETSRATE: "/-action/setsrate",
    SETRTASRC: "/-action/setrtasrc",
    RECSELECT: "/-action/recselect",
    GOCUE: "/-action/gocue",
    GOSCENE: "/-action/goscene",
    GOSNIPPET: "/-action/gosnippet",
    SELSESSION: "/-action/selsession",
    DELSESSION: "/-action/delsession",
    SELMARKER: "/-action/selmarker",
    DELMARKER: "/-action/delmarker",
    SAVEMARKER: "/-action/savemarker",
    ADDMARKER: "/-action/addmarker",
    SETPOSITION: "/-action/setposition",
    CLEARALERT: "/-action/clearalert",
    FORMATCARD: "/-action/formatcard",
};

const UNDO = {
    TIME: "/-undo/time",
};

// ============================================================================
// 19. UREC (X-Live! sdcard recording) - /-urec
// ============================================================================

const UREC = {
    SESSIONMAX: "/-urec/sessionmax",
    MARKERMAX: "/-urec/markermax",
    SESSIONLEN: "/-urec/sessionlen",
    SESSIONPOS: "/-urec/sessionpos",
    MARKERPOS: "/-urec/markerpos",
    BATTERYSTATE: "/-urec/batterystate",
    SRATE: "/-urec/srate",
    TRACKS: "/-urec/tracks",
    SESSIONSPAN: "/-urec/sessionspan",
    SESSIONOFFS: "/-urec/sessionoffs",
    SD1STATE: "/-urec/sd1state",
    SD2STATE: "/-urec/sd2state",
    SD1INFO: "/-urec/sd1info",
    SD2INFO: "/-urec/sd2info",
    ERRORMESSAGE: "/-urec/errormessage",
    ERRORCODE: "/-urec/errorcode",
    SESSION_NAME: "/-urec/session/{session}/name",
    MARKER_TIME: "/-urec/marker/{marker}/time",
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

/**
 * Format index with 3 digits (0 -> "000")
 * @param {number} index - Index number
 * @returns {string} Formatted index
 */
function formatIndex3(index) {
    return index.toString().padStart(3, "0");
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
// HELPER FUNCTIONS - Main Stereo/Mono
// ============================================================================

function setMainStereoFader(level) {
    return createMessage(MAIN_STEREO_MIX.FADER, "f", level);
}

function setMainStereoFaderDb(db) {
    return setMainStereoFader(dbToLevel(db));
}

function setMainStereoOn(on) {
    return createMessage(MAIN_STEREO_MIX.ON, "i", on ? 1 : 0);
}

function setMainStereoPan(pan) {
    return createMessage(MAIN_STEREO_MIX.PAN, "f", pan);
}

function setMainStereoSendOn(mtx, on) {
    const path = resolvePath(MAIN_STEREO_MIX.SEND_ON, {
        mtx: formatIndex(mtx),
    });
    return createMessage(path, "i", on ? 1 : 0);
}

function setMainStereoSendLevel(mtx, level) {
    const path = resolvePath(MAIN_STEREO_MIX.SEND_LEVEL, {
        mtx: formatIndex(mtx),
    });
    return createMessage(path, "f", level);
}

function setMainStereoSendLevelDb(mtx, db) {
    return setMainStereoSendLevel(mtx, dbToLevel(db));
}

function setMainStereoSendPan(mtx, pan) {
    const path = resolvePath(MAIN_STEREO_MIX.SEND_PAN, {
        mtx: formatIndex(mtx),
    });
    return createMessage(path, "f", pan);
}

function setMainMonoFader(level) {
    return createMessage(MAIN_MONO_MIX.FADER, "f", level);
}

function setMainMonoFaderDb(db) {
    return setMainMonoFader(dbToLevel(db));
}

function setMainMonoOn(on) {
    return createMessage(MAIN_MONO_MIX.ON, "i", on ? 1 : 0);
}

function setMainMonoSendOn(mtx, on) {
    const path = resolvePath(MAIN_MONO_MIX.SEND_ON, { mtx: formatIndex(mtx) });
    return createMessage(path, "i", on ? 1 : 0);
}

function setMainMonoSendLevel(mtx, level) {
    const path = resolvePath(MAIN_MONO_MIX.SEND_LEVEL, {
        mtx: formatIndex(mtx),
    });
    return createMessage(path, "f", level);
}

function setMainMonoSendLevelDb(mtx, db) {
    return setMainMonoSendLevel(mtx, dbToLevel(db));
}

function setMainMonoSendPan(mtx, pan) {
    const path = resolvePath(MAIN_MONO_MIX.SEND_PAN, { mtx: formatIndex(mtx) });
    return createMessage(path, "f", pan);
}

// ============================================================================
// HELPER FUNCTIONS - FX
// ============================================================================

function setFxType(fx, type) {
    const path = resolvePath(FX_SLOT.TYPE, { fx: fx });
    return createMessage(path, "i", type);
}

function setFxOn(fx, on) {
    const path = resolvePath(FX_SLOT.ON, { fx: fx });
    return createMessage(path, "i", on ? 1 : 0);
}

function setFxSourceL(fx, src) {
    const path = resolvePath(FX_SOURCE.L, { fx: fx });
    return createMessage(path, "i", src);
}

function setFxSourceR(fx, src) {
    const path = resolvePath(FX_SOURCE.R, { fx: fx });
    return createMessage(path, "i", src);
}

function setFxParam(fx, par, value, type = "f") {
    const path = resolvePath(FX_PARAMS.BASE, { fx: fx, par: formatIndex(par) });
    return createMessage(path, type, value);
}

// ============================================================================
// HELPER FUNCTIONS - Output Routing
// ============================================================================

function setOutputMainSrc(out, src) {
    const path = resolvePath(OUTPUT_MAIN.SRC, { out: formatIndex(out) });
    return createMessage(path, "i", src);
}

function setOutputMainPos(out, pos) {
    const path = resolvePath(OUTPUT_MAIN.POS, { out: formatIndex(out) });
    return createMessage(path, "i", pos);
}

function setOutputMainInvert(out, invert) {
    const path = resolvePath(OUTPUT_MAIN.INVERT, { out: formatIndex(out) });
    return createMessage(path, "i", invert ? 1 : 0);
}

function setOutputMainDelay(out, on, timeMs) {
    const onPath = resolvePath(OUTPUT_MAIN.DELAY_ON, { out: formatIndex(out) });
    const timePath = resolvePath(OUTPUT_MAIN.DELAY_TIME, {
        out: formatIndex(out),
    });
    return [
        createMessage(onPath, "i", on ? 1 : 0),
        createMessage(timePath, "f", timeMs),
    ];
}

function setOutputAuxSrc(out, src) {
    const path = resolvePath(OUTPUT_AUX.SRC, { out: formatIndex(out) });
    return createMessage(path, "i", src);
}

function setOutputAuxPos(out, pos) {
    const path = resolvePath(OUTPUT_AUX.POS, { out: formatIndex(out) });
    return createMessage(path, "i", pos);
}

function setOutputAuxInvert(out, invert) {
    const path = resolvePath(OUTPUT_AUX.INVERT, { out: formatIndex(out) });
    return createMessage(path, "i", invert ? 1 : 0);
}

function setOutputP16Src(out, src) {
    const path = resolvePath(OUTPUT_P16.SRC, { out: formatIndex(out) });
    return createMessage(path, "i", src);
}

function setOutputP16Pos(out, pos) {
    const path = resolvePath(OUTPUT_P16.POS, { out: formatIndex(out) });
    return createMessage(path, "i", pos);
}

function setOutputP16Invert(out, invert) {
    const path = resolvePath(OUTPUT_P16.INVERT, { out: formatIndex(out) });
    return createMessage(path, "i", invert ? 1 : 0);
}

function setOutputP16Iq(out, { group, speaker, eq, model }) {
    const messages = [];
    if (group !== undefined) {
        messages.push(
            createMessage(
                resolvePath(OUTPUT_P16.IQ_GROUP, { out: formatIndex(out) }),
                "i",
                group,
            ),
        );
    }
    if (speaker !== undefined) {
        messages.push(
            createMessage(
                resolvePath(OUTPUT_P16.IQ_SPEAKER, { out: formatIndex(out) }),
                "i",
                speaker,
            ),
        );
    }
    if (eq !== undefined) {
        messages.push(
            createMessage(
                resolvePath(OUTPUT_P16.IQ_EQ, { out: formatIndex(out) }),
                "i",
                eq,
            ),
        );
    }
    if (model !== undefined) {
        messages.push(
            createMessage(
                resolvePath(OUTPUT_P16.IQ_MODEL, { out: formatIndex(out) }),
                "i",
                model,
            ),
        );
    }
    return messages;
}

function setOutputAesSrc(out, src) {
    const path = resolvePath(OUTPUT_AES.SRC, { out: formatIndex(out) });
    return createMessage(path, "i", src);
}

function setOutputAesPos(out, pos) {
    const path = resolvePath(OUTPUT_AES.POS, { out: formatIndex(out) });
    return createMessage(path, "i", pos);
}

function setOutputAesInvert(out, invert) {
    const path = resolvePath(OUTPUT_AES.INVERT, { out: formatIndex(out) });
    return createMessage(path, "i", invert ? 1 : 0);
}

function setOutputRecSrc(out, src) {
    const path = resolvePath(OUTPUT_REC.SRC, { out: formatIndex(out) });
    return createMessage(path, "i", src);
}

function setOutputRecPos(out, pos) {
    const path = resolvePath(OUTPUT_REC.POS, { out: formatIndex(out) });
    return createMessage(path, "i", pos);
}

function setOutputRecInvert(out, invert) {
    const path = resolvePath(OUTPUT_REC.INVERT, { out: formatIndex(out) });
    return createMessage(path, "i", invert ? 1 : 0);
}

// ============================================================================
// HELPER FUNCTIONS - DCA
// ============================================================================

function setDcaOn(dca, on) {
    const path = resolvePath(DCA.ON, { dca: formatIndex(dca) });
    return createMessage(path, "i", on ? 1 : 0);
}

function setDcaFader(dca, level) {
    const path = resolvePath(DCA.FADER, { dca: formatIndex(dca) });
    return createMessage(path, "f", level);
}

function setDcaFaderDb(dca, db) {
    return setDcaFader(dca, dbToLevel(db));
}

// ============================================================================
// HELPER FUNCTIONS - Show/Cue/Scene/Snippet/Presets
// ============================================================================

function showDump() {
    return createEmptyMessage(SHOW.DUMP);
}

function setShowName(name) {
    return createMessage(SHOW.NAME, "s", name);
}

function setCueNumber(cueIndex, cueNumberInt) {
    const path = resolvePath(SHOW_CUE.NUMB, { cue: formatIndex3(cueIndex) });
    return createMessage(path, "i", cueNumberInt);
}

function setCueName(cueIndex, name) {
    const path = resolvePath(SHOW_CUE.NAME, { cue: formatIndex3(cueIndex) });
    return createMessage(path, "s", name);
}

function setCueSkip(cueIndex, skip) {
    const path = resolvePath(SHOW_CUE.SKIP, { cue: formatIndex3(cueIndex) });
    return createMessage(path, "i", skip ? 1 : 0);
}

function setCueScene(cueIndex, sceneIndex) {
    const path = resolvePath(SHOW_CUE.SCENE, { cue: formatIndex3(cueIndex) });
    return createMessage(path, "i", sceneIndex);
}

function setCueSnippet(cueIndex, snippetIndex) {
    const path = resolvePath(SHOW_CUE.SNIPPET, { cue: formatIndex3(cueIndex) });
    return createMessage(path, "i", snippetIndex);
}

function setCueMidi(cueIndex, { type, channel, param1, param2 }) {
    const messages = [];
    if (type !== undefined) {
        messages.push(
            createMessage(
                resolvePath(SHOW_CUE.MIDI_TYPE, {
                    cue: formatIndex3(cueIndex),
                }),
                "i",
                type,
            ),
        );
    }
    if (channel !== undefined) {
        messages.push(
            createMessage(
                resolvePath(SHOW_CUE.MIDI_CHAN, {
                    cue: formatIndex3(cueIndex),
                }),
                "i",
                channel,
            ),
        );
    }
    if (param1 !== undefined) {
        messages.push(
            createMessage(
                resolvePath(SHOW_CUE.MIDI_PARA1, {
                    cue: formatIndex3(cueIndex),
                }),
                "i",
                param1,
            ),
        );
    }
    if (param2 !== undefined) {
        messages.push(
            createMessage(
                resolvePath(SHOW_CUE.MIDI_PARA2, {
                    cue: formatIndex3(cueIndex),
                }),
                "i",
                param2,
            ),
        );
    }
    return messages;
}

function setSceneMeta(sceneIndex, { name, notes, safes }) {
    const messages = [];
    if (name !== undefined) {
        messages.push(
            createMessage(
                resolvePath(SHOW_SCENE.NAME, {
                    scene: formatIndex3(sceneIndex),
                }),
                "s",
                name,
            ),
        );
    }
    if (notes !== undefined) {
        messages.push(
            createMessage(
                resolvePath(SHOW_SCENE.NOTES, {
                    scene: formatIndex3(sceneIndex),
                }),
                "s",
                notes,
            ),
        );
    }
    if (safes !== undefined) {
        messages.push(
            createMessage(
                resolvePath(SHOW_SCENE.SAFES, {
                    scene: formatIndex3(sceneIndex),
                }),
                "i",
                safes,
            ),
        );
    }
    return messages;
}

function setSnippetMeta(
    snippetIndex,
    { name, eventtyp, channels, auxbuses, maingrps },
) {
    const messages = [];
    if (name !== undefined) {
        messages.push(
            createMessage(
                resolvePath(SHOW_SNIPPET.NAME, {
                    snippet: formatIndex3(snippetIndex),
                }),
                "s",
                name,
            ),
        );
    }
    if (eventtyp !== undefined) {
        messages.push(
            createMessage(
                resolvePath(SHOW_SNIPPET.EVENTTYP, {
                    snippet: formatIndex3(snippetIndex),
                }),
                "i",
                eventtyp,
            ),
        );
    }
    if (channels !== undefined) {
        messages.push(
            createMessage(
                resolvePath(SHOW_SNIPPET.CHANNELS, {
                    snippet: formatIndex3(snippetIndex),
                }),
                "i",
                channels,
            ),
        );
    }
    if (auxbuses !== undefined) {
        messages.push(
            createMessage(
                resolvePath(SHOW_SNIPPET.AUXBUSES, {
                    snippet: formatIndex3(snippetIndex),
                }),
                "i",
                auxbuses,
            ),
        );
    }
    if (maingrps !== undefined) {
        messages.push(
            createMessage(
                resolvePath(SHOW_SNIPPET.MAINGRPS, {
                    snippet: formatIndex3(snippetIndex),
                }),
                "i",
                maingrps,
            ),
        );
    }
    return messages;
}

function libraryPath(libGroup, field, idx) {
    return resolvePath(libGroup[field], { idx: formatIndex3(idx) });
}

function setLibraryName(libGroup, idx, name) {
    return createMessage(libraryPath(libGroup, "NAME", idx), "s", name);
}

// Generic dataset commands (/add, /copy, /save, /load, /delete, /rename)
function addCue(indexInt, name) {
    return {
        address: "/add",
        args: [
            { type: "s", value: "cue" },
            { type: "i", value: indexInt },
            { type: "s", value: name },
        ],
    };
}

function copyEntity(kind, srcIndex, dstIndex) {
    return {
        address: "/copy",
        args: [
            { type: "s", value: kind },
            { type: "i", value: srcIndex },
            { type: "i", value: dstIndex },
        ],
    };
}

function saveEntity(kind, params = []) {
    return {
        address: "/save",
        args: [{ type: "s", value: kind }, ...params],
    };
}

function loadEntity(kind, params = []) {
    return {
        address: "/load",
        args: [{ type: "s", value: kind }, ...params],
    };
}

function renameEntity(kind, index, newName) {
    return {
        address: "/rename",
        args: [
            { type: "s", value: kind },
            { type: "i", value: index },
            { type: "s", value: newName },
        ],
    };
}

function deleteEntity(kind, index) {
    return {
        address: "/delete",
        args: [
            { type: "s", value: kind },
            { type: "i", value: index },
        ],
    };
}

// ============================================================================
// HELPER FUNCTIONS - Preferences / USB / Action
// ============================================================================

function setPref(path, type, value) {
    return createMessage(path, type, value);
}

function setPrefIpAddr(octet, value) {
    const path = resolvePath(PREFS_IP.ADDR, { octet: octet });
    return createMessage(path, "i", value);
}

function setPrefIpMask(octet, value) {
    const path = resolvePath(PREFS_IP.MASK, { octet: octet });
    return createMessage(path, "i", value);
}

function setPrefIpGateway(octet, value) {
    const path = resolvePath(PREFS_IP.GATEWAY, { octet: octet });
    return createMessage(path, "i", value);
}

function setPrefIq(slot, { model, eqset, sound }) {
    const messages = [];
    const formattedSlot = formatIndex(slot);
    if (model !== undefined) {
        messages.push(
            createMessage(
                resolvePath(PREFS_IQ.MODEL, { slot: formattedSlot }),
                "i",
                model,
            ),
        );
    }
    if (eqset !== undefined) {
        messages.push(
            createMessage(
                resolvePath(PREFS_IQ.EQSET, { slot: formattedSlot }),
                "i",
                eqset,
            ),
        );
    }
    if (sound !== undefined) {
        messages.push(
            createMessage(
                resolvePath(PREFS_IQ.SOUND, { slot: formattedSlot }),
                "i",
                sound,
            ),
        );
    }
    return messages;
}

function setPrefKeyHistory(idx, text) {
    const path = resolvePath(PREFS_KEY.HISTORY, { idx: formatIndex(idx) });
    return createMessage(path, "s", text);
}

function triggerAction(actionPath, value = 1, type = "i") {
    return createMessage(actionPath, type, value);
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

function subscribe(command, timeFactor = 0) {
    return {
        address: SUBSCRIBE.BASIC,
        args: [
            { type: "s", value: command },
            { type: "i", value: timeFactor },
        ],
    };
}

function formatSubscribe(
    alias,
    commands,
    rangeStart = 0,
    rangeEnd = 0,
    timeFactor = 0,
) {
    const cmdList = Array.isArray(commands) ? commands : [commands];
    const args = [
        { type: "s", value: alias },
        ...cmdList.map((c) => ({ type: "s", value: c })),
        { type: "i", value: rangeStart },
        { type: "i", value: rangeEnd },
        { type: "i", value: timeFactor },
    ];
    return {
        address: SUBSCRIBE.FORMAT,
        args: args,
    };
}

function batchSubscribe(
    alias,
    meterCommand,
    arg0 = 0,
    arg1 = 0,
    timeFactor = 0,
) {
    return {
        address: SUBSCRIBE.BATCH,
        args: [
            { type: "s", value: alias },
            { type: "s", value: meterCommand },
            { type: "i", value: arg0 },
            { type: "i", value: arg1 },
            { type: "i", value: timeFactor },
        ],
    };
}

function renewSubscription(alias) {
    if (alias) {
        return createMessage(SYSTEM.RENEW, "s", alias);
    }
    return createEmptyMessage(SYSTEM.RENEW);
}

function unsubscribe(alias) {
    if (alias) {
        return createMessage(SUBSCRIBE.UNSUBSCRIBE, "s", alias);
    }
    return createEmptyMessage(SUBSCRIBE.UNSUBSCRIBE);
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
    FX_SOURCE,
    FX_PARAMS,
    FX_RETURN,
    MATRIX,
    MAIN_STEREO_CONFIG,
    MAIN_STEREO_DYN,
    MAIN_STEREO_DYN_FILTER,
    MAIN_STEREO_INSERT,
    MAIN_STEREO_EQ,
    MAIN_STEREO_MIX,
    MAIN_MONO_CONFIG,
    MAIN_MONO_DYN,
    MAIN_MONO_DYN_FILTER,
    MAIN_MONO_INSERT,
    MAIN_MONO_EQ,
    MAIN_MONO_MIX,
    DCA,
    DCA_CONFIG,
    AUXIN,
    OUTPUT,
    OUTPUT_MAIN,
    OUTPUT_AUX,
    OUTPUT_P16,
    OUTPUT_AES,
    OUTPUT_REC,
    HEADAMP,
    METERS,
    STATUS,
    STATUS_PATHS,
    SCENE,
    SNIPPET,
    NODE,
    SUBSCRIBE,
    SHOW,
    SHOW_CUE,
    SHOW_SCENE,
    SHOW_SNIPPET,
    LIBS_CH,
    LIBS_FX,
    LIBS_ROUTING,
    LIBS_MON,
    PREFS,
    PREFS_IP,
    PREFS_REMOTE,
    PREFS_CARD,
    PREFS_RTA,
    PREFS_IQ,
    PREFS_KEY,
    USB,
    ACTION,
    UNDO,
    UREC,

    // Path helpers
    resolvePath,
    formatChannel,
    formatBus,
    formatIndex,
    formatIndex3,

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

    // Main stereo/mono functions
    setMainStereoFader,
    setMainStereoFaderDb,
    setMainStereoOn,
    setMainStereoPan,
    setMainStereoSendOn,
    setMainStereoSendLevel,
    setMainStereoSendLevelDb,
    setMainStereoSendPan,
    setMainMonoFader,
    setMainMonoFaderDb,
    setMainMonoOn,
    setMainMonoSendOn,
    setMainMonoSendLevel,
    setMainMonoSendLevelDb,
    setMainMonoSendPan,

    // DCA functions
    setDcaOn,
    setDcaFader,
    setDcaFaderDb,

    // FX functions
    setFxType,
    setFxOn,
    setFxSourceL,
    setFxSourceR,
    setFxParam,

    // Show/Cue/Scene/Snippet/Presets functions
    showDump,
    setShowName,
    setCueNumber,
    setCueName,
    setCueSkip,
    setCueScene,
    setCueSnippet,
    setCueMidi,
    setSceneMeta,
    setSnippetMeta,
    libraryPath,
    setLibraryName,
    addCue,
    copyEntity,
    saveEntity,
    loadEntity,
    renameEntity,
    deleteEntity,

    // Preferences / action helpers
    setPref,
    setPrefIpAddr,
    setPrefIpMask,
    setPrefIpGateway,
    setPrefIq,
    setPrefKeyHistory,
    triggerAction,

    // Channel functions
    setChannelFader,
    getChannelFader,
    setChannelOn,
    setChannelPan,
    setChannelMute,
    setChannelTrim,
    subscribeToChannel,
    subscribe,
    formatSubscribe,
    batchSubscribe,
    renewSubscription,
    unsubscribe,

    // Bus functions
    setBusFader,
    setBusOn,

    // Output routing functions
    setOutputMainSrc,
    setOutputMainPos,
    setOutputMainInvert,
    setOutputMainDelay,
    setOutputAuxSrc,
    setOutputAuxPos,
    setOutputAuxInvert,
    setOutputP16Src,
    setOutputP16Pos,
    setOutputP16Invert,
    setOutputP16Iq,
    setOutputAesSrc,
    setOutputAesPos,
    setOutputAesInvert,
    setOutputRecSrc,
    setOutputRecPos,
    setOutputRecInvert,

    // Level conversion
    dbToLevel,
    levelToDb,
    setChannelFaderDb,
    setBusFaderDb,
};
