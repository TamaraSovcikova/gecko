export const attachDashboardDebug = (deps: {
  snapshots: any[];
  setPopupSnapshot: (s: any) => void;
  setShowSnapshotPopup: (v: boolean) => void;
}) => {
  if (import.meta.env.PROD) return;

  (window as any).triggerSnapshotPopup = (index = 0) => {
    const snap = deps.snapshots[index];

    if (!snap) {
      console.warn("No snapshot at index:", index);
      return;
    }

    deps.setPopupSnapshot(snap);
    deps.setShowSnapshotPopup(true);
  };

  (window as any).closeSnapshotPopup = () => {
    deps.setShowSnapshotPopup(false);
  };
};
