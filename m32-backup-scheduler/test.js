// Simple test harness for oscMessages
const OSC = require("./oscMessages");

function print(title, obj) {
    console.log(`\n=== ${title} ===`);
    console.dir(obj, { depth: 5 });
}

function main() {
    print("System / Info", {
        info: OSC.getInfo(),
        xinfo: OSC.getXInfo(),
        status: OSC.getStatus(),
        xremote: OSC.xremote(),
    });

    print("Scene / Show", {
        loadScene80: OSC.loadScene(80),
        saveScene90: OSC.saveScene(90),
        loadShow1: OSC.loadShow(1),
        saveShow2: OSC.saveShow(2),
    });

    print("Channel basics", {
        ch1Fader50: OSC.setChannelFader(1, 0.5),
        ch1FaderDbMinus6: OSC.setChannelFaderDb(1, -6),
        ch1On: OSC.setChannelOn(1, true),
        ch1PanRight: OSC.setChannelPan(1, 1.0),
        ch1Mute: OSC.setChannelMute(1, true),
        ch1Trim0: OSC.setChannelTrim(1, 0),
    });

    print("Channel send to bus 3", {
        sendLevel: OSC.createMessage(
            OSC.resolvePath(OSC.CHANNEL_SENDS.LEVEL, {
                ch: OSC.formatChannel(1),
                bus: OSC.formatBus(3),
            }),
            "f",
            0.75,
        ),
    });

    print("Bus basics", {
        bus3Fader: OSC.setBusFader(3, 0.7),
        bus3On: OSC.setBusOn(3, true),
        bus3FaderDb: OSC.setBusFaderDb(3, -3),
    });

    print("EQ example (ch1 band2 freq)", {
        eqFreq: OSC.createMessage(
            OSC.resolvePath(OSC.CHANNEL_EQ.BAND_FREQ, {
                ch: OSC.formatChannel(1),
                band: 2,
            }),
            "f",
            0.5,
        ),
    });

    print("FX param example (fx4 par07)", {
        fxPar: OSC.createMessage(
            OSC.resolvePath(OSC.FX_PARAMS.BASE, { fx: 4, par: "07" }),
            "f",
            0.5,
        ),
    });

    print("Meters & subscribe", {
        meters1: OSC.createMessage(OSC.METERS.REQUEST, "s", "meters/1"),
        subscribeFader: OSC.subscribeToChannel(1, "mix/fader", 1),
    });

    print("Output routing example", {
        out1Src: OSC.createMessage(
            OSC.resolvePath(OSC.OUTPUT.SOURCE, { out: OSC.formatIndex(1) }),
            "i",
            5,
        ),
    });
}

main();
