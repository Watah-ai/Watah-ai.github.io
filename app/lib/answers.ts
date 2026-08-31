import type { Answers, BuildingType } from '../types';

const allowedBuildings: BuildingType[] = ['住宅大樓', '華廈', '公寓', '透天厝'];
const allowedHubs = ['市政府', '台中車站', '中科', '高鐵台中站', '豐原車站'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function boundedNumber(value: unknown, fallback: number, min: number, max: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

export function sanitizeAnswers(value: unknown, fallback: Answers): Answers {
  if (!isRecord(value)) return fallback;

  const storedBuildings = Array.isArray(value.buildings)
    ? value.buildings.filter((item): item is BuildingType => allowedBuildings.includes(item as BuildingType))
    : [];
  const buildings = [...new Set(storedBuildings)];
  const priorities = isRecord(value.priorities) ? value.priorities : {};

  return {
    downPayment: boundedNumber(value.downPayment, fallback.downPayment, 0, 999_999),
    reserve: boundedNumber(value.reserve, fallback.reserve, 0, 9999),
    monthlyIncome: boundedNumber(value.monthlyIncome, fallback.monthlyIncome, 0, 9999),
    monthlyDebt: boundedNumber(value.monthlyDebt, fallback.monthlyDebt, 0, 9999),
    fixedExpense: boundedNumber(value.fixedExpense, fallback.fixedExpense, 0, 9999),
    loanYears: boundedNumber(value.loanYears, fallback.loanYears, 10, 40),
    interestRate: boundedNumber(value.interestRate, fallback.interestRate, 0, 10),
    residents: boundedNumber(value.residents, fallback.residents, 1, 8),
    rooms: boundedNumber(value.rooms, fallback.rooms, 1, 5),
    elevator: booleanValue(value.elevator, fallback.elevator),
    parking: booleanValue(value.parking, fallback.parking),
    buildings: buildings.length > 0 ? buildings : fallback.buildings,
    maxAge: boundedNumber(value.maxAge, fallback.maxAge, 0, 60),
    commuteHub: typeof value.commuteHub === 'string' && allowedHubs.includes(value.commuteHub)
      ? value.commuteHub
      : fallback.commuteHub,
    maxCommute: boundedNumber(value.maxCommute, fallback.maxCommute, 10, 90),
    priorities: {
      finance: boundedNumber(priorities.finance, fallback.priorities.finance, 1, 5),
      commute: boundedNumber(priorities.commute, fallback.priorities.commute, 1, 5),
      space: boundedNumber(priorities.space, fallback.priorities.space, 1, 5),
      lifestyle: boundedNumber(priorities.lifestyle, fallback.priorities.lifestyle, 1, 5),
      condition: boundedNumber(priorities.condition, fallback.priorities.condition, 1, 5),
    },
  };
}
