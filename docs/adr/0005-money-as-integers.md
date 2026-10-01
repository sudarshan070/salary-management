# 0005. Salaries stored as integer minor units, in local currency

- **Status:** Accepted, 1 Oct 2026

## Context

Floating-point numbers cannot represent most decimal amounts exactly. Employees are paid in different currencies, and no exchange-rate source is part of the brief.

## Decision

Store annual gross salary as an integer in minor units (`salary_minor`, e.g. paise or cents) together with the ISO 4217 currency of the employee's country. Insights are always grouped by country, so amounts in different currencies are never added together.

## Consequences

- No rounding errors in storage or aggregates; formatting happens at the edge (UI).
- Cross-country comparison in one currency is out of scope; adding dated exchange rates later does not change stored data.
