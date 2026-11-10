import { describe, expect, it } from 'vitest';
import { buildStudyPlan } from '../../src/utils/studyPlan.js';

const TODAY = '2026-11-10'; // martes

function task(overrides = {}) {
  return {
    id: 'task-1',
    title: 'Guía de ecuaciones',
    subject: 'Matemáticas',
    dueDate: '2026-11-10',
    priority: 'media',
    completed: false,
    ...overrides,
  };
}

function event(overrides = {}) {
  return {
    id: 'event-1',
    title: 'Prueba de Historia',
    subject: 'Historia',
    date: '2026-11-12',
    ...overrides,
  };
}

describe('utils/studyPlan · armado de la semana', () => {
  it('prioriza tareas atrasadas y prepara las entregas el día anterior', () => {
    const plan = buildStudyPlan({
      today: TODAY,
      days: 3,
      tasks: [
        task({ id: 'overdue', dueDate: '2026-11-08', priority: 'alta' }),
        task({ id: 'tomorrow', dueDate: '2026-11-11', priority: 'alta' }),
        task({ id: 'later', dueDate: '2026-11-12', priority: 'baja' }),
        task({ id: 'far', dueDate: '2026-11-25' }),
        task({ id: 'done', dueDate: '2026-11-10', completed: true }),
      ],
      events: [event({ date: '2026-11-12' })],
    });

    expect(plan.days).toHaveLength(3);
    expect(plan.days[0].label).toBe('Hoy');
    expect(plan.days[1].label).toBe('Mañana');
    expect(plan.days[0].items.map((item) => item.id)).toEqual(
      expect.arrayContaining(['task:overdue', 'task:tomorrow']),
    );
    expect(plan.days[1].items.map((item) => item.id)).toEqual(
      expect.arrayContaining(['task:later', 'event:event-1']),
    );
    expect(plan.overdueCount).toBe(1);
    expect(plan.assessmentCount).toBe(1);
    expect(plan.tip).toContain('atrasada');
  });

  it('limita los bloques por día y avisa cuántos quedaron fuera', () => {
    const tasks = Array.from({ length: 4 }, (_, index) =>
      task({ id: `task-${index}`, title: `Tarea ${index}`, dueDate: '2026-11-10' }),
    );
    const plan = buildStudyPlan({ today: TODAY, days: 1, tasks });

    expect(plan.days[0].items).toHaveLength(3);
    expect(plan.days[0].extra).toBe(1);
    expect(plan.totalItems).toBe(3);
    expect(plan.totalMinutes).toBeGreaterThan(0);
  });

  it('muestra un consejo de descanso cuando no hay pendientes', () => {
    const plan = buildStudyPlan({ today: TODAY, days: 3 });

    expect(plan.totalItems).toBe(0);
    expect(plan.tip).toContain('descansar');
    expect(plan.days.every((day) => day.items.length === 0)).toBe(true);
  });

  it('ignora fechas inválidas y tareas completadas', () => {
    const plan = buildStudyPlan({
      today: TODAY,
      days: 3,
      tasks: [
        task({ id: 'invalid', dueDate: 'no-es-fecha' }),
        task({ id: 'done', completed: true }),
      ],
    });

    expect(plan.totalItems).toBe(0);
  });
});
