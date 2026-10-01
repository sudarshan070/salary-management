import {
  employeeInputSchema,
  employeeUpdateSchema,
  idParamSchema,
  listEmployeesQuerySchema,
} from '@salary/shared';
import { Router } from 'express';
import { parse } from '../../http/parse';
import type { EmployeeService } from './employees.service';

/** HTTP edge only: parse input, call the service, shape the response. */
export function employeesRouter(service: EmployeeService): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    res.json(await service.list(parse(listEmployeesQuerySchema, req.query)));
  });

  router.get('/:id', async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    res.json(await service.get(id));
  });

  router.post('/', async (req, res) => {
    const created = await service.create(parse(employeeInputSchema, req.body));
    res.status(201).location(`/api/v1/employees/${created.id}`).json(created);
  });

  router.patch('/:id', async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    res.json(await service.update(id, parse(employeeUpdateSchema, req.body)));
  });

  router.delete('/:id', async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    await service.remove(id);
    res.status(204).end();
  });

  return router;
}
