/**
 * Rotaciones del menú de la cafetería.
 *
 * Cada rotación se repite de forma automática según la semana del año. Para
 * cambiar la oferta, agrega o edita una rotación; no hace falta tocar la vista.
 */

const day = (main, description, side, vegetarian, dessert, allergens = []) => ({
  main,
  description,
  side,
  vegetarian,
  dessert,
  allergens,
});

export const MENU_ROTATIONS = [
  {
    id: 'rotacion-sabores-de-otoño',
    name: 'Sabores de otoño',
    description: 'Platos caseros, verduras de estación y porciones equilibradas.',
    days: {
      lunes: day(
        'Cazuela de vacuno',
        'Caldo casero con zapallo, papa, choclo y carne de vacuno.',
        'Arroz y pan casero',
        'Cazuela de verduras',
        'Manzana de estación',
        ['apio', 'gluten'],
      ),
      martes: day(
        'Charquicán con huevo',
        'Guiso de zapallo, papa y choclo con huevo cocido.',
        'Ensalada chilena',
        'Charquicán de zapallo',
        'Pera',
        ['huevo'],
      ),
      miercoles: day(
        'Arroz con pollo',
        'Pollo al horno desmenuzado con arroz y verduras.',
        'Ensalada de lechuga y zanahoria',
        'Arroz con verduras salteadas',
        'Jalea de frutas',
        [],
      ),
      jueves: day(
        'Lentejas guisadas',
        'Lentejas con cebolla, zanahoria y especias suaves.',
        'Arroz y pan integral',
        'Lentejas con verduras extra',
        'Naranja',
        ['gluten'],
      ),
      viernes: day(
        'Pastel de pescado',
        'Pescado blanco con puré de papa y verduras.',
        'Ensalada de repollo',
        'Pastel de verduras',
        'Fruta de estación',
        ['pescado', 'gluten', 'leche'],
      ),
    },
  },
  {
    id: 'rotacion-raices-y-huerta',
    name: 'Raíces y huerta',
    description: 'Recetas con legumbres, cereales integrales y productos locales.',
    days: {
      lunes: day(
        'Pastel de choclo',
        'Pastel de choclo al horno con carne y aceitunas.',
        'Ensalada de tomate',
        'Pastel de choclo vegetariano',
        'Uvas',
        ['leche', 'huevo'],
      ),
      martes: day(
        'Porotos granados',
        'Porotos con mazorca, zapallo y albahaca fresca.',
        'Pan amasado',
        'Porotos granados sin chorizo',
        'Sandía',
        ['gluten'],
      ),
      miercoles: day(
        'Tallarines con salsa de tomate',
        'Pasta con salsa de tomate, albahaca y queso rallado.',
        'Ensalada verde',
        'Tallarines con verduras',
        'Flan de vainilla',
        ['gluten', 'leche', 'huevo'],
      ),
      jueves: day(
        'Pollo al horno con papas',
        'Pollo dorado con papas al romero y zanahorias.',
        'Ensalada de pepino',
        'Seitán al horno con papas',
        'Manzana',
        [],
      ),
      viernes: day(
        'Quinoa primavera',
        'Quinoa con choclo, arvejas, pimiento y huevo.',
        'Pan integral',
        'Quinoa primavera sin huevo',
        'Naranja',
        ['huevo', 'gluten'],
      ),
    },
  },
  {
    id: 'rotacion-cocina-del-mundo',
    name: 'Cocina del mundo',
    description: 'Sabores de distintos países con una alternativa vegetariana diaria.',
    days: {
      lunes: day(
        'Curry de garbanzos',
        'Garbanzos con leche de coco, tomate y especias suaves.',
        'Arroz basmati',
        'Curry de garbanzos y verduras',
        'Mango',
        [],
      ),
      martes: day(
        'Tacos de pollo',
        'Tortillas de maíz con pollo, palta y pico de gallo.',
        'Ensalada de maíz',
        'Tacos de frijoles',
        'Piña',
        ['maíz'],
      ),
      miercoles: day(
        'Sopa de tomate y queso',
        'Sopa cremosa de tomate con crutones y queso.',
        'Pan de campo',
        'Sopa de tomate sin queso',
        'Galleta de avena',
        ['gluten', 'leche'],
      ),
      jueves: day(
        'Wok de verduras y fideos',
        'Fideos salteados con brócoli, zanahoria y salsa de soya.',
        'Ensalada de repollo',
        'Wok de verduras con tofu',
        'Pera',
        ['gluten', 'soya'],
      ),
      viernes: day(
        'Empanadas de pino',
        'Empanadas de horno con carne, cebolla y huevo.',
        'Ensalada de lechuga',
        'Empanadas de queso y verduras',
        'Fruta de estación',
        ['gluten', 'huevo', 'leche'],
      ),
    },
  },
];
