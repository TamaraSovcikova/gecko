import React from "react";
import { Plus, X } from "lucide-react";
import { cn } from "../lib/utils";

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
  monthlyTakeHome?: number;
};

const CategoryBuilder: React.FC<Props> = ({
  categories,
  onAddCategory,
  onRemoveCategory,
  onUpdateCategory,
  totalCategoryAmount,
  isOverAllocated = false,
  disabled = false,
  monthlyTakeHome,
}) => {
  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Budget Categories</p>
          <p className="text-xs text-gray-500 mt-0.5">Monthly budget limit for each category.</p>
        </div>
        <button
          type="button"
          onClick={onAddCategory}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>

      <div className="space-y-2">
        {categories.map((category, index) => (
          <div key={`category-${index}`} className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Category name"
              value={category.name}
              onChange={(e) => onUpdateCategory(index, "name", e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
            />
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                placeholder="£/mo"
                min="0"
                step="0.01"
                value={category.amount}
                disabled={disabled}
                onChange={(e) => onUpdateCategory(index, "amount", e.target.value)}
                className="w-24 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all disabled:bg-gray-50"
              />
              {monthlyTakeHome &&
                monthlyTakeHome > 0 &&
                (() => {
                  const amt = Number(category.amount);
                  if (!amt || !Number.isFinite(amt)) return null;
                  const pct = Math.round((amt / monthlyTakeHome) * 100);
                  return <span className="text-[11px] text-gray-400 shrink-0 w-8 text-right">{pct}%</span>;
                })()}
            </div>
            <button
              type="button"
              onClick={() => onRemoveCategory(index)}
              disabled={disabled || categories.length === 1}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              aria-label="Remove category"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <p className={cn("mt-3 text-xs font-semibold", isOverAllocated ? "text-red-600" : "text-gray-400")}>
        Allocated: £{Number(totalCategoryAmount || 0).toFixed(2)}
        {isOverAllocated && " — exceeds gross salary"}
      </p>
    </div>
  );
};

export default CategoryBuilder;
