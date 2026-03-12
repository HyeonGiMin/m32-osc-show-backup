const express = require('express');
const router = express.Router();
const { loadSceneIndex, loadShows } = require('../backup');
const logger = require('../logger');

function resolveClient(req, res) {
    const consoleId = req.query.consoleId;
    if (!consoleId) { res.status(400).json({ error: 'consoleId is required' }); return null; }
    const client = req.app.locals.consoleManager.getClient(consoleId);
    if (!client) { res.status(404).json({ error: 'Console not found' }); return null; }
    return { client, consoleId };
}

// GET /api/console-data/scenes?consoleId=xxx
// 콘솔에서 씬 슬롯 전체 조회 + 로컬 백업 정보 병합
router.get('/scenes', async (req, res) => {
    const resolved = resolveClient(req, res);
    if (!resolved) return;
    const { client, consoleId } = resolved;

    const sceneIndex = loadSceneIndex(consoleId);
    const rawSlots = sceneIndex.slots || {};
    // slots may be string (old format: ISO timestamp) or object { time, name?, desc? }
    const localSlots = Object.fromEntries(
        Object.entries(rawSlots).map(([k, v]) => [k, typeof v === 'string' ? { time: v } : v])
    );

    if (!client.online) {
        // 오프라인 시 로컬 백업 데이터만 반환
        const scenes = Object.entries(localSlots).map(([slot, info]) => ({
            slot: parseInt(slot),
            name: null,
            hasData: null,
            backedAt: info.time,
            backupName: info.name ?? null,
        }));
        return res.json({ consoleId, online: false, scenes });
    }

    try {
        logger.info({ consoleId }, 'Querying scene list from console');
        const raw = await client.getSceneList(100, 3000);

        const scenes = Object.entries(raw)
            .map(([slot, { name, hasData }]) => ({
                slot: parseInt(slot),
                name:       name || null,
                hasData:    hasData === 1 || hasData === true,
                backedAt:   localSlots[slot]?.time ?? null,
                backupName: localSlots[slot]?.name ?? null,
            }))
            .filter(s => s.hasData || s.backedAt)  // 데이터 있는 슬롯만
            .sort((a, b) => a.slot - b.slot);

        res.json({ consoleId, online: true, scenes });
    } catch (err) {
        logger.error({ err: err.message }, 'Scene list query failed');
        res.status(500).json({ error: err.message });
    }
});

// GET /api/console-data/shows?consoleId=xxx
// 로컬 백업 쇼 목록 + 현재 로드된 쇼 이름
router.get('/shows', async (req, res) => {
    const resolved = resolveClient(req, res);
    if (!resolved) return;
    const { client, consoleId } = resolved;

    const shows = loadShows(consoleId);

    let currentShowName = null;
    if (client.online) {
        try {
            currentShowName = await client.getShowName(2000);
        } catch {}
    }

    res.json({ consoleId, online: client.online, currentShowName, shows });
});

module.exports = router;
