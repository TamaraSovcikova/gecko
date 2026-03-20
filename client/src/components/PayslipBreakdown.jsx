import React from "react";

const PayslipBreakdown = ({ result, onContinue }) => {
  if (!result) {
    return null;
  }

  return (
    <div className="card border-0 shadow-sm mt-4">
      <div className="card-body p-4">
        <h2 className="h5 mb-3">Payslip Breakdown</h2>
        <div className="row g-3">
          <div className="col-6 col-md-3">
            <div className="p-2 bg-light rounded border">
              <div className="small text-muted">Gross</div>
              <div className="fw-semibold">{Number(result.grossSalary || 0).toFixed(2)}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-2 bg-light rounded border">
              <div className="small text-muted">Tax</div>
              <div className="fw-semibold">{Number(result.taxPaid || 0).toFixed(2)}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-2 bg-light rounded border">
              <div className="small text-muted">NI</div>
              <div className="fw-semibold">{Number(result.niPaid || 0).toFixed(2)}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-2 bg-success-subtle rounded border border-success-subtle">
              <div className="small text-muted">Take Home</div>
              <div className="fw-semibold">{Number(result.takeHomePay || 0).toFixed(2)}</div>
            </div>
          </div>
        </div>

        {Array.isArray(result.categories) && result.categories.length > 0 && (
          <div className="mt-3">
            <h3 className="h6 mb-2">Category Allocation</h3>
            <ul className="list-group">
              {result.categories.map((category, index) => (
                <li
                  className="list-group-item d-flex justify-content-between"
                  key={`${category.name || "category"}-${index}`}
                >
                  <span>{category.name}</span>
                  <strong>{Number(category.amount ?? category.budget ?? 0).toFixed(2)}</strong>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="d-flex justify-content-end mt-3">
          <button type="button" className="btn btn-success" onClick={onContinue}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayslipBreakdown;
