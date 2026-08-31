import type { Answers, Budget, MarketProfile, Recommendation } from '../types';

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const HIGH_VALUE_HOME_THRESHOLD_WAN = 4_000;
const STANDARD_MAX_PRICE_WAN = HIGH_VALUE_HOME_THRESHOLD_WAN - 1;

function presentValue(monthlyPaymentWan: number, annualRate: number, years: number) {
  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;
  if (!monthlyRate) return monthlyPaymentWan * months;
  return monthlyPaymentWan * (1 - Math.pow(1 + monthlyRate, -months)) / monthlyRate;
}

export function monthlyPayment(principalWan: number, annualRate: number, years: number) {
  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;
  if (!monthlyRate) return principalWan / months;
  return principalWan * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
}

export function calculateBudget(answers: Answers): Budget {
  const availableCash = Math.max(answers.downPayment - answers.reserve - 30, 0);
  const remainingCashflow = Math.max(answers.monthlyIncome - answers.monthlyDebt - answers.fixedExpense, 0);

  const paymentAt = (incomeRatio: number, cashflowRatio: number) => Math.max(
    Math.min(answers.monthlyIncome * incomeRatio - answers.monthlyDebt, remainingCashflow * cashflowRatio),
    0,
  );
  const priceAt = (payment: number) => {
    const loan = presentValue(payment, answers.interestRate, answers.loanYears);
    const standardPrice = Math.max(Math.min(loan + availableCash, availableCash / 0.2), 0);
    if (standardPrice < HIGH_VALUE_HOME_THRESHOLD_WAN) {
      return Math.min(standardPrice, STANDARD_MAX_PRICE_WAN);
    }

    const highValuePrice = Math.max(Math.min(loan + availableCash, availableCash / 0.7), 0);
    return highValuePrice >= HIGH_VALUE_HOME_THRESHOLD_WAN
      ? highValuePrice
      : STANDARD_MAX_PRICE_WAN;
  };

  const comfortablePayment = paymentAt(0.35, 0.55);
  const acceptablePayment = paymentAt(0.42, 0.65);
  const riskPayment = paymentAt(0.48, 0.75);

  return {
    comfortable: Math.round(priceAt(comfortablePayment)),
    acceptable: Math.round(priceAt(acceptablePayment)),
    riskLimit: Math.round(priceAt(riskPayment)),
    availableCash: Math.round(availableCash),
    comfortablePayment: Math.round(comfortablePayment * 10) / 10,
    acceptablePayment: Math.round(acceptablePayment * 10) / 10,
    riskPayment: Math.round(riskPayment * 10) / 10,
  };
}

const hubBands: Record<string, string[][]> = {
  市政府: [
    ['西屯區', '南屯區', '西區'],
    ['北區', '北屯區', '南區', '中區'],
    ['東區', '大雅區', '烏日區', '潭子區'],
    ['太平區', '大里區', '沙鹿區', '龍井區'],
  ],
  台中車站: [
    ['中區', '東區', '南區'],
    ['北區', '西區', '太平區', '大里區'],
    ['北屯區', '南屯區', '潭子區', '烏日區'],
    ['西屯區', '豐原區', '大雅區', '霧峰區'],
  ],
  中科: [
    ['西屯區', '大雅區'],
    ['沙鹿區', '龍井區', '神岡區'],
    ['南屯區', '北屯區', '潭子區', '梧棲區'],
    ['西區', '北區', '清水區', '大肚區'],
  ],
  高鐵台中站: [
    ['烏日區', '南屯區'],
    ['南區', '西區', '大肚區'],
    ['西屯區', '大里區', '中區', '東區'],
    ['北區', '太平區', '龍井區', '霧峰區'],
  ],
  豐原車站: [
    ['豐原區', '潭子區', '神岡區'],
    ['后里區', '石岡區', '大雅區'],
    ['北屯區', '東勢區', '新社區'],
    ['北區', '西屯區', '清水區', '外埔區'],
  ],
};

function commuteEstimate(district: string, hub: string) {
  const bands = hubBands[hub] ?? hubBands.市政府;
  const band = bands.findIndex((districts) => districts.includes(district));
  return [15, 25, 35, 45][band] ?? 55;
}

const coreDistricts = new Set(['西屯區', '南屯區', '西區', '北區', '北屯區', '南區', '東區']);
const metroDistricts = new Set(['太平區', '大里區', '潭子區', '烏日區', '豐原區', '大雅區']);

function lifestyleScore(district: string) {
  if (coreDistricts.has(district)) return 90;
  if (metroDistricts.has(district)) return 82;
  return 72;
}

function contributionParts(answers: Answers, profile: MarketProfile, budget: Budget, commuteMinutes: number) {
  const raw = {
    finance: profile.medianTotalWan <= budget.comfortable
      ? 100
      : clamp(100 - ((profile.medianTotalWan - budget.comfortable) / Math.max(budget.riskLimit - budget.comfortable, 1)) * 65),
    commute: clamp(100 - Math.max(commuteMinutes - 15, 0) * 2.2),
    space: clamp(78 + Math.min(profile.rooms - answers.rooms, 1) * 12 + Math.min(profile.medianAreaPing - 25, 15) * 0.65),
    lifestyle: lifestyleScore(profile.district),
    condition: profile.medianAge === 0 ? 80 : clamp(100 - profile.medianAge * 1.5),
  };
  const labels = {
    finance: '財務適配', commute: '通勤適配', space: '家庭空間', lifestyle: '生活機能', condition: '房屋條件',
  };
  const weightTotal = Object.values(answers.priorities).reduce((sum, value) => sum + value, 0);
  return (Object.keys(raw) as Array<keyof typeof raw>).map((key) => ({
    key,
    label: labels[key],
    score: Math.round(raw[key] * 10) / 10,
    weight: answers.priorities[key] / weightTotal,
    contribution: Math.round(raw[key] * answers.priorities[key] / weightTotal * 10) / 10,
  }));
}

export function buildRecommendations(answers: Answers, profiles: MarketProfile[], budget: Budget): Recommendation[] {
  return profiles
    .filter((profile) => answers.buildings.includes(profile.building))
    .filter((profile) => profile.rooms >= answers.rooms && profile.rooms <= answers.rooms + 1)
    .filter((profile) => !answers.elevator || profile.building === '住宅大樓' || profile.building === '華廈')
    .filter((profile) => profile.medianAge === 0 || profile.medianAge <= answers.maxAge)
    .filter((profile) => !answers.parking || profile.parkingShare >= 0.35)
    .filter((profile) => profile.lowTotalWan <= budget.riskLimit)
    .map((profile) => {
      const commuteMinutes = commuteEstimate(profile.district, answers.commuteHub);
      const parts = contributionParts(answers, profile, budget, commuteMinutes);
      const reasons = [
        profile.medianTotalWan <= budget.comfortable ? '中位總價落在舒適預算內' : '市場低價帶仍在可負擔範圍',
        profile.rooms > answers.rooms ? `比最低需求多 ${profile.rooms - answers.rooms} 房彈性` : `符合最低 ${answers.rooms} 房需求`,
        `${profile.count.toLocaleString()} 筆同類成交可供比較`,
      ];
      const sacrifices = [
        commuteMinutes > answers.maxCommute ? `通勤估算約 ${commuteMinutes} 分鐘，超過偏好` : '',
        profile.medianTotalWan > budget.comfortable ? '中位總價高於舒適預算，需鎖定較低價案例' : '',
        profile.medianAge > 20 ? `同類成交屋齡中位數約 ${profile.medianAge} 年` : '',
        answers.parking && profile.parkingShare < 0.6 ? '含車位案例比例有限，搜尋時需再確認' : '',
      ].filter(Boolean);
      const total = Math.round(parts.reduce((sum, part) => sum + part.contribution, 0));
      return { ...profile, total, commuteMinutes, parts, reasons, sacrifices: sacrifices.slice(0, 2), confidence: profile.count >= 30 ? 'A' as const : 'B' as const };
    })
    .filter((profile) => profile.commuteMinutes <= answers.maxCommute + 20)
    .sort((a, b) => b.total - a.total || b.count - a.count)
    .filter((profile, index, rows) => rows.findIndex((other) => other.district === profile.district) === index)
    .slice(0, 5);
}

export function searchText(recommendation: Recommendation) {
  return `台中市${recommendation.district}｜${recommendation.lowTotalWan}～${recommendation.highTotalWan}萬元｜${recommendation.rooms}房｜${recommendation.building}｜約${recommendation.medianAreaPing}坪`;
}
