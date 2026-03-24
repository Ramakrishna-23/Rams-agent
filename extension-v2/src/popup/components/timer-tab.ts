// Pomodoro Focus Timer tab — with project selection + API session logging

type TimerPhase = "idle" | "focus" | "rest";

interface Project {
  id: string;
  name: string;
  color?: string;
}

interface TimerState {
  phase: TimerPhase;
  remaining: number;       // seconds left in current phase
  startedAt: number | null; // epoch ms when current phase started
  focusMin: number;
  restMin: number;
  totalFocusedSecs: number; // accumulated focus seconds (cross-session)
  selectedProjectId: string | null;
  selectedProjectName: string | null;
  focusStartedAt: number | null; // epoch ms when focus phase first began (for API logging)
}

const STORAGE_KEY = "rams_pomodoro_state";

function fmtCountdown(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function fmtTotal(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h === 0) return `${m}min${m !== 1 ? "s" : ""}`;
  return `${h}hr ${m}min${m !== 1 ? "s" : ""}`;
}

function getSettings(): Promise<{ apiUrl: string; apiKey: string }> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["apiUrl", "apiKey"], (result) => {
      resolve({
        apiUrl: (result.apiUrl as string) || "http://localhost:8000",
        apiKey: (result.apiKey as string) || "",
      });
    });
  });
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const { apiUrl, apiKey } = await getSettings();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["X-API-Key"] = apiKey;
  const res = await fetch(`${apiUrl}${path}`, { ...options, headers: { ...headers, ...(options?.headers as Record<string, string> || {}) } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

async function fetchProjects(): Promise<Project[]> {
  return apiFetch<Project[]>("/api/projects");
}

async function logTimeSession(projectId: string, durationSecs: number, startedAt: Date): Promise<void> {
  const ended = new Date();
  await apiFetch(`/api/projects/${projectId}/time-sessions`, {
    method: "POST",
    body: JSON.stringify({
      duration_seconds: durationSecs,
      started_at: startedAt.toISOString(),
      ended_at: ended.toISOString(),
    }),
  });
}

async function loadState(): Promise<TimerState> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      if (result[STORAGE_KEY]) {
        resolve(result[STORAGE_KEY] as TimerState);
      } else {
        resolve({
          phase: "idle",
          remaining: 25 * 60,
          startedAt: null,
          focusMin: 25,
          restMin: 5,
          totalFocusedSecs: 0,
          selectedProjectId: null,
          selectedProjectName: null,
          focusStartedAt: null,
        });
      }
    });
  });
}

async function saveState(state: TimerState): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: state }, resolve);
  });
}

/** Reconcile elapsed time when popup was closed */
function reconcileState(state: TimerState): TimerState {
  if (state.phase === "idle" || !state.startedAt) return state;

  const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
  const remaining = state.remaining - elapsed;

  if (state.phase === "focus") {
    if (remaining <= 0) {
      const earned = state.focusMin * 60;
      return {
        ...state,
        phase: state.restMin > 0 ? "rest" : "idle",
        remaining: state.restMin > 0 ? Math.max(0, state.restMin * 60 + remaining) : 0,
        startedAt: state.restMin > 0 ? Date.now() : null,
        totalFocusedSecs: state.totalFocusedSecs + earned,
        focusStartedAt: null,
      };
    }
    return { ...state, remaining: Math.max(0, remaining), startedAt: Date.now() };
  }

  if (state.phase === "rest") {
    if (remaining <= 0) {
      return { ...state, phase: "idle", remaining: 0, startedAt: null };
    }
    return { ...state, remaining: Math.max(0, remaining), startedAt: Date.now() };
  }

  return state;
}

export function initTimerTab(): void {
  const container = document.getElementById("tab-timer");
  if (!container) return;

  container.innerHTML = `
    <div class="timer-panel">

      <!-- Project selector -->
      <div class="timer-project-row">
        <label class="timer-input-label" style="margin-bottom:4px;display:block;">Project (optional)</label>
        <div class="timer-project-select-wrapper">
          <select id="timer-project-select" class="timer-project-select">
            <option value="">— No project —</option>
          </select>
          <button id="timer-project-refresh" class="timer-project-refresh-btn" title="Refresh projects">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
        </div>
        <div id="timer-project-status" class="timer-project-status"></div>
      </div>

      <!-- Header: title + total -->
      <div class="timer-header">
        <div class="timer-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          Focus Timer
        </div>
        <div id="timer-total-display" class="timer-total hidden"></div>
      </div>

      <!-- Duration inputs -->
      <div class="timer-inputs">
        <div class="timer-input-group">
          <label class="timer-input-label">Focus (min)</label>
          <input id="timer-focus-input" type="number" min="1" value="25" class="timer-number-input" />
        </div>
        <div class="timer-input-group">
          <label class="timer-input-label">Rest (min)</label>
          <input id="timer-rest-input" type="number" min="0" value="5" class="timer-number-input" />
        </div>
      </div>

      <!-- Countdown + controls -->
      <div class="timer-display-row">
        <div id="timer-countdown" class="timer-countdown">25:00</div>
        <div class="timer-controls">
          <button id="timer-start-btn" class="btn btn-primary btn-timer-action">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Start
          </button>
          <button id="timer-stop-btn" class="btn btn-danger btn-timer-action hidden">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
            Stop
          </button>
          <span id="timer-phase-badge" class="timer-phase-badge hidden"></span>
        </div>
      </div>

      <!-- Log message -->
      <div id="timer-log-msg" class="timer-log-msg hidden"></div>
    </div>
  `;

  // Element refs
  const countdownEl    = document.getElementById("timer-countdown")!;
  const totalDisplayEl = document.getElementById("timer-total-display")!;
  const startBtn       = document.getElementById("timer-start-btn") as HTMLButtonElement;
  const stopBtn        = document.getElementById("timer-stop-btn") as HTMLButtonElement;
  const phaseBadge     = document.getElementById("timer-phase-badge")!;
  const logMsgEl       = document.getElementById("timer-log-msg")!;
  const focusInput     = document.getElementById("timer-focus-input") as HTMLInputElement;
  const restInput      = document.getElementById("timer-rest-input") as HTMLInputElement;
  const projectSelect  = document.getElementById("timer-project-select") as HTMLSelectElement;
  const refreshBtn     = document.getElementById("timer-project-refresh") as HTMLButtonElement;
  const projectStatus  = document.getElementById("timer-project-status")!;

  let state: TimerState = {
    phase: "idle", remaining: 25 * 60, startedAt: null,
    focusMin: 25, restMin: 5, totalFocusedSecs: 0,
    selectedProjectId: null, selectedProjectName: null, focusStartedAt: null,
  };
  let ticker: ReturnType<typeof setInterval> | null = null;
  let projects: Project[] = [];

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function showLog(msg: string, duration = 4000) {
    logMsgEl.textContent = msg;
    logMsgEl.classList.remove("hidden");
    setTimeout(() => logMsgEl.classList.add("hidden"), duration);
  }

  function updateUI() {
    const displaySecs = state.phase === "idle" ? state.focusMin * 60 : state.remaining;
    countdownEl.textContent = fmtCountdown(displaySecs);

    countdownEl.className = "timer-countdown";
    if (state.phase === "focus") countdownEl.classList.add("timer-countdown--focus");
    else if (state.phase === "rest") countdownEl.classList.add("timer-countdown--rest");

    const isIdle = state.phase === "idle";
    startBtn.classList.toggle("hidden", !isIdle);
    stopBtn.classList.toggle("hidden", isIdle);
    focusInput.disabled = !isIdle;
    restInput.disabled = !isIdle;
    projectSelect.disabled = !isIdle;
    refreshBtn.disabled = !isIdle;

    if (isIdle) {
      phaseBadge.classList.add("hidden");
    } else {
      phaseBadge.classList.remove("hidden");
      phaseBadge.textContent = state.phase === "focus" ? "Focus" : "Rest";
      phaseBadge.className = `timer-phase-badge timer-phase-badge--${state.phase}`;
    }

    // Total focused time pill
    if (state.totalFocusedSecs > 0) {
      totalDisplayEl.classList.remove("hidden");
      totalDisplayEl.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <strong>${fmtTotal(state.totalFocusedSecs)}</strong>&nbsp;Total Focused
      `;
    } else {
      totalDisplayEl.classList.add("hidden");
    }

    // Restore project selection in dropdown
    if (state.selectedProjectId && projectSelect.options.length > 1) {
      projectSelect.value = state.selectedProjectId;
    }
  }

  // ── Project loading ──────────────────────────────────────────────────────────

  async function loadProjects(silent = false) {
    if (!silent) {
      projectStatus.textContent = "Loading projects…";
      projectStatus.className = "timer-project-status";
    }
    try {
      projects = await fetchProjects();
      // Rebuild options
      while (projectSelect.options.length > 1) projectSelect.remove(1);
      projects.forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.name;
        projectSelect.appendChild(opt);
      });
      if (state.selectedProjectId) projectSelect.value = state.selectedProjectId;
      if (!silent) {
        projectStatus.textContent = `${projects.length} project${projects.length !== 1 ? "s" : ""} loaded`;
        projectStatus.className = "timer-project-status timer-project-status--ok";
        setTimeout(() => { projectStatus.textContent = ""; }, 3000);
      }
    } catch {
      projectStatus.textContent = "Could not load projects — check Settings";
      projectStatus.className = "timer-project-status timer-project-status--err";
    }
  }

  // ── API session logging ──────────────────────────────────────────────────────

  async function doLogSession(durationSecs: number, startedAtMs: number) {
    if (!state.selectedProjectId || durationSecs <= 0) return;
    try {
      await logTimeSession(state.selectedProjectId, durationSecs, new Date(startedAtMs));
      showLog(`✓ ${fmtTotal(durationSecs)} logged to "${state.selectedProjectName}"`);
    } catch {
      showLog("⚠ Could not log session to API — check Settings", 6000);
    }
  }

  // ── Ticker ───────────────────────────────────────────────────────────────────

  function stopTicker() {
    if (ticker) { clearInterval(ticker); ticker = null; }
  }

  function startTicker() {
    stopTicker();
    ticker = setInterval(async () => {
      state.remaining = Math.max(0, state.remaining - 1);

      if (state.phase === "focus" && state.remaining <= 0) {
        // Focus complete — accumulate + log to API
        const earned = state.focusMin * 60;
        const sessionStart = state.focusStartedAt ?? Date.now() - earned * 1000;
        state.totalFocusedSecs += earned;

        await doLogSession(earned, sessionStart);

        if (state.restMin > 0) {
          state.phase = "rest";
          state.remaining = state.restMin * 60;
          state.startedAt = Date.now();
          state.focusStartedAt = null;
          showLog("Focus done! Time to rest 🎉");
        } else {
          state.phase = "idle";
          state.remaining = 0;
          state.startedAt = null;
          state.focusStartedAt = null;
          stopTicker();
          showLog(`Session done ✓ — ${fmtTotal(state.totalFocusedSecs)} focused total`, 5000);
        }
      } else if (state.phase === "rest" && state.remaining <= 0) {
        state.phase = "idle";
        state.remaining = 0;
        state.startedAt = null;
        state.focusStartedAt = null;
        stopTicker();
        showLog("Rest done — ready for next session!");
      }

      await saveState(state);
      updateUI();
    }, 1000);
  }

  // ── Init ─────────────────────────────────────────────────────────────────────

  loadState().then(async (loaded) => {
    state = reconcileState(loaded);
    focusInput.value = String(state.focusMin);
    restInput.value = String(state.restMin);
    updateUI();
    await saveState(state);
    if (state.phase !== "idle") startTicker();
    await loadProjects(true);
    // Restore selection after loading
    if (state.selectedProjectId) projectSelect.value = state.selectedProjectId;
  });

  // ── Event listeners ──────────────────────────────────────────────────────────

  refreshBtn.addEventListener("click", () => loadProjects(false));

  projectSelect.addEventListener("change", async () => {
    const sel = projectSelect.options[projectSelect.selectedIndex];
    state.selectedProjectId = sel.value || null;
    state.selectedProjectName = sel.value ? sel.text : null;
    await saveState(state);
  });

  focusInput.addEventListener("input", async () => {
    const v = Math.max(1, parseInt(focusInput.value) || 1);
    state.focusMin = v;
    updateUI();
    await saveState(state);
  });

  restInput.addEventListener("input", async () => {
    state.restMin = Math.max(0, parseInt(restInput.value) || 0);
    await saveState(state);
  });

  startBtn.addEventListener("click", async () => {
    if (state.phase !== "idle") return;
    state.focusMin = Math.max(1, parseInt(focusInput.value) || 1);
    state.restMin  = Math.max(0, parseInt(restInput.value) || 0);
    const now = Date.now();
    state.phase = "focus";
    state.remaining = state.focusMin * 60;
    state.startedAt = now;
    state.focusStartedAt = now;
    await saveState(state);
    updateUI();
    startTicker();
  });

  stopBtn.addEventListener("click", async () => {
    if (state.phase === "idle") return;
    stopTicker();

    if (state.phase === "focus" && state.startedAt) {
      const elapsed = state.focusMin * 60 - state.remaining;
      if (elapsed > 0) {
        state.totalFocusedSecs += elapsed;
        await doLogSession(elapsed, state.focusStartedAt ?? state.startedAt);
      }
    }

    state.phase = "idle";
    state.remaining = state.focusMin * 60;
    state.startedAt = null;
    state.focusStartedAt = null;
    await saveState(state);
    updateUI();
  });
}
