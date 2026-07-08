export const EDUCATION_LEVELS = [
  'Illiterate/No education',
  'Below SLC/SEE',
  'SLC/SEE pass',
  'Intermediate/+2 pass',
  'Bachelor complete',
  'Masters & above complete',
];

export const TREE_AGE_BRACKETS = [
  { label: '1-3 years', min: 1, max: 3, productivityPercent: 0 },
  { label: '4-5 years', min: 4, max: 5, productivityPercent: 10 },
  { label: '6-10 years', min: 6, max: 10, productivityPercent: 35 },
  { label: '11-15 years', min: 11, max: 15, productivityPercent: 60 },
  { label: '16-25 years', min: 16, max: 25, productivityPercent: 80 },
  { label: '26-40 years', min: 26, max: 40, productivityPercent: 70 },
  { label: '40+ years', min: 40, max: 150, productivityPercent: 50 },
];

export const MANAGEMENT_OPTIONS = [
  'Sold the orchard to a trader under a multi-year contract',
  'Sold the orchard to a trader under an annual contract',
  'Sold the orchard to a trader during or towards the maturity of fruits',
  'Sold the mango fruits to a trader upon maturity at the farm',
  'Others',
];

export const USER_ROLES = {
  FARMER: 'farmer',
  TRADER: 'trader',
  ADMIN: 'admin',
  SURVEYOR: 'surveyor',
};

export const SURVEY_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
};

export const MANGO_VARIETIES = [
  'Maldaha',
  'Amrapali',
  'Sindhure',
  'Langra',
  'Dusehri',
  'Chaunsa',
  'Dasheri',
  'Kesar',
];

export const MARKETS = [
  'Kalimati',
  'Balkhu',
  'Lahan',
  'Janakpur',
  'Hetauda',
  'Bhaktapur',
  'Kathmandu',
];

export const NEPAL_DISTRICTS = [
  'Saptari',
  'Siraha',
  'Mahottari',
  'Dhanusha',
  'Janakpur',
  'Rautahat',
  'Bara',
  'Parsa',
  'Makwanpur',
  'Chitwan',
  'Bhaktapur',
  'Kathmandu',
  'Lalitpur',
];

export const KATHA_TO_HECTARE = 0.0338;
export const KATHA_TO_ROPANI = 0.1825;
export const KG_TO_MT = 0.001;
export const QUINTAL_TO_KG = 100;

export default {
  EDUCATION_LEVELS,
  TREE_AGE_BRACKETS,
  MANAGEMENT_OPTIONS,
  USER_ROLES,
  SURVEY_STATUS,
  MANGO_VARIETIES,
  MARKETS,
  NEPAL_DISTRICTS,
};