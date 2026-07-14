import { ensureInitialState, loadState, normalizeStoredState, updateState, STORAGE_KEY } from '../data/storage';
import { reconcileRecurringInstances } from '../domain/recurrence';
import { completePomodoroPhase } from '../domain/pomodoro';
import type { AppState } from '../domain/models';
import { blockingRulesKey, syncBlockingRules } from './blockingRules';

const RECURRENCE_ALARM = 'five-recurrence';
const POMODORO_ALARM = 'five-pomodoro';
const BLOCK_RESUME_ALARM = 'five-block-resume';

let backgroundQueue = Promise.resolve();
let initializationPromise: Promise<void> | null = null;

function queueBackgroundTask(task: () => Promise<void>): Promise<void> {
  backgroundQueue = backgroundQueue.catch(() => undefined).then(task);
  return backgroundQueue;
}

function runSafely(task: Promise<unknown>): void {
  void task.catch((error) => console.error('[Five background]', error));
}

async function scheduleBlockingResume(state: AppState): Promise<void> {
  await chrome.alarms.clear(BLOCK_RESUME_ALARM);
  if (state.blockingPausedUntil && state.blockingPausedUntil > Date.now()) {
    await chrome.alarms.create(BLOCK_RESUME_ALARM, { when: state.blockingPausedUntil });
  }
}

async function syncLatestBlockingState(syncRules: boolean, syncPause: boolean): Promise<void> {
  const state = await loadState();
  if (syncRules) await syncBlockingRules(state);
  if (syncPause) await scheduleBlockingResume(state);
}

async function initialize(): Promise<void> {
  await ensureInitialState();
  await chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });
  await queueBackgroundTask(() => syncLatestBlockingState(true, true));
  await chrome.alarms.create(RECURRENCE_ALARM, { periodInMinutes: 15 });
  await chrome.alarms.create(POMODORO_ALARM, { periodInMinutes: 0.5 });
}

function ensureInitialized(): Promise<void> {
  if (!initializationPromise) {
    initializationPromise = initialize().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }
  return initializationPromise;
}

async function reconcileRecurrence(): Promise<void> {
  await updateState((current) => reconcileRecurringInstances(current));
  await queueBackgroundTask(() => syncLatestBlockingState(true, false));
}

async function resumeBlocking(): Promise<void> {
  await queueBackgroundTask(() => syncLatestBlockingState(true, false));
}

async function completePomodoro(): Promise<void> {
  await updateState((current) => completePomodoroPhase(current));
}

chrome.runtime.onInstalled.addListener(() => runSafely(ensureInitialized()));
chrome.runtime.onStartup.addListener(() => runSafely(ensureInitialized()));

chrome.action.onClicked.addListener(() => {
  runSafely((async () => {
    await chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
  })());
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === RECURRENCE_ALARM) runSafely(reconcileRecurrence());
  else if (alarm.name === POMODORO_ALARM) runSafely(completePomodoro());
  else if (alarm.name === BLOCK_RESUME_ALARM) runSafely(resumeBlocking());
});

chrome.storage.onChanged.addListener((changes, area) => {
  const change = changes[STORAGE_KEY];
  if (area !== 'local' || !change) return;

  const nextState = normalizeStoredState(change.newValue);
  const previousState = change.oldValue !== undefined ? normalizeStoredState(change.oldValue) : null;
  const blockingChanged = !previousState || blockingRulesKey(previousState) !== blockingRulesKey(nextState);
  const pauseChanged = !previousState || previousState.blockingPausedUntil !== nextState.blockingPausedUntil;
  if (!blockingChanged && !pauseChanged) return;

  runSafely(queueBackgroundTask(() => syncLatestBlockingState(blockingChanged, pauseChanged)));
});

runSafely(ensureInitialized());
