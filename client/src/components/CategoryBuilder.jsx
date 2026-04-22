import React from "react";

const CategoryBuilder = ({
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
          className="btn btn-sm btn-outline-primary"
          onClick={onAddCategory}
          disabled={disabled}
        >
          Add Category
        </button>
      </div>

      {categories.map((category, index) => (
        <div className="row g-2 mb-2" key={`category-${index}`}>
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
              className="btn btn-outline-danger"
              onClick={() => onRemoveCategory(index)}
              disabled={disabled || categories.length === 1}
            >
              X
            </button>
          </div>
        </div>
      ))}

      <p className={`small mt-2 mb-3 ${isOverAllocated ? "text-danger" : "text-muted"}`}>
        Total category allocation: {Number(totalCategoryAmount || 0).toFixed(2)}
      </p>
    </>
  );
};

export default CategoryBuilder;
