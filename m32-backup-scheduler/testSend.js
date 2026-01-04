// Send a set of OSC messages to the console at 192.168.0.76:10023
const osc = require("osc");
const OSC = require("./oscMessages");

const TARGET_IP = process.env.M32_IP || "hyeoni1995.iptime.org";
const TARGET_PORT = parseInt(process.env.M32_PORT || "10023", 10);

const udpPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 0,
    metadata: true,
});

udpPort.on("ready", async () => {
    console.log(`Sending OSC messages to ${TARGET_IP}:${TARGET_PORT}`);
    await sendAll();
    console.log("Done. Waiting briefly for replies (2s)...");
    setTimeout(() => process.exit(0), 2000);
});

udpPort.on("message", (oscMsg) => {
    console.log("<-- reply", oscMsg);
});

udpPort.on("error", (err) => {
    console.error("OSC Error", err);
});

udpPort.open();

function send(msg, label) {
    return new Promise((resolve) => {
        udpPort.send(msg, TARGET_IP, TARGET_PORT);
        console.log(`--> ${label}`, msg);
        setTimeout(resolve, 200); // small gap between sends
    });
}

async function sendAll() {
    const messages = [
        { label: "info", msg: OSC.getInfo() },
        { label: "xinfo", msg: OSC.getXInfo() },
        { label: "status", msg: OSC.getStatus() },
        { label: "xremote", msg: OSC.xremote() },
        { label: "loadScene80", msg: OSC.loadScene(80) },
        { label: "saveScene90", msg: OSC.saveScene(90) },
        { label: "loadShow1", msg: OSC.loadShow(1) },
        { label: "ch1 fader 0.5", msg: OSC.setChannelFader(1, 0.5) },
        { label: "ch1 on", msg: OSC.setChannelOn(1, true) },
        { label: "bus3 fader 0.7", msg: OSC.setBusFader(3, 0.7) },
        {
            label: "eq ch1 band2 freq 0.5",
            msg: OSC.createMessage(
                OSC.resolvePath(OSC.CHANNEL_EQ.BAND_FREQ, {
                    ch: OSC.formatChannel(1),
                    band: 2,
                }),
                "f",
                0.5,
            ),
        },
        {
            label: "fx4 par07 0.5",
            msg: OSC.createMessage(
                OSC.resolvePath(OSC.FX_PARAMS.BASE, { fx: 4, par: "07" }),
                "f",
                0.5,
            ),
        },
        {
            label: "meters/1",
            msg: OSC.createMessage(OSC.METERS.REQUEST, "s", "meters/1"),
        },
        {
            label: "subscribe ch1 fader",
            msg: OSC.subscribeToChannel(1, "mix/fader", 1),
        },
        {
            label: "output1 src=5",
            msg: OSC.createMessage(
                OSC.resolvePath(OSC.OUTPUT.SOURCE, { out: OSC.formatIndex(1) }),
                "i",
                5,
            ),
        },
    ];

    for (const item of messages) {
        await send(item.msg, item.label);
    }
}
