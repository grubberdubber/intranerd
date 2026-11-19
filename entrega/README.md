# IntraNerd · Sitio institucional

Entrega del sitio web multipágina de **IntraNerd**, empresa ficticia de soluciones
tecnológicas creada para el proyecto académico. El sitio está construido con HTML5,
CSS3 y JavaScript sin frameworks, y cumple la estructura y los contenidos solicitados
en las cuatro rúbricas de `docs/rubrica/`.

## Cómo abrir la entrega

La carpeta que se entrega es **`entrega/`**. Para revisarla con un servidor local:

```bash
cd entrega
python3 -m http.server 8090
```

Luego abre <http://localhost:8090> o directamente `entrega/index.html`.

También se puede abrir `index.html` con doble clic. Las tipografías se cargan desde
Google Fonts; si no hay conexión, el sitio usa las fuentes del sistema como respaldo.

## Páginas

| Página     | Archivo           | Contenido principal                                                   |
| ---------- | ----------------- | --------------------------------------------------------------------- |
| Inicio     | `index.html`      | Hero, resumen de la empresa, servicios, misión, visión y mascota      |
| Nosotros   | `nosotros.html`   | Historia, imagen de la empresa, equipo, valores y propósito           |
| Soluciones | `soluciones.html` | Diferenciadores, cuatro proyectos, acordeones, tiempos y presupuestos |
| Contacto   | `contacto.html`   | Mensaje al cliente, formulario completo, datos directos y FAQ         |

El header y el footer son compartidos visualmente en las cuatro páginas. La navegación
incluye Inicio, Nosotros, Soluciones y Contacto, y el footer reúne accesos a las páginas,
a cada solución y a los canales de contacto.

## Integrantes

- Rodrigo Martínez — Dirección de producto.
- Snayder Martínez — Liderazgo técnico.
- Yhostin Rivera — Experiencia de usuario.
- Rogelio Peña — Operaciones y soporte.

## Identidad corporativa

| Elemento              | Valor                 |
| --------------------- | --------------------- |
| Azul institucional    | `#1e40af`             |
| Azul de interacción   | `#2563eb`             |
| Azul profundo         | `#172554` / `#07152f` |
| Acento cálido         | `#f59e0b` / `#fbbf24` |
| Fondo claro           | `#f5f8ff`             |
| Tipografía de títulos | Sora (Google Fonts)   |
| Tipografía de textos  | Inter (Google Fonts)  |

Los colores están declarados como variables CSS en `css/style.css` (`--brand-800`,
`--brand-600`, `--accent-500`, etc.). Las clases `.font-heading` y `.font-body`
diferencian las dos tipografías.

## Estructura

```text
entrega/
├── index.html
├── nosotros.html
├── soluciones.html
├── contacto.html
├── css/
│   ├── style.css          # estilos compartidos e identidad
│   ├── index.css          # hero, servicios y misión/visión
│   ├── nosotros.css       # historia, equipo y valores
│   ├── soluciones.css     # proyectos y preguntas
│   └── contacto.css       # formulario y FAQ
├── js/
│   ├── main.js            # menú móvil, acordeones y año
│   └── contacto.js        # validación y confirmación del formulario
├── img/
│   ├── hero-inicio.svg
│   ├── historia-oficina.svg
│   ├── equipo-*.svg
│   ├── solucion-*.svg
│   ├── nerdi.webp
│   ├── intranerd-mark.svg
│   └── favicon.svg
├── audio/                 # carpeta solicitada por la estructura
├── video/                 # carpeta solicitada por la estructura
├── CHECKLIST-RUBRICA.md   # cobertura criterio por criterio
└── IDENTIDAD.md           # resumen de la identidad visual
```

## Funcionalidades

- **Menú móvil:** botón hamburguesa con `aria-expanded`, cierre con Escape, clic fuera
  o al elegir un enlace.
- **Acordeones:** usados en las preguntas frecuentes y en el detalle de cada solución.
  El estado se expone con `aria-expanded` y un icono `+` / `−`.
- **Formulario:** campos tipados, etiquetas asociadas, grupo de radios para sexo,
  validación con HTML y JavaScript, contador de caracteres y confirmación local.
- **Navegación:** enlaces internos y anclas verificadas; no hay enlaces muertos.
- **Responsive:** las tarjetas, el equipo, los valores y el formulario pasan a una
  columna en pantallas pequeñas. La prueba se realizó desde 360 px hasta 1440 px.
- **Accesibilidad:** enlace para saltar al contenido, foco visible, etiquetas, textos
  alternativos, `aria-current` y contraste cuidado.

> **Nota académica:** el formulario no envía datos a un servidor. Al enviarlo muestra
> una confirmación local e indica expresamente que se trata de una demostración. Las
> soluciones, presupuestos, clientes y datos de contacto son ficticios.

## Cómo se evaluó

`CHECKLIST-RUBRICA.md` contiene una tabla por página con cada criterio de la rúbrica y
la evidencia concreta en el código. Es el documento recomendado para revisar la entrega
junto al profesor.
