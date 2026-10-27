Actúa como un Desarrollador Full-Stack Senior y Arquitecto de Software UI/UX. Necesito que diseñes, refactorices y unifiques completamente la plataforma web escolar "IntraNerd" en una aplicación web moderna tipo SPA (Single Page Application) o multipágina modular de alto rendimiento. La plataforma debe ser el núcleo central de gestión para toda la comunidad escolar (alumnos, profesores y administración), integrando de forma cohesiva los siguientes **8 módulos completos**:

### Módulos Principales a Integrar:

1. **Gestión y Aproximación de Notas (Semestral):**
   - Creación dinámica de asignaturas.
   - Registro de calificaciones para Primer y Segundo Semestre con validación de escalas (ej. 1.0 a 7.0)[cite: 1].
   - Cálculo automático de promedios parciales y promedio general ponderado/final, con indicadores visuales de aprobación (verde/rojo)[cite: 1].

2. **Gestión de Talleres y Actividades Extracurriculares:**
   - Listado de talleres disponibles en la escuela (deportes, programación, arte, música, ciencia, etc.).
   - Sistema de inscripción de alumnos con control de cupos disponibles.
   - Horarios, lugares y profesores a cargo de cada taller.

3. **Personas Extraviadas (Seguridad Escolar):**
   - Sistema de reportes de emergencia para personas extraviadas dentro del recinto.
   - Campos: nombre, edad, descripción de vestimenta/rasgos, último lugar visto, contacto y opción de adjuntar foto (archivo local o imágenes de ejemplo)[cite: 2].
   - Funcionalidad para marcar como "Encontrado", filtrar por estado/nombre y eliminar reportes con persistencia en `localStorage`[cite: 2].

4. **Calificador y Opiniones de Profesores:**
   - Directorio de profesores por asignatura.
   - Sistema de calificación interactiva por estrellas (1 a 5), cálculo de promedio de valoraciones y contadores de puntos[cite: 3].
   - Formulario de opiniones con comentarios y opción de adjuntar evidencias (imágenes o archivos)[cite: 3].

5. **Gestor de Objetos Perdidos y Encontrados:**
   - Doble panel diferenciado: "Objetos Encontrados" (entregados al colegio) y "Avisos de Objetos Perdidos" (publicados por dueños).
   - Registro de datos del reportante, descripción detallada, ubicación y miniaturas visuales rápidas (mochilas, llaves, cuadernos, tecnología)[cite: 4].

6. **Calendario Escolar de Pruebas y Evaluaciones:**
   - Calendario interactivo anual con navegación fluida entre años.
   - Cuadrícula mensual detallada (lunes a domingo) con días festivos marcados[cite: 5].
   - Selector de roles (Alumno / Profesor) y nombre de usuario[cite: 5].
   - Modal interactivo al hacer clic en cualquier día para programar y visualizar pruebas/evaluaciones con título, descripción y autor[cite: 5].

7. **Tablón de Anuncios y Comunicados Oficiales:**
   - Muro central estilo feed donde la dirección, profesores o el centro de alumnos puedan publicar comunicados importantes, suspensiones de clases, eventos o noticias del establecimiento.

8. **Control de Tareas y Deberes:**
   - Apartado para que los profesores publiquen tareas pendientes por asignatura y los alumnos puedan marcarlas como completadas (checklist personal).

### Requisitos Técnicos y de Diseño:

- **UI/UX Profesional:** Interfaz limpia, minimalista y moderna inspirada en paneles de control (Dashboards), utilizando una paleta de colores coherente (tonos azules institucionales `#1e40af`, `#2563eb`, grises limpios y tarjetas con sombras suaves). 100% responsiva (adaptada a móviles y escritorio).
- **Navegación Fluida:** Sistema de pestañas (Tabs) o barra lateral (Sidebar) elegante para cambiar entre los 8 módulos sin recargar la página.
- **Persistencia de Datos:** Uso robusto y estructurado de `localStorage` para que toda la información ingresada por los usuarios persista de forma segura en el navegador.
- **Código Limpio:** Código modular, estructurado en componentes de JavaScript limpios, bien comentado y listo para producción.
