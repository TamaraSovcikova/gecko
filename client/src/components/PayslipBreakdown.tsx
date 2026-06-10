import React from "react";

export type PayslipCategory = {
  name?: string;
  amount?: number;
  budget?: number;
};

export type PayslipResult = {
  grossSalary?: number;
  taxPaid?: number;
  niPaid?: number;
  takeHomePay?: number;
  categories?: PayslipCategory[];
};

type Props = {
  result: PayslipResult | null;
  onContinue: () => void;
};

const PayslipBreakdown: React.FC<Props> = ({ result, onContinue }) => {
  if (!result) {
    return null;
  }

  return (
    <div className="app-surface" style={{ marginTop: "18px" }}>
      <div style={{ padding: "6px" }}>
        <h2 className="h5 mb-3">Payslip Breakdown</h2>
        <div className="row g-3">
          <div className="col-6 col-md-3">
            <div className="p-2 rounded border" style={{ background: "#faf9fd", borderColor: "#c9bde8" }}>
              <div className="small text-muted">Gross</div>
              <div className="fw-semibold">£{Number(result.grossSalary || 0).toFixed(2)}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-2 rounded border" style={{ background: "#faf9fd", borderColor: "#c9bde8" }} data-onboarding="breakdown-tax">
              <div className="small text-muted">Tax</div>
              <div className="fw-semibold">£{Number(result.taxPaid || 0).toFixed(2)}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-2 rounded border" style={{ background: "#faf9fd", borderColor: "#c9bde8" }} data-onboarding="breakdown-ni">
              <div className="small text-muted">NI</div>
              <div className="fw-semibold">£{Number(result.niPaid || 0).toFixed(2)}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-2 rounded border" style={{ background: "#ede8f8", borderColor: "#c9bde8" }} data-onboarding="breakdown-takehome">
              <div className="small text-muted">Take Home</div>
              <div className="fw-semibold" style={{ color: "#5c3fa3" }}>£{Number(result.takeHomePay || 0).toFixed(2)}</div>
            </div>
          </div>
        </div>

        {Array.isArray(result.categories) && result.categories.length > 0 && (
          <div className="mt-3">
            <h3 className="h6 mb-2">Category Allocation</h3>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "6px" }}>
              {result.categories.map((category, index) => (
                <li
                  style={{
                    backgroundColor: "#faf9fd",
                    border: "1px solid #ede8f8",
                    borderRadius: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                  }}
                  key={`${category.name || "category"}-${index}`}
                >
                  <span>{category.name}</span>
                  <strong>£{Number(category.amount ?? category.budget ?? 0).toFixed(2)}</strong>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tips Box */}
        <div className="app-note" style={{ marginTop: "24px" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <div style={{ fontSize: "24px", minWidth: "30px" }}>💡</div>
            <div>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600", color: "#1a1040" }}>
                Unlock Financial Insights
              </h4>
              <p style={{ margin: "0", fontSize: "13px", color: "#4a3f6b", lineHeight: "1.5" }}>
                Add your <strong>job title</strong> and <strong>location</strong> to your profile to unlock personalized salary insights and financial tips based on market data. Head to your profile to get started!
              </p>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end mt-3">
          <button type="button" className="gecko-pill-btn" style={{ border: "1px solid #4e358f", background: "#5c3fa3", color: "#fff", padding: "10px 16px", fontWeight: 700 }} onClick={onContinue}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayslipBreakdown;
