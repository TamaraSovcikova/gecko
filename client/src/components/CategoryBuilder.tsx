import React from "react";

export type CategoryDraft = {
  name: string;
  amount: number | string;
};

type Props = {
  categories: CategoryDraft[];
  onAddCategory: () => void;
  onRemoveCategory: (index: number) => void;
  onUpdateCategory: (index: number, field: "name" | "amount", value: string) => void;
  totalCategoryAmount: number;
  isOverAllocated?: boolean;
  disabled?: boolean;
};

const CategoryBuilder: React.FC<Props> = ({
  categories,
  onAddCategory,
  onRemoveCategory,
  onUpdateCategory,
  totalCategoryAmount,
  isOverAllocated = false,
  disabled = false,
}) => {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h2 className="h5 mb-0">Categories</h2>
        <button
          type="button"
          className="gecko-pill-btn payslip-add-category-btn"
          style={{
            border: "1px solid #c9bde8",
            color: "#5c3fa3",
            backgroundColor: "#ede8f8",
            borderRadius: "999px",
            fontWeight: 600,
            padding: "6px 12px",
          }}
          onClick={onAddCategory}
          disabled={disabled}
        >
          Add Category
        </button>
      </div>

      {categories.map((category, index) => (
        <div className="row g-2 mb-2 payslip-category-row" key={`category-${index}`} style={{ padding: "8px", border: "1px solid #ede8f8", borderRadius: "10px", background: "#faf9fd" }}>
          <div className="col-12 col-md-7">
            <input
              type="text"
              className="form-control"
              placeholder="Category name (Rent, Food, Savings)"
              value={category.name}
              onChange={(e) => onUpdateCategory(index, "name", e.target.value)}
            />
          </div>
          <div className="col-8 col-md-4">
            <input
              type="number"
              className="form-control"
              placeholder="Amount"
              min="0"
              step="0.01"
              value={category.amount}
              disabled={disabled}
              onChange={(e) => onUpdateCategory(index, "amount", e.target.value)}
            />
          </div>
          <div className="col-4 col-md-1 d-grid">
            <button
              type="button"
              className="gecko-pill-btn payslip-remove-category-btn"
              style={{
                border: "1px solid #ddb5b5",
                color: "#8e4852",
                backgroundColor: "#f9ecef",
                fontWeight: 700,
              }}
              onClick={() => onRemoveCategory(index)}
              disabled={disabled || categories.length === 1}
            >
              X
            </button>
          </div>
        </div>
      ))}

      <p className="small mt-2 mb-3" style={{ color: isOverAllocated ? "#b44f5f" : "#7a6e99", fontWeight: 600 }}>
        Total category allocation: {Number(totalCategoryAmount || 0).toFixed(2)}
      </p>
    </>
  );
};

export default CategoryBuilder;
