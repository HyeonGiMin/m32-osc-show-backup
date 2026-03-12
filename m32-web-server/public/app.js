// ── State ────────────────────────────────────────────────────────────────────

let _consoles = []; // cached console list (id, name, ip, port)

// ── Console Management ───────────────────────────────────────────────────────

async function loadConsoles() {
    _consoles = await api('GET', '/api/consoles');
    renderConsolePlaceholders();
    populateConsoleSelects();
    // Trigger status refresh after loading console list
    refreshStatus();
}

function renderConsolePlaceholders() {
    const grid = document.getElementById('consoles-grid');
    grid.innerHTML = '';

    if (!_consoles.length) {
        grid.innerHTML = '<p class="empty-msg">등록된 콘솔이 없습니다. + 추가 버튼으로 M32를 등록하세요.</p>';
        return;
    }

    for (const c of _consoles) {
        grid.appendChild(buildConsoleCard(c, null)); // null = status unknown yet
    }
}

function buildConsoleCard(c, status) {
    const reachable = status?.reachable;
    const si = status?.sceneIndex;

    const card = document.createElement('div');
    card.className = `console-card ${reachable == null ? '' : reachable ? 'online' : 'offline'}`;
    card.id = `console-card-${c.id}`;

    const dotClass = reachable == null ? '' : reachable ? 'online' : 'offline';
    const statusText = reachable == null ? '확인 중...' : reachable ? '연결됨' : '오프라인';
    const slotText = si?.lastSlot != null
        ? `slot ${si.lastSlot} → next: ${si.currentSlot}`
        : `next: ${si?.currentSlot ?? '-'}`;
    const lastBackup = si?.lastBackup
        ? new Date(si.lastBackup).toLocaleString()
        : '-';

    card.innerHTML = `
        <div class="console-card-header">
            <div class="console-dot ${dotClass}"></div>
            <span class="console-name">${esc(c.name)}</span>
        </div>
        <div class="console-addr">${esc(c.ip)}:${c.port}</div>
        <div class="console-meta">${statusText}</div>
        ${si ? `<div class="console-meta">씬: ${esc(slotText)}</div>` : ''}
        ${si?.lastBackup ? `<div class="console-meta">백업: ${esc(lastBackup)}</div>` : ''}
        <div class="console-actions">
            <button class="btn small" onclick="editConsole('${c.id}')">수정</button>
            <button class="btn small danger" onclick="deleteConsole('${c.id}', '${esc(c.name)}')">삭제</button>
        </div>
    `;
    return card;
}

function updateConsoleCard(status) {
    const el = document.getElementById(`console-card-${status.id}`);
    if (!el) return;
    const newCard = buildConsoleCard(status, status);
    el.replaceWith(newCard);
}

function populateConsoleSelects() {
    const backupSel = document.getElementById('backup-console-select');
    const scheduleSel = document.getElementById('sf-console');

    // Preserve current selection
    const prevBackup   = backupSel.value;
    const prevSchedule = scheduleSel.value;

    backupSel.innerHTML   = '<option value="">콘솔 선택...</option>';
    scheduleSel.innerHTML = '';

    for (const c of _consoles) {
        const label = `${c.name} (${c.ip})`;
        backupSel.appendChild(new Option(label, c.id));
        scheduleSel.appendChild(new Option(label, c.id));
    }

    if (prevBackup)   { backupSel.value = prevBackup; loadSlotPicker(prevBackup); }
    if (prevSchedule) scheduleSel.value = prevSchedule;
}

function toggleConsoleForm(open) {
    const form = document.getElementById('console-form');
    const isOpen = form.classList.contains('open');
    form.classList.toggle('open', open ?? !isOpen);
    if (!form.classList.contains('open')) clearConsoleForm();
}

function cancelConsoleForm() { toggleConsoleForm(false); }

function clearConsoleForm() {
    document.getElementById('cf-id').value   = '';
    document.getElementById('cf-name').value = '';
    document.getElementById('cf-ip').value   = '';
    document.getElementById('cf-port').value = '10023';
}

function editConsole(id) {
    const c = _consoles.find(x => x.id === id);
    if (!c) return;
    document.getElementById('cf-id').value   = c.id;
    document.getElementById('cf-name').value = c.name;
    document.getElementById('cf-ip').value   = c.ip;
    document.getElementById('cf-port').value = c.port;
    toggleConsoleForm(true);
}

async function submitConsole(e) {
    e.preventDefault();
    const id   = document.getElementById('cf-id').value;
    const body = {
        name: document.getElementById('cf-name').value.trim(),
        ip:   document.getElementById('cf-ip').value.trim(),
        port: parseInt(document.getElementById('cf-port').value, 10) || 10023,
    };

    try {
        if (id) {
            await api('PUT', `/api/consoles/${id}`, body);
            showToast('콘솔 수정 완료', 'ok');
        } else {
            await api('POST', '/api/consoles', body);
            showToast('콘솔 추가 완료', 'ok');
        }
        cancelConsoleForm();
        await loadConsoles();
    } catch (err) {
        showToast(`오류: ${err.message}`, 'err');
    }
}

async function deleteConsole(id, name) {
    if (!confirm(`"${name}" 콘솔을 삭제하시겠습니까?\n해당 콘솔을 참조하는 스케줄이 있으면 삭제할 수 없습니다.`)) return;
    try {
        await api('DELETE', `/api/consoles/${id}`);
        showToast('콘솔 삭제됨', 'ok');
        await loadConsoles();
        await loadSchedules();
    } catch (err) {
        showToast(`오류: ${err.message}`, 'err');
    }
}

// ── Status Polling ───────────────────────────────────────────────────────────

async function refreshStatus() {
    if (!_consoles.length) return;

    try {
        const statuses = await api('GET', '/api/status');

        // Update each console card
        for (const s of statuses) {
            updateConsoleCard(s);
        }

        // Update header summary
        const online  = statuses.filter(s => s.reachable).length;
        const total   = statuses.length;
        document.getElementById('header-summary').textContent =
            `콘솔 ${online}/${total} 연결됨`;
    } catch (e) {
        document.getElementById('header-summary').textContent = '상태 확인 실패';
    }
}

// ── Polling ───────────────────────────────────────────────────────────────────

let _pollingTimer = null;

function startPolling(seconds) {
    if (_pollingTimer) clearInterval(_pollingTimer);
    _pollingTimer = null;
    if (seconds > 0) {
        _pollingTimer = setInterval(refreshStatus, seconds * 1000);
    }
}

// ── Quick Backup ─────────────────────────────────────────────────────────────

async function onBackupConsoleChange() {
    const consoleId = document.getElementById('backup-console-select').value;
    await loadSlotPicker(consoleId);
}

async function loadSlotPicker(consoleId) {
    const empty = document.getElementById('slot-picker-empty');
    const table = document.getElementById('slot-picker-table');
    const tbody = document.getElementById('slot-picker-body');

    if (!consoleId) {
        empty.textContent = '콘솔을 선택하면 씬 슬롯이 표시됩니다.';
        empty.style.display = 'block';
        table.style.display = 'none';
        return;
    }

    try {
        const status = await api('GET', `/api/status/${consoleId}`);
        const { sceneIndex, schedules: schInfo = [] } = status;
        const rawSlots = sceneIndex?.slots || {};
        const slots = Object.fromEntries(
            Object.entries(rawSlots).map(([k, v]) => [k, typeof v === 'string' ? { time: v } : v])
        );

        // slot -> [{ name, color }] 매핑
        const nextMap = {};
        for (const sch of schInfo) {
            if (!nextMap[sch.nextSlot]) nextMap[sch.nextSlot] = [];
            nextMap[sch.nextSlot].push(sch);
        }

        empty.style.display = 'none';
        table.style.display = 'table';
        tbody.innerHTML = '';

        for (let s = 0; s <= 99; s++) {
            const info    = slots[String(s)] || null;
            const nexts   = nextMap[s] || [];
            const timeStr = info?.time ? new Date(info.time).toLocaleString() : null;
            const nameStr = info?.name || null;

            const nextBadges = nexts.map(sch =>
                `<span class="badge next-badge" style="background:${esc(sch.color)}22;color:${esc(sch.color)};border:1px solid ${esc(sch.color)}66" title="${esc(sch.name)}">다음</span>`
            ).join('');

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><code>Slot ${s}</code>${nextBadges ? ' ' + nextBadges : ''}</td>
                <td>${nameStr ? esc(nameStr) : '<span style="color:var(--muted)">-</span>'}</td>
                <td>${timeStr ? esc(timeStr) : '<span style="color:var(--muted)">비어있음</span>'}</td>
                <td style="display:flex; gap:8px; align-items:center;">
                    <button class="btn small primary" onclick="openBackupModal('${esc(consoleId)}', ${s}, ${!!info})">Backup</button>
                    ${info ? `<button class="btn small restore" onclick="triggerRestore('${esc(consoleId)}', ${s})">Restore</button>` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        }
    } catch (e) {
        showToast('슬롯 목록 로드 실패', 'err');
    }
}

let _pendingBackup = null;

function openBackupModal(consoleId, slot, hasExisting) {
    _pendingBackup = { consoleId, slot, hasExisting };
    document.getElementById('bm-slot-label').textContent = `Slot ${slot}`;
    document.getElementById('bm-name').value = '';
    document.getElementById('bm-desc').value = '';
    document.getElementById('backup-modal').style.display = 'flex';
    document.getElementById('bm-name').focus();
}

function closeBackupModal() {
    _pendingBackup = null;
    document.getElementById('backup-modal').style.display = 'none';
}

function onModalOverlayClick(e) {
    if (e.target === document.getElementById('backup-modal')) closeBackupModal();
}

async function confirmBackup() {
    if (!_pendingBackup) return;
    const { consoleId, slot, hasExisting } = _pendingBackup;
    const name = document.getElementById('bm-name').value.trim();
    const desc = document.getElementById('bm-desc').value.trim();

    if (hasExisting && !confirm(`⚠️ Slot ${slot}에 이미 백업이 있습니다.\n덮어쓰시겠습니까?`)) return;

    closeBackupModal();
    try {
        await api('POST', '/api/backup/scene', { consoleId, slot, name, desc });
        showToast(`Slot ${slot} 백업 완료`, 'ok');
        loadSlotPicker(consoleId);
        refreshStatus();
    } catch (err) {
        showToast(`백업 실패: ${err.message}`, 'err');
    }
}

// Show 백업 (콘솔 선택 셀렉트 공유)
async function triggerBackup(type) {
    const consoleId = document.getElementById('backup-console-select').value;
    if (!consoleId) { showToast('콘솔을 먼저 선택하세요', 'err'); return; }

    try {
        const res = await api('POST', `/api/backup/${type}`, { consoleId });
        showToast(`Show 백업 완료: ${res.name}`, 'ok');
        refreshStatus();
    } catch (err) {
        showToast(`백업 실패: ${err.message}`, 'err');
    }
}

// ── Scene Restore ─────────────────────────────────────────────────────────────

async function triggerRestore(consoleId, slot) {
    if (!confirm(`⚠️ Slot ${slot}의 씬을 복구하시겠습니까?\n\n콘솔의 현재 상태가 즉시 변경됩니다.\n라이브 공연 중에는 절대 사용하지 마세요.`)) return;

    try {
        await api('POST', '/api/backup/scene/restore', { consoleId, slot });
        showToast(`Slot ${slot} 복구 완료`, 'ok');
        loadSceneList();
    } catch (err) {
        showToast(`복구 실패: ${err.message}`, 'err');
    }
}

// ── Schedules ────────────────────────────────────────────────────────────────

async function loadSchedules() {
    const schedules = await api('GET', '/api/schedules');
    renderSchedules(schedules);
}

function consoleName(consoleId) {
    const c = _consoles.find(x => x.id === consoleId);
    return c ? c.name : consoleId;
}

function renderSchedules(schedules) {
    const empty = document.getElementById('empty-schedules');
    const table = document.getElementById('schedules-table');
    const tbody = document.getElementById('schedules-body');

    if (!schedules.length) {
        empty.style.display = 'block';
        table.style.display = 'none';
        return;
    }

    empty.style.display = 'none';
    table.style.display = 'table';
    tbody.innerHTML = '';

    for (const s of schedules) {
        const tr = document.createElement('tr');
        const rangeText = s.slotRange ? `${s.slotRange.start}~${s.slotRange.end}` : '기본값';
        const color = s.color || '#4a9eff';
        tr.innerHTML = `
            <td><span class="sched-color-dot" style="background:${esc(color)}"></span></td>
            <td>${esc(s.name)}</td>
            <td>${esc(consoleName(s.consoleId))}</td>
            <td><code>${esc(rangeText)}</code></td>
            <td><code>${esc(s.cron)}</code></td>
            <td><span class="badge ${s.enabled ? 'active' : 'inactive'}">${s.enabled ? '활성' : '비활성'}</span></td>
            <td class="actions">
                <button class="btn small" onclick="editSchedule('${s.id}')">수정</button>
                <button class="btn small" onclick="toggleSchedule('${s.id}', ${s.enabled})">${s.enabled ? '비활성화' : '활성화'}</button>
                <button class="btn small danger" onclick="deleteSchedule('${s.id}', '${esc(s.name)}')">삭제</button>
            </td>
        `;
        tbody.appendChild(tr);
    }
}

function toggleScheduleForm(open) {
    const form = document.getElementById('schedule-form');
    const isOpen = form.classList.contains('open');
    form.classList.toggle('open', open ?? !isOpen);
    if (!form.classList.contains('open')) clearScheduleForm();
}

function cancelScheduleForm() { toggleScheduleForm(false); }

function clearScheduleForm() {
    document.getElementById('sf-id').value         = '';
    document.getElementById('sf-name').value       = '';
    document.getElementById('sf-color').value      = '#4a9eff';
    document.getElementById('sf-cron').value       = '';
    document.getElementById('sf-slot-start').value = '';
    document.getElementById('sf-slot-end').value   = '';
    document.getElementById('sf-enabled').checked  = true;
    if (_consoles.length) document.getElementById('sf-console').value = _consoles[0].id;
}

async function editSchedule(id) {
    const schedules = await api('GET', '/api/schedules');
    const s = schedules.find(x => x.id === id);
    if (!s) return;
    document.getElementById('sf-id').value         = s.id;
    document.getElementById('sf-name').value       = s.name;
    document.getElementById('sf-color').value      = s.color || '#4a9eff';
    document.getElementById('sf-console').value    = s.consoleId;
    document.getElementById('sf-cron').value       = s.cron;
    document.getElementById('sf-slot-start').value = s.slotRange?.start ?? '';
    document.getElementById('sf-slot-end').value   = s.slotRange?.end   ?? '';
    document.getElementById('sf-enabled').checked  = s.enabled;
    toggleScheduleForm(true);
}

async function submitSchedule(e) {
    e.preventDefault();
    const id       = document.getElementById('sf-id').value;
    const slotStart = parseInt(document.getElementById('sf-slot-start').value, 10);
    const slotEnd   = parseInt(document.getElementById('sf-slot-end').value, 10);
    const body = {
        name:      document.getElementById('sf-name').value.trim(),
        consoleId: document.getElementById('sf-console').value,
        color:     document.getElementById('sf-color').value,
        cron:      document.getElementById('sf-cron').value.trim(),
        enabled:   document.getElementById('sf-enabled').checked,
        ...(!isNaN(slotStart) && !isNaN(slotEnd)
            ? { slotRange: { start: slotStart, end: slotEnd } }
            : {}),
    };

    try {
        if (id) {
            await api('PUT', `/api/schedules/${id}`, body);
            showToast('스케줄 수정 완료', 'ok');
        } else {
            await api('POST', '/api/schedules', body);
            showToast('스케줄 추가 완료', 'ok');
        }
        cancelScheduleForm();
        loadSchedules();
    } catch (err) {
        showToast(`오류: ${err.message}`, 'err');
    }
}

async function toggleSchedule(id, currentEnabled) {
    try {
        await api('PUT', `/api/schedules/${id}`, { enabled: !currentEnabled });
        loadSchedules();
    } catch (err) {
        showToast(`오류: ${err.message}`, 'err');
    }
}

async function deleteSchedule(id, name) {
    if (!confirm(`"${name}" 스케줄을 삭제하시겠습니까?`)) return;
    try {
        await api('DELETE', `/api/schedules/${id}`);
        showToast('스케줄 삭제됨', 'ok');
        loadSchedules();
    } catch (err) {
        showToast(`오류: ${err.message}`, 'err');
    }
}

// ── Live Logs (SSE) ──────────────────────────────────────────────────────────

const logContainer = document.getElementById('log-container');
let autoScroll = true;

logContainer.addEventListener('scroll', () => {
    const { scrollTop, scrollHeight, clientHeight } = logContainer;
    autoScroll = scrollHeight - scrollTop - clientHeight < 40;
});

function appendLogEntry(entry) {
    const ts    = entry.time ? new Date(entry.time).toLocaleTimeString() : '';
    const level = entry.level || 'info';
    const msg   = entry.msg || '';
    const extras = Object.entries(entry)
        .filter(([k]) => !['time', 'level', 'msg'].includes(k))
        .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
        .join(' ');

    const div = document.createElement('div');
    div.className = 'log-entry';
    div.innerHTML = `
        <span class="log-time">${esc(ts)}</span>
        <span class="log-level ${level}">${level.toUpperCase()}</span>
        <span class="log-msg">${esc(msg)}${extras ? ' ' + esc(extras) : ''}</span>
    `;
    logContainer.appendChild(div);
    if (autoScroll) logContainer.scrollTop = logContainer.scrollHeight;
}

function clearLogs() { logContainer.innerHTML = ''; }

const evtSource = new EventSource('/api/logs/stream');
evtSource.onmessage = (e) => { try { appendLogEntry(JSON.parse(e.data)); } catch {} };
evtSource.onerror   = ()  => { console.warn('SSE connection lost, will retry...'); };

// ── Helpers ──────────────────────────────────────────────────────────────────

async function api(method, url, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res  = await fetch(url, opts);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || res.statusText);
    return json;
}

function esc(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function showToast(msg, type = '') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}


// ── Settings ──────────────────────────────────────────────────────────────────

const POLLING_LS_KEY = 'm32_polling_interval';
const POLLING_DEFAULT = 60;

async function initSettings() {
    // Priority: localStorage → server config → default
    const local = localStorage.getItem(POLLING_LS_KEY);
    if (local !== null) {
        applyPollingInterval(parseInt(local, 10));
        return;
    }
    try {
        const data = await api('GET', '/api/config/ui');
        applyPollingInterval(data.pollingInterval ?? POLLING_DEFAULT);
    } catch {
        applyPollingInterval(POLLING_DEFAULT);
    }
}

function applyPollingInterval(seconds) {
    const sel = document.getElementById('polling-interval-select');
    // Select matching option, or closest if custom
    const match = [...sel.options].find(o => parseInt(o.value) === seconds);
    sel.value = match ? String(seconds) : String(POLLING_DEFAULT);
    startPolling(seconds);
}

async function saveSettings() {
    const seconds = parseInt(document.getElementById('polling-interval-select').value, 10);
    const location = document.getElementById('settings-save-location').value;
    const status = document.getElementById('settings-status');

    startPolling(seconds);

    try {
        if (location === 'server') {
            await api('PUT', '/api/config/ui', { pollingInterval: seconds });
            localStorage.removeItem(POLLING_LS_KEY);
            status.textContent = '서버 config.json에 저장됨';
        } else {
            localStorage.setItem(POLLING_LS_KEY, String(seconds));
            status.textContent = '브라우저에 저장됨';
        }
        status.className = 'settings-status ok';
        showToast('설정 저장 완료', 'ok');
    } catch (err) {
        status.textContent = `저장 실패: ${err.message}`;
        status.className = 'settings-status err';
        showToast(`저장 실패: ${err.message}`, 'err');
    }

    setTimeout(() => { status.textContent = ''; status.className = 'settings-status'; }, 4000);
}

// ── Init ─────────────────────────────────────────────────────────────────────

(async () => {
    await initSettings();
    await loadConsoles();   // loads consoles → populates selects → triggers refreshStatus
    await loadSchedules();
})();
