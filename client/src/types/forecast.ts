export interface ForecastWarning {
    id: string;
    type: "overspend";
    category: string;
    budget: number;
    projectedSpend: number;
    overspendAmount: number;
    message: string;
  }
  
  export interface CategoryProjection {
    category: string;
    currentSpend: number;
    currentTrendMean: number;
    regressionPrediction: number;
    slope: number;
    intercept: number;
    finalForecast: number;
    budget: number;
    salaryClamped: boolean;
  }
  
  export interface ForecastPayload {
    forecastingActive: boolean;
    reason: string | null;
    monthKey?: string;
    monthsOfHistory?: number;
    projections: Record<string, CategoryProjection>;
    totals?: {
      totalProjectedSpend: number;
      grossSalaryUpperBound: number;
    };
    warnings: ForecastWarning[];
  }