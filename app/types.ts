export type BuildingType = '住宅大樓' | '華廈' | '公寓' | '透天厝';

export type Answers = {
  downPayment: number;
  reserve: number;
  monthlyIncome: number;
  monthlyDebt: number;
  fixedExpense: number;
  loanYears: number;
  interestRate: number;
  residents: number;
  rooms: number;
  elevator: boolean;
  parking: boolean;
  buildings: BuildingType[];
  maxAge: number;
  commuteHub: string;
  maxCommute: number;
  priorities: {
    finance: number;
    commute: number;
    space: number;
    lifestyle: number;
    condition: number;
  };
};

export type MarketProfile = {
  district: string;
  building: BuildingType;
  rooms: number;
  count: number;
  medianTotalWan: number;
  lowTotalWan: number;
  highTotalWan: number;
  medianUnitWanPing: number;
  medianAreaPing: number;
  medianAge: number;
  parkingShare: number;
};

export type MarketData = {
  metadata: {
    title: string;
    source: string;
    sourceUrl: string;
    license: string;
    period: string;
    generatedFromRows: number;
    note: string;
  };
  districts: Array<{
    district: string;
    count: number;
    medianTotalWan: number;
    medianUnitWanPing: number;
  }>;
  profiles: MarketProfile[];
};

export type Budget = {
  comfortable: number;
  acceptable: number;
  riskLimit: number;
  availableCash: number;
  comfortablePayment: number;
  acceptablePayment: number;
  riskPayment: number;
};

export type ScorePart = {
  key: string;
  label: string;
  score: number;
  weight: number;
  contribution: number;
};

export type Recommendation = MarketProfile & {
  total: number;
  commuteMinutes: number;
  parts: ScorePart[];
  reasons: string[];
  sacrifices: string[];
  confidence: 'A' | 'B';
};
