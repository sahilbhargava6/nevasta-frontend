/**
 * Life-event planner data, ported verbatim from the design prototype
 * (Navesta_Website_22Sep26.html: #life-event-page tiles and ELP_EVENTS).
 */

export type LifeEvent = {
  emoji: string;
  title: string;
  /** Range shown on the tile of the Life-Event Planning grid. */
  range: string;
  bg: string;
  tagline: string;
  proof: string;
  typicalRange: string;
  defaultAmount: number;
  defaultTenure: number;
  perk1Val: string;
  perk1Label: string;
  perk1Emoji: string;
  perk1Desc: string;
  perk1Partner: string;
  perk1DotColor: string;
  tips: string[];
};

export const LIFE_EVENTS = {
  wedding: {
    emoji: '💍', title: 'Wedding', range: '₹3.00L – ₹30.00L', bg: '#F0EBF8',
    tagline: "Let's plan your big day — money shouldn't be what holds it back.",
    proof: '👥 1,200+ couples planned their wedding loan on Navesta last month',
    typicalRange: 'Typical for wedding: ₹3.00L – ₹30.00L',
    defaultAmount: 800000, defaultTenure: 24,
    perk1Val: '₹5,000', perk1Label: 'Wedding Voucher', perk1Emoji: '💍',
    perk1Desc: 'Valid on WedMeGood — decor, catering & venues',
    perk1Partner: 'WedMeGood', perk1DotColor: '#EF4444',
    tips: [
      'Book venues 12+ months early — prices rise closer to the date.',
      'Split the loan with a co-applicant to improve eligibility and get a lower interest rate.',
      'A CIBIL score above 750 typically qualifies you for sub-11% wedding loans.',
      'Keep your total wedding loan to 6× monthly income for comfortable repayment.',
    ],
  },
  travel: {
    emoji: '✈️', title: 'Travel / Holiday', range: '₹50,000 – ₹5.00L', bg: '#E8F4FD',
    tagline: 'Turn your dream holiday into reality — plan your travel loan in 60 seconds.',
    proof: '🌍 8,200+ trips planned on Navesta last month',
    typicalRange: 'Typical for travel: ₹50,000 – ₹5.00L',
    defaultAmount: 150000, defaultTenure: 12,
    perk1Val: '₹2,000', perk1Label: 'Travel Voucher', perk1Emoji: '✈️',
    perk1Desc: 'Valid on MakeMyTrip — flights, hotels & packages',
    perk1Partner: 'MakeMyTrip', perk1DotColor: '#EF4444',
    tips: [
      'Book flights 60–90 days ahead for domestic and 3–6 months for international trips.',
      'Use a travel credit card for forex to avoid 3.5% markup on international spends.',
      'Shorter tenure (12 months) on smaller amounts keeps total interest under ₹10,000.',
      'Bundle flights, hotel and insurance in one loan to get a better rate from lenders.',
    ],
  },
  renovation: {
    emoji: '🏠', title: 'Home Renovation', range: '₹1.00L – ₹15.00L', bg: '#ECFDF5',
    tagline: 'Transform your home — fund your renovation the smart way.',
    proof: '🏡 9,800+ homes renovated via Navesta last month',
    typicalRange: 'Typical for renovation: ₹1.00L – ₹15.00L',
    defaultAmount: 500000, defaultTenure: 36,
    perk1Val: '₹3,000', perk1Label: 'Home Store Credit', perk1Emoji: '🏠',
    perk1Desc: 'Valid at Asian Paints, Godrej Interio & partners',
    perk1Partner: 'Asian Paints', perk1DotColor: '#EF4444',
    tips: [
      'Get at least 3 contractor quotes — prices vary by 20–40% for the same work.',
      'Modular kitchen and flooring give the highest resale value per rupee spent.',
      'A 36–48 month tenure keeps EMIs comfortable on a ₹5L loan at 12%.',
      'Keep 15% of your budget as contingency — renovation overruns are extremely common.',
    ],
  },
  shifting: {
    emoji: '📦', title: 'Home Shifting', range: '₹30,000 – ₹3.00L', bg: '#FFFBEB',
    tagline: 'Move without the financial stress — plan your shifting budget here.',
    proof: '📦 5,100+ families moved via Navesta last month',
    typicalRange: 'Typical for shifting: ₹30,000 – ₹3.00L',
    defaultAmount: 80000, defaultTenure: 12,
    perk1Val: '₹1,000', perk1Label: 'Packers Discount', perk1Emoji: '📦',
    perk1Desc: 'Valid on Porter and NoBroker Packers & Movers',
    perk1Partner: 'Porter', perk1DotColor: '#EF4444',
    tips: [
      'Compare 3 packers & movers on Porter or NoBroker before finalising.',
      'Mid-week moves cost 15–20% less than weekend moves.',
      'Label boxes by room — saves 3–4 hours on unpacking day.',
      'Budget ₹5,000–₹15,000 extra for utility transfers and minor repairs at the new home.',
    ],
  },
  anniversary: {
    emoji: '🎉', title: 'Anniversary / Party', range: '₹20,000 – ₹2.00L', bg: '#FDF2F8',
    tagline: 'Celebrate in style — plan your party loan in seconds.',
    proof: '🎊 3,400+ celebrations planned via Navesta last month',
    typicalRange: 'Typical for anniversary: ₹20,000 – ₹2.00L',
    defaultAmount: 75000, defaultTenure: 12,
    perk1Val: '₹500', perk1Label: 'Event Discount', perk1Emoji: '🎉',
    perk1Desc: 'Valid on BookMyShow events & venue bookings',
    perk1Partner: 'BookMyShow', perk1DotColor: '#EF4444',
    tips: [
      'Weekday venue bookings are typically 30–40% cheaper than weekends.',
      'Combining food, decor and venue in one contract often saves 10–15%.',
      'Short-tenure loans (6–12 months) minimise total interest on smaller amounts.',
      'Confirm all vendor contracts with 50% advance — avoids day-of cancellations.',
    ],
  },
  education: {
    emoji: '🎓', title: 'Education / Upskilling', range: '₹20,000 – ₹10.00L', bg: '#EFF6FF',
    tagline: 'Invest in yourself — get an education loan plan in 60 seconds.',
    proof: '📚 18,000+ learners funded via Navesta last month',
    typicalRange: 'Typical for education: ₹20,000 – ₹10.00L',
    defaultAmount: 200000, defaultTenure: 24,
    perk1Val: '₹2,500', perk1Label: 'Course Voucher', perk1Emoji: '🎓',
    perk1Desc: 'Valid on Coursera, NIIT and UpGrad programs',
    perk1Partner: 'Coursera', perk1DotColor: '#2563EB',
    tips: [
      'Education loans up to ₹4L typically require no collateral from scheduled banks.',
      'Interest on education loans is tax-deductible under Section 80E for 8 years.',
      'Compare income-share agreements vs loans — ISAs can cost less for high-ROI courses.',
      'A strong placement record of the institute significantly improves loan approval chances.',
    ],
  },
  tax: {
    emoji: '📊', title: 'Tax Payment', range: '₹25,000 – ₹20.00L', bg: '#F3EEFF',
    tagline: 'Handle your tax dues without liquidating savings — plan it here.',
    proof: '📋 6,700+ tax gaps covered via Navesta last month',
    typicalRange: 'Typical for tax: ₹25,000 – ₹20.00L',
    defaultAmount: 300000, defaultTenure: 12,
    perk1Val: '₹1,500', perk1Label: 'CA Consultation', perk1Emoji: '📊',
    perk1Desc: 'Free Cleartax Pro session on loan disbursal',
    perk1Partner: 'Cleartax Pro', perk1DotColor: '#2563EB',
    tips: [
      'A personal loan for advance tax avoids the 1% per month penal interest from IT Dept.',
      'Compare the loan interest cost vs the penal interest you would owe — often the loan wins.',
      'Short-tenure (12 months) for tax loans keeps total cost minimal.',
      'Filing ITR accurately the first time avoids costly revisions and notices later.',
    ],
  },
  medical: {
    emoji: '🏥', title: 'Medical / Health', range: '₹50,000 – ₹10.00L', bg: '#FFF5F5',
    tagline: 'Focus on recovery — not on arranging funds. Get a medical loan plan.',
    proof: '❤️ 14,200+ medical needs covered via Navesta last month',
    typicalRange: 'Typical for medical: ₹50,000 – ₹10.00L',
    defaultAmount: 250000, defaultTenure: 18,
    perk1Val: '5%', perk1Label: 'Hospital Discount', perk1Emoji: '🏥',
    perk1Desc: 'Valid at Fortis, Apollo and partner hospitals',
    perk1Partner: 'Fortis / Apollo', perk1DotColor: '#EF4444',
    tips: [
      'Negotiate with the hospital billing dept — most allow 5–15% cash payment discount.',
      'Check your employer group health insurance before applying for a loan.',
      'Pre-authorisation from your insurer can reduce out-of-pocket amount significantly.',
      'Keep an emergency medical fund of ₹1–2L separate from your regular savings.',
    ],
  },
  electronics: {
    emoji: '💻', title: 'Electronics', range: '₹15,000 – ₹2.00L', bg: '#ECFEFF',
    tagline: 'Get the tech you need now — pay comfortably over time.',
    proof: '💻 22,000+ devices financed via Navesta last month',
    typicalRange: 'Typical for electronics: ₹15,000 – ₹2.00L',
    defaultAmount: 80000, defaultTenure: 12,
    perk1Val: '₹2,000', perk1Label: 'Extended Warranty', perk1Emoji: '💻',
    perk1Desc: 'Valid at Croma, Reliance Digital & partners',
    perk1Partner: 'Croma', perk1DotColor: '#2563EB',
    tips: [
      'Compare EMI schemes from the brand vs a personal loan — brand zero-cost EMIs often have hidden fees.',
      'Buy-now-pay-later schemes work well for amounts under ₹30,000 with no processing fee.',
      'A 12-month loan on ₹80,000 at 12% costs only ~₹4,400 total in interest — very manageable.',
      'Check for exchange-offer discounts before finalising — can reduce loan amount by ₹5,000–₹20,000.',
    ],
  },
  other: {
    emoji: '✨', title: 'Other Goals', range: '₹10,000 – ₹20.00L', bg: '#F3EEFF',
    tagline: 'Whatever your goal, Navesta helps you fund it smartly.',
    proof: '✨ 30,000+ goals funded via Navesta last month',
    typicalRange: 'Typical range: ₹10,000 – ₹20.00L',
    defaultAmount: 200000, defaultTenure: 24,
    perk1Val: '₹1,000', perk1Label: 'Shopping Voucher', perk1Emoji: '✨',
    perk1Desc: 'Valid on Amazon India on loan disbursal',
    perk1Partner: 'Amazon', perk1DotColor: '#D97706',
    tips: [
      'Compare your personal loan rate vs your credit card EMI rate — card EMIs average 24–36% p.a.',
      'A CIBIL score above 750 typically brings the rate down by 1–2 percentage points.',
      'Prepayment after 6 months can cut total interest by 15–30% — check if your lender allows it.',
      'Keep your total EMI burden (all loans) under 50% of take-home income for financial stability.',
    ],
  },
} satisfies Record<string, LifeEvent>;

export type LifeEventKey = keyof typeof LIFE_EVENTS;

export const LIFE_EVENT_KEYS = Object.keys(LIFE_EVENTS) as LifeEventKey[];

export function isLifeEventKey(key: string): key is LifeEventKey {
  return Object.prototype.hasOwnProperty.call(LIFE_EVENTS, key);
}

/**
 * The design's indicative rates (ELP_LENDERS), used for the result card only
 * when no live lender offers are available.
 */
export const INDICATIVE_BEST_RATE = 9.9;

/** elpFmtINR from the design: ₹8.00L / ₹45,000 / ₹1.20Cr, '—' for nothing. */
export function elpFmtINR(n: number): string {
  if (!n || Number.isNaN(n)) return '—';
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + 'Cr';
  if (n >= 100000) return '₹' + (n / 100000).toFixed(2) + 'L';
  if (n >= 1000) return '₹' + Math.round(n).toLocaleString('en-IN');
  return '₹' + Math.round(n);
}
