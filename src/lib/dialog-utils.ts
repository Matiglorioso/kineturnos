const DEFAULT_DETAIL_CLOSE_DELAY_MS = 200;

export function closeDetailBeforeAction(
  onCloseDetail: () => void,
  onClearSelection: () => void,
  action: () => void,
  delayMs = DEFAULT_DETAIL_CLOSE_DELAY_MS
) {
  onCloseDetail();
  onClearSelection();
  window.setTimeout(action, delayMs);
}
