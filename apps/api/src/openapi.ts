import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import {
  COUNTRY_CODES,
  apiErrorSchema,
  countryInsightSchema,
  countryJobTitlesSchema,
  employeeInputSchema,
  employeeListSchema,
  employeeSchema,
  employeeUpdateSchema,
  filterOptionsSchema,
  healthResponseSchema,
  listEmployeesQuerySchema,
  overviewSchema,
} from '@salary/shared';
import { z } from 'zod';

// Adds .openapi() to Zod schemas (including the shared ones) so they can be registered.
extendZodWithOpenApi(z);

/** Builds the OpenAPI document from the same Zod schemas the API validates with. */
export function buildOpenApiDocument(version: string) {
  const registry = new OpenAPIRegistry();
  // Shared schemas are created before extendZodWithOpenApi runs, so register clones
  // (new instances pick up the .openapi() method).
  const named = <T extends z.ZodType>(name: string, schema: T) =>
    registry.register(name, schema.clone() as T);

  const Employee = named('Employee', employeeSchema);
  const EmployeeInput = named('EmployeeInput', employeeInputSchema);
  const EmployeeUpdate = named('EmployeeUpdate', employeeUpdateSchema);
  const EmployeeList = named('EmployeeList', employeeListSchema);
  const ApiError = named('ApiError', apiErrorSchema);
  const CountryInsight = named('CountryInsight', countryInsightSchema);
  const CountryJobTitles = named('CountryJobTitles', countryJobTitlesSchema);
  const Overview = named('Overview', overviewSchema);
  const FilterOptions = named('FilterOptions', filterOptionsSchema);

  const json = <T extends z.ZodType>(schema: T, description: string) => ({
    description,
    content: { 'application/json': { schema } },
  });
  const error = (description: string) => json(ApiError, description);
  const idParams = z.object({ id: z.number().int().positive() });

  registry.registerPath({
    method: 'get',
    path: '/health',
    summary: 'Liveness check',
    responses: { 200: json(healthResponseSchema, 'The API is running') },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/employees',
    tags: ['Employees'],
    summary: 'List employees (paginated, searchable, filterable, sortable)',
    request: { query: listEmployeesQuerySchema },
    responses: { 200: json(EmployeeList, 'A page of employees'), 400: error('Invalid query') },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/employees',
    tags: ['Employees'],
    summary: 'Create an employee',
    request: { body: { content: { 'application/json': { schema: EmployeeInput } } } },
    responses: {
      201: json(Employee, 'Created'),
      400: error('Invalid body or hire date in the future'),
      409: error('Email already used'),
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/employees/{id}',
    tags: ['Employees'],
    summary: 'Get one employee',
    request: { params: idParams },
    responses: { 200: json(Employee, 'The employee'), 404: error('Not found') },
  });
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/employees/{id}',
    tags: ['Employees'],
    summary: 'Update some fields of an employee',
    request: {
      params: idParams,
      body: { content: { 'application/json': { schema: EmployeeUpdate } } },
    },
    responses: {
      200: json(Employee, 'Updated'),
      400: error('Invalid body'),
      404: error('Not found'),
      409: error('Email already used'),
    },
  });
  registry.registerPath({
    method: 'delete',
    path: '/api/v1/employees/{id}',
    tags: ['Employees'],
    summary: 'Delete an employee',
    request: { params: idParams },
    responses: { 204: { description: 'Deleted' }, 404: error('Not found') },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/insights/overview',
    tags: ['Insights'],
    summary: 'Organisation totals and headcount breakdowns',
    responses: { 200: json(Overview, 'Overview') },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/insights/countries',
    tags: ['Insights'],
    summary: 'Salary statistics per country (local currency, minor units)',
    responses: { 200: json(z.array(CountryInsight), 'One entry per country') },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/insights/countries/{code}/job-titles',
    tags: ['Insights'],
    summary: 'Salary statistics per job title within a country',
    request: { params: z.object({ code: z.enum(COUNTRY_CODES) }) },
    responses: {
      200: json(CountryJobTitles, 'Job titles, highest average first'),
      400: error('Unsupported country'),
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/meta/filters',
    tags: ['Meta'],
    summary: 'Countries, departments and job titles for filter dropdowns',
    responses: { 200: json(FilterOptions, 'Filter options') },
  });

  return new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'ACME Salary Management API',
      version,
      description:
        'Manage employee salary records and see how the organisation pays people. ' +
        'Salaries are integers in the minor unit of the employee country currency.',
    },
  });
}
