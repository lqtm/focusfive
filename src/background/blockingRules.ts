import type { AppState } from '../domain/models';
import { getActiveRecurringInstances } from '../domain/recurrence';

const RULE_ID_START = 10_000;
const MAX_MANAGED_RULES = 1_000;
const RULE_ID_END = RULE_ID_START + MAX_MANAGED_RULES;

function shouldBlock(state: AppState): boolean {
  const isPaused = Boolean(state.blockingPausedUntil && state.blockingPausedUntil > Date.now());
  if (isPaused) return false;

  const hasManualWork = state.tasks.some((task) => task.bucket === 'today' && !task.completedAt);
  const hasRoutineWork = getActiveRecurringInstances(state).length > 0;
  return hasManualWork || hasRoutineWork;
}

export function blockingRulesKey(state: AppState): string {
  const blocking = shouldBlock(state);
  return blocking ? `on:${state.blocklist.join('\n')}` : 'off';
}

function buildRules(state: AppState): chrome.declarativeNetRequest.Rule[] {
  if (!shouldBlock(state)) return [];

  return state.blocklist.slice(0, MAX_MANAGED_RULES).map((domain, index) => ({
    id: RULE_ID_START + index,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: { extensionPath: '/index.html?blocked=1' },
    },
    condition: {
      urlFilter: `||${domain}^`,
      resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
    },
  }));
}

export async function syncBlockingRules(state: AppState): Promise<void> {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const managedIds = existing
    .filter((rule) => rule.id >= RULE_ID_START && rule.id < RULE_ID_END)
    .map((rule) => rule.id);
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: managedIds,
    addRules: buildRules(state),
  });
}
