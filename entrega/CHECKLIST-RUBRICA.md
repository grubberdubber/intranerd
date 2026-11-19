# Checklist de cobertura de las rúbricas

Este documento relaciona cada criterio de las rúbricas de `docs/rubrica/` con la
evidencia concreta de la entrega. La columna **Nivel** indica el nivel que se busca
demostrar con esa evidencia.

> Autoevaluación: se preparó el sitio para aspirar al nivel **3 (logrado
> completamente)** en todos los criterios. La revisión final debe hacerse abriendo
> `entrega/index.html` en un navegador.

---

## 1. Rúbrica · Página Inicio

| Criterio                                     | Evidencia                                                                                                                                                                                                             | Nivel |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| Resumen general de la empresa                | Sección «Quiénes somos» de `index.html`: explica que IntraNerd diseña plataformas, automatizaciones y experiencias digitales para colegios, pymes y organizaciones, sin centrarse solo en el proyecto escolar.        | 3     |
| Hero: ubicación, ancho e imagen de fondo     | `.hero` es la primera sección de `<main>`, inmediatamente después del header; ocupa todo el ancho y usa `img/hero-inicio.svg` con una capa de gradiente oscuro para legibilidad (`css/index.css`).                    | 3     |
| Hero: nombre y slogan                        | `<h1>IntraNerd</h1>` y el slogan «Tecnología que conecta personas y simplifica el día a día» (9 palabras), visible sobre el hero.                                                                                     | 3     |
| Hero: énfasis de color y botón               | La palabra «conecta» usa `.highlight` en color ámbar. El botón dice «Ver portafolio» y enlaza a `soluciones.html`.                                                                                                    | 3     |
| Servicios de la empresa                      | Cuatro servicios pertinentes en `#servicios`: plataformas de gestión, automatización, desarrollo web/apps y datos/acompañamiento, con descripciones propias.                                                          | 3     |
| Tarjetas de servicios y navegación           | Los cuatro servicios son tarjetas `<a>` completas, clicables, con iconos y enlaces a las soluciones correspondientes (`#aula-viva`, `#ruta-clara`, `#turno-facil`, `#datos-al-dia`).                                  | 3     |
| Misión y visión: contenido                   | Misión: «Crear tecnología clara y cercana que ayude a las organizaciones a trabajar mejor, sin perder el trato humano». Visión: ser socio tecnológico de referencia en Latinoamérica por calidad, cercanía e impacto. | 3     |
| Misión y visión: presentación visual         | `.mv-grid` coloca los dos artículos lado a lado y `.mv-circle` usa `aspect-ratio: 1 / 1` + `border-radius: 50%`, manteniendo círculos perfectos.                                                                      | 3     |
| Mascota de la empresa                        | Sección «Conoce a Nerdi» con `img/nerdi.webp`, alt descriptivo, tamaño contenido y texto que explica su rol en la marca.                                                                                              | 3     |
| Identidad corporativa: colores y tipografías | Variables en `css/style.css` (`--brand-800: #1e40af`, `--brand-600: #2563eb`, `--accent-500`). Google Fonts Sora para títulos e Inter para textos, con `.font-heading` y `.font-body`.                                | 3     |
| Estructura de carpetas y archivos            | `entrega/` contiene `css/`, `img/`, `audio/`, `video/`, `js/` y los cuatro HTML; cada página tiene su CSS compartido y específico.                                                                                    | 3     |
| Vinculación de hojas de estilo               | `index.html` enlaza `css/style.css` y `css/index.css` en el `<head>`, en ese orden.                                                                                                                                   | 3     |
| Header compartido y navegación               | Header con marca y enlaces funcionales a Inicio, Nosotros, Soluciones y Contacto; `aria-current="page"` en Inicio. Menú móvil en `js/main.js`.                                                                        | 3     |
| Footer compartido y enlaces                  | Footer con marca, descripción, enlaces a las cuatro páginas, a las cuatro soluciones, correo, teléfono, dirección y formulario. Todos los destinos existen.                                                           | 3     |

---

## 2. Rúbrica · Página Nosotros

| Criterio                                | Evidencia                                                                                                                                       | Nivel |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| Historia de la empresa                  | `nosotros.html` relata el origen en 2018, la trayectoria (2021, 2024) y el propósito de acercar la tecnología a las personas.                   | 3     |
| Imagen representativa                   | `img/historia-oficina.svg`, ilustración del equipo trabajando en la oficina, integrada junto a la historia con `figcaption`.                    | 3     |
| Perfiles: información                   | Cuatro perfiles con nombre, retrato, cargo, funciones y habilidad destacada: Rodrigo Martínez, Snayder Martínez, Yhostin Rivera y Rogelio Peña. | 3     |
| Perfiles: presentación visual           | `.team-grid` de cuatro columnas, tarjetas uniformes, retrato con proporción fija y bloques de texto claramente separados.                       | 3     |
| Valores: contenido                      | Cuatro valores explicados: Claridad, Cercanía, Responsabilidad y Curiosidad, cada uno con una aplicación concreta al trabajo.                   | 3     |
| Valores: tarjetas                       | `.values-grid` con cuatro `.value-card` diferenciadas, icono, título y texto; fondo oscuro con contraste.                                       | 3     |
| Organización y jerarquía                | Secciones ordenadas: historia, equipo, valores y propósito; cada una con `h2`, `eyebrow` y títulos internos.                                    | 3     |
| Calidad y pertinencia de los contenidos | Textos institucionales, específicos y sin errores visibles; se explica el propósito y no solo el producto.                                      | 3     |
| Mascota de la empresa                   | Sección «Nerdi también está en el equipo» con imagen, texto y enlace al contacto.                                                               | 3     |
| Identidad corporativa                   | Variables de color y fuentes compartidas de `css/style.css`; la página conserva la paleta azul/ámbar y Sora/Inter.                              | 3     |
| Estructura de carpetas                  | La página usa `css/nosotros.css`, `img/equipo-*.svg`, `img/historia-oficina.svg` y `js/main.js` dentro de la estructura solicitada.             | 3     |
| Vinculación de hojas de estilo          | `nosotros.html` enlaza `css/style.css` y `css/nosotros.css`.                                                                                    | 3     |
| Header compartido                       | Mismo header que Inicio, con `aria-current="page"` en Nosotros y enlaces funcionales.                                                           | 3     |
| Footer compartido                       | Mismo footer que Inicio, con enlaces verificados y datos de contacto.                                                                           | 3     |

---

## 3. Rúbrica · Página Soluciones

| Criterio                          | Evidencia                                                                                                                                                                | Nivel |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| Qué nos destaca                   | `#destaca` presenta cuatro diferenciadores concretos: diagnóstico previo, entregas por etapas, diseño para personas y acompañamiento posterior.                          | 3     |
| Preguntas y respuestas: contenido | Cuatro preguntas pertinentes en `#preguntas`, con respuestas sobre alcance, método, tamaños de cliente y seguridad.                                                      | 3     |
| Ejemplos: cantidad y pertinencia  | Cuatro soluciones ficticias variadas: Aula Viva (educación), Ruta Clara (logística), Turno Fácil (reservas) y Datos al Día (datos). Cada una tiene título y descripción. | 3     |
| Ejemplos: tarjetas e imágenes     | Cada solución usa una `.solution-card` con imagen propia en `img/solucion-*.svg` y `alt` descriptivo.                                                                    | 3     |
| Ejemplos: información desplegable | Cada tarjeta tiene un botón con `data-accordion`, `aria-expanded` y panel `hidden` que se abre/cierra con `js/main.js`; el icono cambia entre `+` y `−`.                 | 3     |
| Iconos, tiempo y presupuesto      | Cada tarjeta muestra un icono de reloj con semanas y un icono de presupuesto con un rango en USD; ambos son legibles y consistentes.                                     | 3     |
| Mascota de la empresa             | Sección «Nerdi aprueba» con imagen, alt y texto relacionado con el método de trabajo.                                                                                    | 3     |
| Distribución y adaptabilidad      | `.solutions-grid` usa dos columnas en escritorio y una en móvil; las tarjetas conservan proporción y legibilidad.                                                        | 3     |
| Presentación visual y legibilidad | Secciones diferenciadas, jerarquía Sora/Inter, espaciado amplio, contraste y fondos alternados.                                                                          | 3     |
| Identidad corporativa             | Paleta y fuentes compartidas; se reutilizan variables, botones y tarjetas de `style.css`.                                                                                | 3     |
| Estructura de carpetas            | `soluciones.css`, las cuatro imágenes de solución y `main.js` están dentro de `css/`, `img/` y `js/`.                                                                    | 3     |
| Vinculación de hojas de estilo    | `soluciones.html` enlaza `css/style.css` y `css/soluciones.css`.                                                                                                         | 3     |
| Header compartido                 | Mismo header, con `aria-current="page"` en Soluciones y navegación funcional.                                                                                            | 3     |
| Footer compartido                 | Mismo footer y enlaces funcionales a páginas, soluciones y contacto.                                                                                                     | 3     |

---

## 4. Rúbrica · Página Contacto

| Criterio                          | Evidencia                                                                                                                                                          | Nivel |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| Mensaje para el cliente           | Sección «Hola, qué bueno que estás aquí»: mensaje cordial, claro y coherente con IntraNerd, que invita a completar el formulario y explica el tiempo de respuesta. | 3     |
| Formulario: campos solicitados    | `contacto.html` incluye nombre, apellido, correo, fecha de nacimiento, sexo (radios), motivo (select), mensaje (textarea) y botón «Enviar mensaje».                | 3     |
| Formulario: tipos de input        | `text`, `text`, `email`, `date`, `radio`, `select`, `textarea` y `submit`, cada uno en el campo correspondiente.                                                   | 3     |
| Formulario: etiquetas y atributos | Todos los campos tienen `label for`/`id`, `name` y `required`; los radios comparten `name="sexo"`; el select tiene cinco motivos reales.                           | 3     |
| Formulario: pares y adaptabilidad | `.form-grid` usa dos columnas: nombre–apellido, correo–fecha, sexo–motivo; en `max-width: 700px` pasa a una columna.                                               | 3     |
| FAQ: contenido                    | Cinco preguntas frecuentes con respuestas claras sobre respuesta, cotización, trabajo remoto, datos y soporte.                                                     | 3     |
| FAQ: acordeón                     | Cada pregunta es un botón con `data-accordion`, `aria-expanded` y panel `hidden`; `js/main.js` alterna estado e icono.                                             | 3     |
| Mascota de la empresa             | Nerdi aparece en la sección de bienvenida con `img/nerdi.webp`, alt y tamaño integrado.                                                                            | 3     |
| Presentación visual y legibilidad | Mensaje, formulario, datos directos y FAQ están separados en secciones; formulario en tarjeta blanca y textos con contraste.                                       | 3     |
| Identidad corporativa             | Variables de color y Sora/Inter compartidas; botones y campos siguen el sistema visual.                                                                            | 3     |
| Estructura de carpetas            | `contacto.css`, `contacto.js`, `main.js`, imágenes y HTML están en las carpetas solicitadas.                                                                       | 3     |
| Vinculación de hojas de estilo    | `contacto.html` enlaza `css/style.css` y `css/contacto.css`.                                                                                                       | 3     |
| Header compartido                 | Mismo header, `aria-current="page"` en Contacto y enlaces funcionales.                                                                                             | 3     |
| Footer compartido                 | Mismo footer, con enlaces funcionales y canales de contacto.                                                                                                       | 3     |

---

## Verificación técnica realizada

- Las cuatro páginas se cargaron con un servidor HTTP local y sin errores de consola.
- Los enlaces internos y las anclas se comprobaron con un analizador HTML.
- El menú móvil abre/cierra y actualiza `aria-expanded`.
- Los acordeones de Soluciones y Contacto abren y cierran sus paneles.
- El formulario rechaza el envío vacío y muestra confirmación con datos válidos.
- No hay desborde horizontal a 390 px ni a 1440 px.
- Las imágenes y los archivos CSS/JS referenciados existen.

## Notas para la revisión

- El formulario es una **demostración local**: no envía datos a un servidor.
- Los proyectos, presupuestos, clientes y datos de contacto son ficticios y se usan
  con fines académicos.
- Las carpetas `audio/` y `video/` se incluyen para completar la estructura solicitada;
  el sitio no necesita multimedia para funcionar.
