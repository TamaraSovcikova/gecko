import React from "react";

type Props = {
  snapshots: any[];
  snapshotIndex: number | null;
  setSnapshotIndex: (i: number | null) => void;
};

const SnapshotNavigator = ({
  snapshots,
  snapshotIndex,
  setSnapshotIndex,
}: Props) => {
  const currentIndex = snapshotIndex ?? -1;
  const hasSnapshots = snapshots.length > 0;

  const goOlder = () => {
    if (!hasSnapshots) return;

    if (snapshotIndex === null) {
      setSnapshotIndex(0);
    } else if (snapshotIndex < snapshots.length - 1) {
      setSnapshotIndex(snapshotIndex + 1);
    }
  };

  const goNewer = () => {
    if (snapshotIndex === null) return;

    if (snapshotIndex > 0) {
      setSnapshotIndex(snapshotIndex - 1);
    } else {
      setSnapshotIndex(null); // live mode
    }
  };

  return (
    <div
      style={{
        marginTop: "60px",
        paddingTop: "20px",
        borderTop: "1px solid #c9bde8",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "12px",
      }}
    >
      {/* Left arrow */}
      <button onClick={goOlder} disabled={!hasSnapshots}>
        ◀
      </button>

      {/* Dropdown (central control) */}
      <select
        value={snapshotIndex ?? ""}
        onChange={(e) => {
          const val = e.target.value;

          if (val === "") {
            setSnapshotIndex(null); // live mode
          } else {
            setSnapshotIndex(Number(val));
          }
        }}
        style={{
          padding: "6px 10px",
          borderRadius: "6px",
        }}
      >
        <option value="">Live (Current Month)</option>

        {snapshots.map((s, i) => (
          <option key={i} value={i}>
            {s.month}/{s.year}
          </option>
        ))}
      </select>

      {/* Right arrow */}
      <button onClick={goNewer} disabled={snapshotIndex === null}>
        ▶
      </button>
    </div>
  );
};

export default SnapshotNavigator;