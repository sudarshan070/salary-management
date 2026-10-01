import type { CountryInsight, Employee, FilterOptions, Overview } from '@salary/shared';

export const health = { status: 'ok', service: 'salary-api', version: '1.2.3' };

export const overview: Overview = {
  totalEmployees: 10000,
  countries: 10,
  departments: 7,
  jobTitles: 17,
  byEmploymentType: [
    { employmentType: 'full-time', headcount: 8546 },
    { employmentType: 'contract', headcount: 789 },
    { employmentType: 'part-time', headcount: 665 },
  ],
  byDepartment: [
    { department: 'Engineering', headcount: 3968 },
    { department: 'People', headcount: 479 },
  ],
};

export const countries: CountryInsight[] = [
  {
    countryCode: 'IN',
    countryName: 'India',
    currency: 'INR',
    headcount: 2975,
    minSalary: 40_300_000,
    maxSalary: 402_100_000,
    averageSalary: 180_569_950,
    medianSalary: 173_900_000,
  },
  {
    countryCode: 'US',
    countryName: 'United States',
    currency: 'USD',
    headcount: 2569,
    minSalary: 2_000_000,
    maxSalary: 19_200_000,
    averageSalary: 8_685_559,
    medianSalary: 8_500_000,
  },
];

export const jobTitles = (code: string) => ({
  countryCode: code,
  countryName: code === 'IN' ? 'India' : 'United States',
  currency: code === 'IN' ? 'INR' : 'USD',
  jobTitles:
    code === 'IN'
      ? [
          {
            jobTitle: 'Engineering Manager',
            headcount: 119,
            minSalary: 146_600_000,
            maxSalary: 402_100_000,
            averageSalary: 341_051_261,
          },
        ]
      : [
          {
            jobTitle: 'Support Specialist',
            headcount: 300,
            minSalary: 3_000_000,
            maxSalary: 5_000_000,
            averageSalary: 4_000_000,
          },
        ],
});

export const filters: FilterOptions = {
  countries: [
    { code: 'IN', name: 'India', currency: 'INR' },
    { code: 'US', name: 'United States', currency: 'USD' },
  ],
  departments: ['Engineering', 'Sales'],
  jobTitles: ['Sales Manager', 'Software Engineer'],
};

export const employee = (overrides: Partial<Employee> = {}): Employee => ({
  id: 2380,
  employeeCode: 'EMP-002380',
  fullName: 'Aarav Ahmed',
  email: 'aarav.ahmed2@acme.example',
  jobTitle: 'Sales Manager',
  department: 'Sales',
  countryCode: 'IN',
  currency: 'INR',
  salaryMinor: 206_400_000,
  employmentType: 'full-time',
  hireDate: '2015-12-22',
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-01T12:00:00.000Z',
  ...overrides,
});

export const page = (data: Employee[], total = data.length, pageNo = 1, pageSize = 25) => ({
  data,
  page: pageNo,
  pageSize,
  total,
  totalPages: Math.ceil(total / pageSize),
});
