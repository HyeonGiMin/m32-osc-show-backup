const MAX_ENTRIES = 500;

const entries = [];
const sseClients = new Set();

function addEntry(entry) {
    entries.push(entry);
    if (entries.length > MAX_ENTRIES) {
        entries.shift();
    }
    for (const res of sseClients) {
        res.write(`data: ${JSON.stringify(entry)}\n\n`);
    }
}

function getEntries(limit = 100) {
    return entries.slice(-limit);
}

function addSSEClient(res) {
    sseClients.add(res);
    return () => sseClients.delete(res);
}

module.exports = { addEntry, getEntries, addSSEClient };
