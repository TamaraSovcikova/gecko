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
        marginTop: "38px",
        paddingTop: "16px",
        borderTop: "1px solid #c9bde8",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "10px",
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: "12px", color: "#7a6e99", fontWeight: 700 }}>
        View month
      </span>
      {/* Left arrow */}
      <button className="gecko-pill-btn" onClick={goOlder} disabled={!hasSnapshots}>
        ◀
      </button>

      {/* Dropdown (central control) */}
      <select
        className="gecko-input"
        value={snapshotIndex ?? ""}
        onChange={(e) => {
          const val = e.target.value;

          if (val === "") {
            setSnapshotIndex(null); // live mode
          } else {
            setSnapshotIndex(Number(val));
          }
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
      <button className="gecko-pill-btn" onClick={goNewer} disabled={snapshotIndex === null}>
        ▶
      </button>
    </div>
  );
};

export default SnapshotNavigator;