# Requirements: ACME Salary Management

**Persona:** the HR Manager of ACME, an organisation of 10,000 employees across multiple countries.
**Status:** written before any code, 1 Oct 2026. Assumptions are listed at the end; they change only if the Incubyte team answers the clarification email differently.

## Goal

Replace the Excel workbooks ACME's HR team uses today with a web application that lets the HR Manager **manage employee salary data** and **answer questions about how the organisation pays people**.

## Problem

Salary data for 10,000 people lives in spreadsheets. Finding, correcting and comparing records is slow and error-prone, and questions like "what do we pay engineers in Germany?" need manual filtering and formulas every time.

## Scope and features

| # | Feature | Question it answers for the HR Manager |
| --- | --- | --- |
| F1 | Employee list: paginated, searchable (name, email), filterable (country, job title, department), sortable | "Where is this person's record?" |
| F2 | Create, view, edit and delete an employee, with validation | "How do I keep the data correct?" |
| F3 | Country insights: headcount, min, max, average and median salary per country | "How do we pay people in India vs the US?" |
| F4 | Job-title insights within a country: headcount, min, max, average salary per title | "Are our engineers in Germany paid consistently?" |
| F5 | Organisation overview: total headcount, countries, departments, salary spread per country | "What does the org look like at a glance?" |
| F6 | Seed script that creates 10,000 realistic, repeatable employees | Demo and test data |

**Employee record:** employee code, full name, email, job title, department, country, currency, annual gross salary, employment type, hire date.

**Quality bar:** list and insight requests answer in under 200 ms on 10,000 rows; the app is deployed and usable from a browser; core behaviour is covered by fast, deterministic tests.

## Deliberately out of scope (and why)

| Left out | Reason |
| --- | --- |
| Login, roles and permissions | The brief has one persona. Auth adds time without proving the core; the API is structured so a middleware can add it later. |
| Currency conversion | Salaries stay in local currency and insights are grouped per country, so no exchange-rate source is needed and no figure is misleading. |
| Net salary, tax, deductions | Country tax rules are a product of their own. Gross annual salary only. |
| Salary history | Current salary only. The schema leaves a clean path to a `salary_revisions` table. |
| Excel/CSV import and export | High value for a real migration, but the seed script covers the brief. First item on the roadmap. |
| Multi-organisation (tenants) | One organisation in the brief. |

## Assumptions

1. Current salary only, no history.
2. Salaries stored in each country's local currency; no conversion.
3. Gross annual salary only.
4. No authentication for the single HR Manager persona.
5. SQLite is acceptable in production (hosted on Turso, which is SQLite-compatible).

## Success looks like

The HR Manager can find any employee in seconds, correct a record without touching a spreadsheet, and answer "how do we pay people?" by country and by role from one screen.
