# Performance

**Target (from the requirements):** list and insight requests answer in under 200 ms with 10,000 employees.

**Result:** every endpoint answers in 8–52 ms locally on 10,000 rows, including a warm-up request. `apps/api/src/performance.test.ts` seeds the full data set and fails the build if any endpoint exceeds 200 ms.

| Endpoint                                                      | Measured (local, incl. warm-up) |
| ------------------------------------------------------------- | ------------------------------- |
| `GET /api/v1/employees?pageSize=100`                          | 42 ms                           |
| `GET /api/v1/employees?search=sharma&country=IN&sort=-salary` | 15 ms                           |
| `GET /api/v1/employees?page=90&pageSize=100&sort=hireDate`    | 45 ms                           |
| `GET /api/v1/insights/overview`                               | 22 ms                           |
| `GET /api/v1/insights/countries`                              | 52 ms                           |
| `GET /api/v1/insights/countries/US/job-titles`                | 9 ms                            |
| `GET /api/v1/meta/filters`                                    | 8 ms                            |
| Seed 10,000 employees (local file)                            | ~0.7 s                          |

Production adds network time: browser → Render (Singapore) → Turso (Mumbai). The first request after 15 idle minutes also pays Render's ~1 minute cold start.

## What keeps it fast

1. **The browser never receives all 10,000 rows.** Lists are paginated on the server: default 25, maximum 100 per page, enforced by the shared Zod schema.
2. **Aggregates run in SQLite.** Min, max, average and counts are `GROUP BY` queries; only one row per group reaches Node.
3. **Median without loading data.** A `ROW_NUMBER() OVER (PARTITION BY country_code ORDER BY salary_minor)` window picks the middle row (odd count) or the average of the middle two (even count) inside the database.
4. **Indexes match the queries:**

   | Index                                  | Serves                                                        |
   | -------------------------------------- | ------------------------------------------------------------- |
   | `(country_code, job_title)`            | job-title breakdown within a country, country + title filters |
   | `(country_code, salary_minor)`         | per-country stats and the median window                       |
   | `department`, `job_title`, `full_name` | filters and the default name sort                             |
   | unique `email`, unique `employee_code` | duplicate checks and lookups                                  |

5. **Seeding is batched:** 500 rows per `INSERT` inside one transaction, so 10,000 rows are 20 statements, not 10,000.
6. **Money as integers** (minor units) keeps sums and averages exact and cheap.

## Known limits and next steps

- **Search** uses `LIKE '%term%'`, which scans; fine at 10,000 rows (15 ms). Beyond ~500,000 rows, add SQLite FTS5 or move search to PostgreSQL trigram indexes.
- **Deep pagination** uses `OFFSET`; at very large page numbers keyset pagination (by name + id) would be faster.
- **Insights are computed per request.** At this size that's cheaper than caching; with millions of rows, cache per country and invalidate on write.
- **Cold starts** come from Render's free plan, not the code. Render Starter keeps the instance warm.
