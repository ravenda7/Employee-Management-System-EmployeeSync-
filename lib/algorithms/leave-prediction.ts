// lib/algorithms/leavePrediction.ts

export function predictNextMonthLeaves(pastThreeMonths: number[]): {
  sma: number;
  predicted: number;
  trendIncreasing: boolean;
} {
  if (pastThreeMonths.length < 3) {
    return {
      sma: 0,
      predicted: 0,
      trendIncreasing: false,
    };
  }

  const [m1, m2, m3] = pastThreeMonths;
  const sma = (m1 + m2 + m3) / 3;
  const trendIncreasing = m3 > m1;
  const predicted = trendIncreasing ? sma * 1.1 : sma;

  return {
    sma,
    predicted,
    trendIncreasing,
  };
}
