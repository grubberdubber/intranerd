# Guía del equipo IntraNerd

> **Para el equipo de la escuela.** Este documento está pensado para quienes
> están entrando al proyecto y todavía no han escrito HTML, CSS o JavaScript.
> No necesitas saber programar para empezar: aquí vamos paso a paso, con
> ejemplos reales de nuestra propia plataforma.
>
> Si ya programsás, salta directo al capítulo 7 (SPA) o al 10 (flujo de trabajo).

---

## Índice

1. [Antes de empezar](#1-antes-de-empezar)
2. [Qué es IntraNerd](#2-qué-es-intranerd)
3. [La web en tres capas](#3-la-web-en-tres-capas)
4. [HTML desde cero](#4-html-desde-cero)
5. [CSS desde cero](#5-css-desde-cero)
6. [Tipografías: cómo agregar y cambiar una fuente](#6-tipografías-cómo-agregar-y-cambiar-una-fuente)
7. [Iconos: cómo se usan y cómo agregar uno](#7-iconos-cómo-se-usan-y-cómo-agregar-uno)
8. [JavaScript y funciones](#8-javascript-y-funciones)
9. [Cómo funciona una SPA](#9-cómo-funciona-una-spa)
10. [Guardar datos con localStorage](#10-guardar-datos-con-localstorage)
11. [Footer, legal y accesibilidad](#11-footer-legal-y-accesibilidad)
12. [Flujo de trabajo del equipo](#12-flujo-de-trabajo-del-equipo)
13. [Problemas frecuentes](#13-problemas-frecuentes)
14. [Glosario](#14-glosario)
15. [Retos para practicar](#15-retos-para-practicar)

---

## 1. Antes de empezar

### Para quién es esta guía

Para el equipo de la escuela que mantiene IntraNerd: alumnas y alumnos,
delegados, ayudantes del taller de programación y cualquier persona que se sume
a mejorar la plataforma. No hace falta experiencia previa.

### Qué necesitas instalar

| Herramienta               | Para qué sirve                                      | Dónde se consigue               |
| ------------------------- | --------------------------------------------------- | ------------------------------- |
| **Visual Studio Code**    | Escribir y revisar el código                        | <https://code.visualstudio.com> |
| **Node.js 24 o superior** | Ejecutar la app y las pruebas                       | <https://nodejs.org>            |
| **pnpm**                  | Instalar dependencias del proyecto                  | <https://pnpm.io/installation>  |
| **Chrome o Firefox**      | Probar la app y usar las herramientas de desarrollo | Ya lo tienes                    |

En VS Code, instala la extensión **Prettier** y activa "Format On Save". El
proyecto usa Prettier para que todo el equipo escriba el código con el mismo
estilo.

> **Importante:** usamos **pnpm**, no `npm install`. Si copias instrucciones de
> internet, revisa que no te pidan npm. Nuestro proyecto tiene un workspace y
> pnpm lo maneja mejor.

### Las tres reglas del equipo

1. **Prueba en tu computador antes de subir cambios.** Si no abre en tu
   navegador, no está listo.
2. **No trabajes directamente en `main`.** Crea una rama con tu nombre o el
   nombre del cambio.
3. **Pregunta antes de borrar.** Si no entiendes un archivo, no lo elimines:
   pregunta por el canal del equipo.

---

## 2. Qué es IntraNerd

IntraNerd es la plataforma interna de nuestro colegio. Reúne en un solo lugar
lo que antes estaba repartido en planillas, grupos de mensajes y papel:

| Módulo                        | Qué resuelve                                              |
| ----------------------------- | --------------------------------------------------------- |
| **Panel general**             | Resumen del día: próximas pruebas, tareas y avisos        |
| **Notas y promedios**         | Asignaturas, notas de cada semestre y promedio final      |
| **Talleres**                  | Catálogo, horarios e inscripción con cupos                |
| **Personas extraviadas**      | Reportes de seguridad dentro del recinto                  |
| **Calificador de profesores** | Estrellas, opiniones y evidencias                         |
| **Objetos perdidos**          | Panel de objetos encontrados y avisos de perdidos         |
| **Calendario**                | Pruebas y evaluaciones por día, con feriados              |
| **Comunicados**               | Tablón oficial de dirección, docentes y centro de alumnos |
| **Tareas**                    | Deberes por asignatura y checklist personal               |
| **Contacto**                  | Soporte, accesibilidad y consultas                        |

La aplicación está pensada para funcionar **sin conexión**: guarda todo en el
navegador. Además existe una API opcional para compartir datos entre equipos,
pero no es obligatoria para usar la plataforma.

### Las piezas grandes del proyecto

```text
intranerd/
├── index.html          ← la única página HTML que se carga
├── src/                ← el código de la aplicación
│   ├── main.js         ← arranque
│   ├── router.js       ← decide qué módulo mostrar
│   ├── views/          ← una vista por módulo
│   ├── components/     ← piezas reutilizables (footer, modal, iconos…)
│   ├── services/       ← almacenamiento, API, perfil
│   ├── data/           ← catálogos, feriados y textos legales
│   └── styles/         ← todo el CSS
├── assets/             ← logos, mascota, fuente Inter e ilustraciones
├── backend/            ← API opcional (Express + SQLite)
├── docs/               ← documentación (esta guía incluida)
└── tests/              ← pruebas automáticas
```

---

## 3. La web en tres capas

Una página web se parece a una persona:

| Capa           | Tecnología     | Qué hace                                           | Analogía                  |
| -------------- | -------------- | -------------------------------------------------- | ------------------------- |
| Estructura     | **HTML**       | Define qué hay: títulos, textos, botones, imágenes | El cuerpo y los huesos    |
| Presentación   | **CSS**        | Define cómo se ve: colores, tamaños, espacios      | La ropa y el peinado      |
| Comportamiento | **JavaScript** | Define qué pasa al hacer clic, escribir o navegar  | El cerebro y los reflejos |

Las tres trabajan juntas. Un botón es un elemento HTML, se pinta con CSS y
responde a un clic con JavaScript.

### Tu primer archivo HTML

Crea una carpeta en tu computador llamada `practica` y dentro un archivo
`hola.html`. Pega esto y ábrelo con doble clic:

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mi primera página</title>
  </head>
  <body>
    <h1>Hola, equipo IntraNerd</h1>
    <p>Esta es mi primera página web.</p>
    <button type="button">Haz clic</button>
  </body>
</html>
```

Eso ya es una página web completa. Ahora vamos a entender cada línea.

---

## 4. HTML desde cero

### 4.1 Etiquetas: la idea más importante

Una **etiqueta** es una instrucción entre signos `<` y `>`. Casi siempre vienen
en parejas: una de apertura y una de cierre. El cierre lleva una barra `/`.

```html
<p>Esto es un párrafo.</p>
```

- `<p>` abre el párrafo.
- `</p>` lo cierra.
- El texto del medio es el contenido.

Algunas etiquetas no tienen contenido y se cierran solas:

```html
<img src="foto.jpg" alt="Descripción de la foto" />
<br />
<input type="text" />
```

### 4.2 La estructura mínima

Todo documento HTML tiene esta forma:

```html
<!doctype html>
<html lang="es">
  <head>
    <!-- Información para el navegador: no se ve en la página -->
  </head>
  <body>
    <!-- Todo lo que sí se ve -->
  </body>
</html>
```

- `<!doctype html>` le dice al navegador que use HTML moderno.
- `<html lang="es">` indica que el contenido está en español (importante para
  lectores de pantalla y traductores).
- `<head>` guarda metadatos: título de la pestaña, codificación, estilos.
- `<body>` contiene lo visible.

### 4.3 Etiquetas que vas a usar siempre

| Etiqueta        | Para qué sirve                            | Ejemplo                                  |
| --------------- | ----------------------------------------- | ---------------------------------------- |
| `<h1>` a `<h6>` | Títulos y subtítulos (h1 es el principal) | `<h1>Panel</h1>`                         |
| `<p>`           | Párrafo de texto                          | `<p>Hola</p>`                            |
| `<a>`           | Enlace a otra página o sección            | `<a href="#/notas">Notas</a>`            |
| `<img>`         | Imagen                                    | `<img src="logo.svg" alt="Logo" />`      |
| `<ul>` y `<li>` | Lista con viñetas y sus elementos         | `<ul><li>Uno</li></ul>`                  |
| `<ol>`          | Lista numerada                            | `<ol><li>Primero</li></ol>`              |
| `<button>`      | Botón que ejecuta una acción              | `<button type="button">Guardar</button>` |
| `<strong>`      | Texto importante (se ve en negrita)       | `<strong>Ojo</strong>`                   |
| `<em>`          | Énfasis (se ve en cursiva)                | `<em>quizás</em>`                        |
| `<br>`          | Salto de línea                            | `Hola<br />mundo`                        |
| `<hr>`          | Línea separadora                          | `<hr />`                                 |
| `<div>`         | Caja genérica para agrupar                | `<div class="card">…</div>`              |
| `<span>`        | Fragmento de texto dentro de una línea    | `<span class="dato">7.0</span>`          |

### 4.4 Etiquetas de estructura semántica

No todo es `div`. Estas etiquetas le dicen al navegador (y a los lectores de
pantalla) qué papel cumple cada zona:

```html
<header>Cabecera de la página o de una sección</header>
<nav>Menú de navegación</nav>
<main>Contenido principal, uno solo por página</main>
<section>Una sección con tema propio</section>
<article>Un contenido independiente, como un comunicado</article>
<aside>Información complementaria</aside>
<footer>Pie de página</footer>
```

En IntraNerd usamos exactamente eso: `index.html` tiene un `<main>` y el pie
institucional es un `<footer>`.

### 4.5 Atributos: información extra dentro de la etiqueta

Un **atributo** va dentro de la etiqueta de apertura y siempre tiene la forma
`nombre="valor"`.

```html
<a href="#/calendario" class="btn btn--primary" target="_blank">Calendario</a>
```

- `href` indica el destino del enlace.
- `class` aplica estilos CSS.
- `target="_blank"` abre en otra pestaña.
- `alt` describe una imagen para quienes no pueden verla.
- `id` identifica un elemento único en la página.

Atributos que verás en formularios:

```html
<label for="nombre">Nombre</label>
<input id="nombre" name="nombre" type="text" placeholder="Ej: Camila" required />
```

`<label for="nombre">` debe coincidir con el `id` del input. Eso permite hacer
clic en el texto para enfocar el campo y es clave para accesibilidad.

### 4.6 Anidación: cajas dentro de cajas

```html
<section class="tarjeta">
  <h2>Taller de programación</h2>
  <p>Inscríbete antes del <strong>viernes</strong>.</p>
  <button type="button">Inscribirme</button>
</section>
```

Regla de oro: si abres una etiqueta dentro de otra, ciérrala antes de cerrar la
primera. Un error de anidación rompe el diseño de formas difíciles de detectar.

### 4.7 Rutas de archivos

| Tipo                  | Ejemplo                    | Cuándo usarla                  |
| --------------------- | -------------------------- | ------------------------------ |
| Relativa              | `assets/brand/favicon.svg` | Archivos de nuestro proyecto   |
| Relativa hacia arriba | `../assets/logo.svg`       | Desde una carpeta más profunda |
| Absoluta              | `/assets/logo.svg`         | Desde la raíz del sitio        |
| Externa               | `https://ejemplo.cl`       | Otro sitio de internet         |

Si una imagen no carga, casi siempre es una ruta mal escrita. Revisa la consola
del navegador (F12 → Console): te dice qué archivo no encontró.

### 4.8 Ejercicio del capítulo

Abre `hola.html` y agrega:

1. Un menú `<nav>` con tres enlaces a `#/panel`, `#/notas` y `#/tareas`.
2. Una lista con tus tres tareas pendientes.
3. Un `<footer>` con tu nombre y el año.

---

## 5. CSS desde cero

### 5.1 Cómo se conecta el CSS

Hay tres formas de aplicar CSS. En el proyecto usamos solo la primera:

```html
<link rel="stylesheet" href="src/styles/main.css" />
```

También se puede escribir dentro de `<style>` o en el atributo `style`, pero
mezclar estilos complica el mantenimiento. **Regla del equipo:** todo el CSS va
en `src/styles/`.

### 5.2 Selectores

```css
/* Todas las etiquetas <h2> */
h2 {
  color: #1e40af;
}

/* Todos los elementos con class="tarjeta" */
.tarjeta {
  background: white;
  border-radius: 12px;
}

/* El elemento con id="panel" (solo uno por página) */
#panel {
  padding: 24px;
}

/* Un botón dentro de .tarjeta */
.tarjeta button {
  background: #2563eb;
  color: white;
}

/* Solo cuando el mouse está encima */
.tarjeta button:hover {
  background: #1d4ed8;
}
```

En IntraNerd usamos nombres con doble guion bajo para partes de un componente:
`page-header`, `page-header__title`, `page-header__description`. Se llama
convención **BEM** y ayuda a saber a qué componente pertenece cada clase.

### 5.3 El modelo de caja

Todo elemento es una caja con cuatro capas:

```text
┌─────────────────────────────┐
│          margin             │  espacio por fuera
│  ┌───────────────────────┐  │
│  │        border         │  │  borde
│  │  ┌─────────────────┐  │  │
│  │  │    padding      │  │  │  espacio por dentro
│  │  │  ┌───────────┐  │  │  │
│  │  │  │ contenido │  │  │  │
│  │  │  └───────────┘  │  │  │
│  │  └─────────────────┘  │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

```css
.tarjeta {
  padding: 20px; /* espacio interno */
  margin-bottom: 16px; /* espacio externo */
  border: 1px solid #e2e8f0; /* borde */
}
```

### 5.4 Flexbox y Grid en dos ideas

**Flexbox** ordena elementos en una fila o columna:

```css
.barra {
  display: flex;
  align-items: center; /* centrado vertical */
  gap: 12px; /* separación entre hijos */
}
```

**Grid** arma una cuadrícula:

```css
.cuadricula {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* tres columnas iguales */
  gap: 16px;
}
```

El footer de IntraNerd usa Grid para las columnas y Flexbox para alinear iconos
con texto.

### 5.5 Variables CSS: los tokens del proyecto

En `src/styles/tokens.css` guardamos los colores, tamaños y sombras una sola
vez. Después se usan con `var()`:

```css
:root {
  --brand-800: #1e40af;
  --space-4: 1rem;
  --radius-md: 12px;
}

.boton {
  background: var(--brand-800);
  padding: var(--space-4);
  border-radius: var(--radius-md);
}
```

**Si quieres cambiar un color en toda la plataforma, cámbialo en
`tokens.css`, no en cada archivo.** Así evitamos veinte azules distintos.

### 5.6 Responsive: adaptarse al celular

Usamos `@media` para cambiar estilos según el ancho de pantalla:

```css
/* Escritorio: sidebar fijo */
.app-layout {
  grid-template-columns: 272px 1fr;
}

/* Celular: una sola columna */
@media (max-width: 900px) {
  .app-layout {
    grid-template-columns: 1fr;
  }
}
```

Prueba siempre en dos tamaños: escritorio y celular. En Chrome: F12 → icono de
dispositivo (Ctrl + Shift + M).

### 5.7 Dónde va cada estilo

```text
src/styles/
├── main.css              ← importa todo, en orden
├── tokens.css            ← colores, tipografía, espacios
├── base.css              ← reset y estilos globales
├── layout.css            ← sidebar, topbar, footer
├── fonts.css             ← @font-face de Inter
├── components/           ← botones, formularios, modal, footer, cookies…
└── views/                ← un CSS por módulo
```

`main.css` importa en orden: tokens → base → layout → componentes → vistas. Si
agregas un archivo nuevo, **impórtalo en `main.css`** o no se aplicará.

### 5.8 Ejercicio del capítulo

En `practica/hola.html`, agrega un bloque `<style>` y:

1. Cambia el color de fondo del `body` a `#f4f7fb`.
2. Centra el contenido con `max-width: 640px; margin: 0 auto;`.
3. Haz que el botón tenga borde redondeado y cambie de color al pasar el mouse.

---

## 6. Tipografías: cómo agregar y cambiar una fuente

### 6.1 Cómo funciona una fuente en la web

El navegador solo puede mostrar una tipografía si el archivo está disponible.
Hay dos caminos:

1. **Autoalojarla:** copias el archivo `.woff2` a `assets/fonts/` y lo declaras
   con `@font-face`. Es lo que hace IntraNerd.
2. **Usar un servicio externo** como Google Fonts: más rápido de configurar,
   pero agrega peticiones a otro dominio y posibles cookies de terceros.

En IntraNerd usamos la opción 1 con **Inter**. Está en `assets/fonts/` y se
declara en `src/styles/fonts.css`:

```css
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('../../assets/fonts/inter-latin.woff2') format('woff2');
}
```

- `font-weight: 100 900` significa que el archivo es variable: incluye todos
  los grosores.
- `font-display: swap` muestra una fuente de respaldo mientras carga la real,
  así el texto nunca queda invisible.
- `index.html` precarga los dos archivos para que aparezcan más rápido.

### 6.2 Por qué no usamos Google Fonts en tiempo de ejecución

- **Privacidad:** no enviamos la IP de cada estudiante a un tercero.
- **Velocidad:** no dependemos de una red externa.
- **Funciona sin internet**, igual que el resto de la plataforma.
- **Cumple nuestra política de cookies:** no hay cookies de terceros.

### 6.3 Agregar una tipografía nueva, paso a paso

Supongamos que el equipo de arte eligió **"Space Grotesk"** para los títulos.

**Paso 1. Consigue el archivo y su licencia.**
Descarga el `.woff2` desde la página oficial de la fuente. Guarda también el
archivo de licencia (`.txt` o `.md`). Nunca subas una fuente sin licencia.

**Paso 2. Copia los archivos al proyecto.**

```text
assets/fonts/space-grotesk.woff2
assets/fonts/space-grotesk-OFL.txt
```

**Paso 3. Declara la fuente en `src/styles/fonts.css`.**

```css
@font-face {
  font-family: 'Space Grotesk';
  font-style: normal;
  font-weight: 500 700;
  font-display: swap;
  src: url('../../assets/fonts/space-grotesk.woff2') format('woff2');
}
```

**Paso 4. Crea un token en `src/styles/tokens.css`.**

```css
--font-display: 'Space Grotesk', 'Inter', system-ui, sans-serif;
```

**Paso 5. Úsalo donde corresponda.**

```css
.page-header__title,
.sidebar__name {
  font-family: var(--font-display);
}
```

**Paso 6. Precarga el archivo (opcional, recomendado).**
En `index.html`, dentro de `<head>`:

```html
<link
  rel="preload"
  href="assets/fonts/space-grotesk.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
```

**Paso 7. Verifica.**
Abre la app, entra a DevTools → Network → filtra por "Font". Debe aparecer el
archivo servido desde tu propio dominio. Si ves `fonts.googleapis.com`, algo
quedó mal.

### 6.4 Cambiar tamaños y pesos

Los tamaños están en tokens:

```css
--text-xs: 0.75rem;
--text-sm: 0.8125rem;
--text-base: 0.9375rem;
--text-lg: 1.25rem;
--text-2xl: 1.875rem;
```

Reglas del equipo:

- No bajes de `12px` (`0.75rem`) para texto normal.
- Usa `rem`, no `px`, para tamaños de texto.
- Mantén un `line-height` de al menos `1.5` en párrafos.
- Los títulos pueden ser más ajustados (`1.2`), pero nunca ilegibles.

### 6.5 Ejercicio del capítulo

1. Cambia el token `--font-sans` para que empiece con `'Segoe UI'`.
2. Recarga la app y observa la diferencia.
3. Vuelve a dejarlo como estaba. (Sí, es un ejercicio de ida y vuelta.)

---

## 7. Iconos: cómo se usan y cómo agregar uno

### 7.1 Nuestro sistema de iconos

No usamos una librería externa ni imágenes PNG. Los iconos son **SVG inline**
definidos en `src/components/icon.js`. Eso significa:

- Se pintan nítidos en cualquier pantalla.
- Heredan el color del texto (`stroke="currentColor"`).
- No hacen peticiones adicionales.
- No pesan como una fuente de iconos completa.

Cada icono es una clave dentro del objeto `PATHS`:

```js
const PATHS = {
  calendar: '<rect x="3" y="4" …/><path d="M16 2v4M8 2v4M3 10h18"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  // …
};
```

### 7.2 Cómo usar un icono en JavaScript

```js
import { icon } from '../components/icon.js';

const markup = icon('calendar', { size: 18 });
```

Devuelve una cadena con el `<svg>`. En nuestras vistas se inserta con `html`:

```js
el('span', { class: 'stat-card__icon', html: icon('calendar', { size: 20 }) });
```

Opciones disponibles:

| Opción        | Valor por defecto | Para qué                |
| ------------- | ----------------- | ----------------------- |
| `size`        | `20`              | Ancho y alto en píxeles |
| `className`   | `''`              | Clases CSS del SVG      |
| `strokeWidth` | `1.8`             | Grosor del trazo        |

También existe `iconEl(name, options)` si necesitas un nodo DOM en vez de una
cadena, y `ICON_NAMES` con la lista completa.

### 7.3 Reglas de accesibilidad

El SVG siempre lleva `aria-hidden="true"` para que el lector de pantalla no lo
lea. El nombre accesible va en el **botón o enlace** que lo contiene:

```html
<button type="button" aria-label="Eliminar comunicado">
  <!-- icono de basura -->
</button>
```

Nunca pongas un icono como única información sin texto alternativo o
`aria-label`.

### 7.4 Agregar un icono nuevo

**Paso 1. Elige un icono con licencia abierta.**
Puedes usar [Lucide](https://lucide.dev) o [Feather](https://feathericons.com)
(licencia MIT). Copia solo el contenido interno del SVG, no el `<svg>` completo.

**Paso 2. Añádelo a `PATHS` en `src/components/icon.js`.**

```js
camera:
  '<path d="M14.5 4h-5L8 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4l-1.5-2Z"/><circle cx="12" cy="13" r="3.5"/>',
```

**Paso 3. Úsalo.**

```js
el('button', {
  class: 'btn btn--ghost btn--sm',
  type: 'button',
  html: `${icon('camera', { size: 16 })}<span>Agregar foto</span>`,
});
```

**Paso 4. Verifica el tamaño y el trazo.**
Los iconos del proyecto usan `viewBox="0 0 24 24"`, trazo redondeado y sin
relleno. Si tu icono se ve enorme o desalineado, revisa que hayas copiado las
coordenadas originales y no las hayas inventado.

### 7.5 Ejercicio del capítulo

1. Usa el icono `pin` que ya existe en `PATHS`.
2. Úsalo en una tarjeta junto a la ubicación de un taller.
3. Comprueba con el lector de pantalla o inspeccionando el HTML que el SVG tiene
   `aria-hidden="true"`.

---

## 8. JavaScript y funciones

### 8.1 Variables: `const` y `let`

```js
const nombre = 'Camila'; // no cambia
let contador = 0; // puede cambiar
contador = contador + 1;
```

Usa `const` por defecto. Solo usa `let` si el valor va a cambiar. **`var` está
prohibido en el proyecto** (el lint lo detecta).

### 8.2 Tipos de datos

```js
const texto = 'Hola'; // string
const numero = 7.0; // number
const activo = true; // boolean
const vacio = null; // ausencia intencional
const indefinido = undefined; // aún no asignado
const lista = ['uno', 'dos']; // array
const persona = { nombre: 'Camila', rol: 'alumna' }; // objeto
```

### 8.3 Funciones

Una función es una receta: recibe datos, hace algo y devuelve un resultado.

```js
function calcularPromedio(notas) {
  if (notas.length === 0) return 0;
  const suma = notas.reduce((total, nota) => total + nota, 0);
  return suma / notas.length;
}

const promedio = calcularPromedio([6.5, 5.8, 7.0]);
console.log(promedio); // 6.43…
```

- `notas` es un **parámetro**.
- `return` devuelve el resultado.
- `if` toma una decisión.
- `reduce` recorre la lista sumando cada nota.
- `===` compara de forma estricta. **Nunca uses `==`** (el lint lo detecta).

También existen las funciones flecha:

```js
const esAprobado = (promedio) => promedio >= 4.0;
```

Y las funciones dentro de objetos, que es lo que usamos en `storage`:

```js
storage.get('grades.subjects', []);
```

### 8.4 Eventos: reaccionar a lo que hace la persona

```js
const boton = document.querySelector('#mi-boton');

boton.addEventListener('click', () => {
  console.log('El botón fue presionado');
});
```

Un formulario se maneja así:

```js
formulario.addEventListener('submit', (evento) => {
  evento.preventDefault(); // evita que la página se recargue
  const nombre = input.value.trim();
  if (!nombre) {
    alert('Escribe un nombre');
    return;
  }
  guardar(nombre);
});
```

### 8.5 El DOM: crear elementos

El navegador convierte el HTML en un árbol de objetos llamado **DOM**. En el
proyecto no escribimos `document.createElement` a mano: usamos el ayudante
`el()` de `src/utils/dom.js`.

```js
import { el } from '../utils/dom.js';

const tarjeta = el(
  'article',
  { class: 'card' },
  el('h2', { class: 'card__title', text: 'Taller de ajedrez' }),
  el('p', { text: 'Miércoles 16:00 · Sala 12' }),
  el('button', {
    class: 'btn btn--primary',
    type: 'button',
    text: 'Inscribirme',
    on: { click: () => console.log('Inscrito') },
  }),
);

document.querySelector('#contenedor').appendChild(tarjeta);
```

Ventajas de `el()`:

- Puedes pasar hijos como argumentos, sin concatenar strings.
- `text` es seguro (no interpreta HTML).
- `on` conecta eventos de forma legible.

**Regla de seguridad:** usa `text` para datos de personas. Usa `html` solo con
fragmentos que controlamos nosotros, como `icon()`.

### 8.6 Módulos: importar y exportar

Cada archivo puede exportar cosas y otros archivos importarlas:

```js
// src/utils/suma.js
export function sumar(a, b) {
  return a + b;
}

// src/views/mi-vista.js
import { sumar } from '../utils/suma.js';
```

Rutas relativas: `./` es la misma carpeta, `../` sube un nivel. Los archivos
deben tener la extensión `.js` en el `import`.

### 8.7 Errores: cómo leerlos

Abre la consola con **F12 → Console**. Un error típico:

```text
Uncaught TypeError: Cannot read properties of null (reading 'value')
```

Significa que intentaste leer `.value` de algo que no existe (probablemente un
`querySelector` que no encontró el elemento). Revisa:

1. El `id` o la clase del selector.
2. Que el elemento exista antes de ejecutar el código.
3. Que el archivo se haya importado.

### 8.8 Ejercicio del capítulo

En una página de práctica, crea:

1. Un input y un botón.
2. Al hacer clic, muestra el texto del input en un `<p>`.
3. Si el input está vacío, muestra "Escribe algo" en rojo.
4. Si tiene texto, guárdalo en un array y muestra cuántos elementos hay.

---

## 9. Cómo funciona una SPA

### 9.1 Qué es una SPA

**SPA** significa _Single Page Application_ (aplicación de una sola página). En
vez de cargar un HTML distinto por cada sección, se carga **una sola vez** y
JavaScript cambia el contenido según la dirección.

Ventajas:

- Navegación instantánea, sin recargas.
- El estado (filtros, formularios) se mantiene.
- Funciona bien sin conexión.

Desventajas:

- Necesita JavaScript.
- Hay que cuidar el rendimiento si la app crece mucho.

### 9.2 El flujo de IntraNerd

```text
index.html
   │  carga src/main.js
   ▼
main.js
   │  1. migra datos antiguos
   │  2. crea el layout (sidebar + topbar + footer)
   │  3. arranca el router
   ▼
router.js
   │  lee el hash de la URL: #/notas
   │  busca la vista correspondiente en VIEWS
   ▼
src/views/grades.js
   │  mount(contenedor)
   │  dibuja el módulo y conecta sus eventos
   ▼
contenedor principal
```

Cuando cambia el hash (`#/panel` → `#/calendario`), el navegador dispara el
evento `hashchange`. El router limpia la vista anterior, monta la nueva y
actualiza el título. **No hay recarga de página.**

### 9.3 Las piezas del router

`NAV_ITEMS` en `src/data/constants.js` define los módulos:

```js
{
  id: 'grades',
  path: '/notas',
  label: 'Notas y promedios',
  shortLabel: 'Notas',
  icon: 'grades',
  description: 'Registra calificaciones semestrales y calcula promedios.',
}
```

`src/router.js` conecta cada `id` con su función `mount`:

```js
const VIEWS = {
  dashboard: mountDashboard,
  grades: mountGrades,
  // …
};
```

Una vista siempre exporta una función `mount(container)` y puede devolver una
función de limpieza:

```js
export async function mount(container) {
  container.replaceChildren(
    pageHeader({ eyebrow: 'Mi módulo', title: 'Hola' }),
    el('p', { text: 'Contenido del módulo' }),
  );

  const unsubscribe = connection.subscribe(() => {
    // actualizar algo cuando cambia la conexión
  });

  // Se ejecuta al salir del módulo: cancela suscripciones y timers.
  return () => unsubscribe();
}
```

**No olvides devolver la limpieza.** Si agregas un `setInterval` o una
suscripción y no la cancelas, el módulo seguirá consumiendo recursos cuando ya
no esté visible.

### 9.4 Por qué usamos hash (`#/notas`)

El hash no necesita configuración especial del servidor: cualquier archivo
estático puede servirlo. Además, permite compartir enlaces directos sin que
Nginx tenga que reescribir rutas. En producción, Nginx igualmente tiene un
_fallback_ a `index.html` para que recargar una URL funcione.

### 9.5 Agregar un módulo nuevo, paso a paso

Supongamos que queremos un módulo **"Biblioteca"**.

**Paso 1. Agrega la entrada en `src/data/constants.js`.**

```js
{
  id: 'library',
  path: '/biblioteca',
  label: 'Biblioteca escolar',
  shortLabel: 'Biblioteca',
  icon: 'book',
  description: 'Catálogo de libros y préstamos.',
},
```

**Paso 2. Verifica el icono.**
Si `book` ya existe en `src/components/icon.js`, no hagas nada. Si no existe,
agrégalo siguiendo el capítulo 7.

**Paso 3. Crea la vista `src/views/library.js`.**

```js
import { el } from '../utils/dom.js';
import { pageHeader } from '../components/pageHeader.js';

export async function mount(container) {
  container.replaceChildren(
    pageHeader({
      eyebrow: 'Cultura',
      title: 'Biblioteca escolar',
      description: 'Explora el catálogo y solicita préstamos.',
    }),
    el(
      'section',
      { class: 'card' },
      el('h2', { class: 'card__title', text: 'Próximamente' }),
      el('p', { text: 'Este módulo está en construcción por el equipo.' }),
    ),
  );

  return () => {};
}
```

**Paso 4. Regístrala en `src/router.js`.**

```js
import { mount as mountLibrary } from './views/library.js';

const VIEWS = {
  // …
  library: mountLibrary,
};
```

**Paso 5. Agrega sus estilos.**
Crea `src/styles/views/library.css` y agrégalo a `src/styles/main.css`:

```css
@import url('./views/library.css');
```

**Paso 6. Prueba.**

- Abre `http://localhost:5173/#/biblioteca`.
- Haz clic en el menú lateral.
- Recarga la página estando en esa URL.
- Revisa la consola: no debe haber errores.

**Paso 7. Documenta.**
Agrega el módulo a la tabla del `README.md` y cuéntale al equipo en tu pull
request qué hace y cómo probarlo.

### 9.6 Ejercicio del capítulo

Crea el módulo "Biblioteca" con:

1. Un botón "Agregar libro" que abra un modal con un formulario.
2. Un contador de libros.
3. Los libros guardados en localStorage (capítulo siguiente).
4. Una función de limpieza aunque no tengas suscripciones (para practicar).

---

## 10. Guardar datos con localStorage

### 10.1 Qué es

`localStorage` es una caja del navegador que guarda pares clave-valor. Los
datos sobreviven a recargas y a cerrar el navegador, pero son **de ese
navegador y ese equipo**, no de la persona.

```js
localStorage.setItem('nombre', 'Camila');
const nombre = localStorage.getItem('nombre'); // "Camila"
localStorage.removeItem('nombre');
```

Solo guarda **texto**. Para listas y objetos hay que convertir con JSON:

```js
localStorage.setItem('tareas', JSON.stringify([{ titulo: 'Estudiar' }]));
const tareas = JSON.parse(localStorage.getItem('tareas') || '[]');
```

### 10.2 Cómo lo usamos en IntraNerd

No tocamos `localStorage` directamente en las vistas. Usamos el servicio
`src/services/storage.js`, que:

- Agrega el prefijo `intranerd.v2:` para no chocar con otros sitios.
- Convierte a JSON automáticamente.
- Avisa si la cuota está llena con un error claro.
- Permite exportar e importar datos.

```js
import { storage } from '../services/storage.js';

storage.set('miModulo.items', lista);
const lista = storage.get('miModulo.items', []);

if (storage.has('miModulo.items')) {
  // ya hay datos guardados
}

storage.remove('miModulo.items');
```

Las claves oficiales están en `STORAGE_KEYS` (`src/data/constants.js`), por
ejemplo `grades.subjects`, `tasks.items` o `calendar.events`.

### 10.3 Límites y cuidados

- El espacio típico es de **5 a 10 MB** por sitio. Las fotos en base64 llenan la
  cuota rápido.
- Si la persona borra los datos del navegador, la información se pierde.
- El modo incógnito borra todo al cerrar la ventana.
- **Nunca guardes contraseñas, tokens ni datos de salud.**
- Si una operación falla por cuota, muestra un mensaje claro; no la silencies.

### 10.4 Borrar datos para probar

Abre DevTools → Application → Local Storage, o ejecuta en la consola:

```js
localStorage.clear();
location.reload();
```

Para borrar solo la decisión de cookies:

```js
localStorage.removeItem('intranerd.v2:legal.cookieConsent');
location.reload();
```

### 10.5 Ejercicio del capítulo

1. Guarda una lista de tareas con `storage.set`.
2. Recarga la página y muéstrala con `storage.get`.
3. Elimina una tarea y verifica que el cambio persiste.

---

## 11. Footer, legal y accesibilidad

### 11.1 Dónde está cada pieza

| Archivo                                    | Responsabilidad                                            |
| ------------------------------------------ | ---------------------------------------------------------- |
| `src/data/legal.js`                        | Textos de Términos, Privacidad y Cookies + versión y fecha |
| `src/components/legal.js`                  | Convierte esos textos en el modal                          |
| `src/components/footer.js`                 | Footer institucional, enlaces y botones legales            |
| `src/components/cookieConsent.js`          | Banner inicial y panel de preferencias                     |
| `src/styles/components/footer.css`         | Diseño del footer                                          |
| `src/styles/components/legal.css`          | Diseño de los documentos                                   |
| `src/styles/components/cookie-consent.css` | Diseño del banner y preferencias                           |

El footer se monta en `src/components/layout.js`, después del `<main>`, para que
aparezca al final de todas las páginas sin repetir código en cada vista.

### 11.2 Cómo editar un documento legal

1. Abre `src/data/legal.js`.
2. Busca el documento (`terms`, `privacy` o `cookies`).
3. Edita `sections`: cada sección tiene `heading` y `paragraphs` o `bullets`.
4. Cambia `LEGAL_VERSION` y `LEGAL_UPDATED` si el cambio es relevante.
5. Prueba el modal desde el footer.

No escribas HTML dentro de los textos: el renderizador usa `textContent` por
seguridad. Si necesitas una lista, usa `bullets`.

### 11.3 Cómo funciona el consentimiento

- El banner aparece solo si no existe la clave
  `intranerd.v2:legal.cookieConsent`.
- "Aceptar todas" guarda `preferences: true`.
- "Solo esenciales" guarda `preferences: false`.
- Ambas opciones mantienen la plataforma funcionando, porque no usamos
  cookies publicitarias ni analítica.
- "Preferencias de cookies" en el footer permite revisar o retirar la decisión.
- Al retirarla, el banner vuelve a aparecer.

**Importante:** si algún día agregas un servicio externo que use cookies
(analítica, video incrustado, mapas), primero actualiza la Política de Cookies y
el panel de preferencias, y pide consentimiento antes de cargarlo.

### 11.4 Nota para el equipo

Los textos legales son un **borrador de proyecto escolar**. No son asesoría
legal. Antes de publicar IntraNerd fuera del colegio, la dirección debe
revisarlos con un profesional. Esta advertencia también aparece al final de cada
documento para que nadie la pase por alto.

### 11.5 Centro de accesibilidad

El botón de accesibilidad de la barra superior (y el enlace **Accesibilidad**
del footer) abre un panel con tres preferencias:

| Preferencia      | Valores                    | Qué hace                                                               |
| ---------------- | -------------------------- | ---------------------------------------------------------------------- |
| Tamaño del texto | Normal, Grande, Muy grande | Cambia la raíz a 100 %, 112,5 % o 125 % y todo lo que usa `rem` escala |
| Contraste        | Estándar, Alto             | Oscurece textos y bordes, y deja los fondos en blanco                  |
| Movimiento       | Según el sistema, Reducido | Desactiva animaciones y desplazamientos suaves                         |

Las preferencias se aplican como atributos en `<html>`:

```html
<html lang="es" data-text-size="large" data-contrast="high" data-motion="reduced"></html>
```

- **Persistencia:** `intranerd.v2:ui.preferences`, con la misma capa de
  `storage` que el resto de la app.
- **Lógica:** `src/services/preferences.js`. `initPreferences()` se llama en
  `main.js` antes de construir el layout.
- **Panel:** `src/components/accessibility.js`.
- **Estilos:** `src/styles/components/accessibility.css`.

La app sigue respetando `prefers-reduced-motion` y `prefers-contrast` del
sistema. Las preferencias de la app son un extra, no un reemplazo de la
configuración del equipo.

**Si agregas una preferencia nueva:**

1. Define sus opciones y su valor por defecto en `preferences.js`.
2. Normaliza el valor en `normalize()` para que un dato viejo no rompa la UI.
3. Agrega el grupo de radios en el panel de accesibilidad.
4. Lee el valor desde el `FormData` del formulario.
5. Escribe el CSS usando un atributo en `html`, sin modificar los datos.
6. Prueba con teclado, recarga y zoom al 200 %.

**Reglas del equipo:**

- Nunca muevas el foco automáticamente al abrir el panel; la persona decide.
- No uses solo color para comunicar un estado: agrega texto o un icono.
- Mantén los controles por encima de 24 × 24 px (idealmente 44 × 44 px en móvil).
- Si agregas una animación, comprueba que se detiene con movimiento reducido.
- Toda barrera nueva se puede reportar desde Contacto → Accesibilidad.

---

## 12. Flujo de trabajo del equipo

### 12.1 Levantar el proyecto por primera vez

```bash
pnpm install          # instala dependencias de todo el workspace
pnpm dev              # SPA en http://localhost:5173
```

La SPA funciona sin backend. Si quieres probar la API:

```bash
pnpm dev:api          # API en http://localhost:4000
```

Abre dos terminales: una para la SPA y otra para la API.

### 12.2 Comandos que vas a usar

| Comando          | Qué hace                             |
| ---------------- | ------------------------------------ |
| `pnpm dev`       | SPA en desarrollo con recarga        |
| `pnpm dev:api`   | API en desarrollo                    |
| `pnpm lint`      | Revisa formato y reglas del proyecto |
| `pnpm format`    | Ordena el formato automáticamente    |
| `pnpm test`      | Pruebas unitarias y de integración   |
| `pnpm test:e2e`  | Pruebas de navegador                 |
| `pnpm build`     | Genera la carpeta `dist/`            |
| `pnpm docker:up` | Levanta todo con Docker              |

### 12.3 Antes de subir un cambio

Ejecuta:

```bash
pnpm format
pnpm lint
pnpm test:unit
```

Si algo falla, arréglalo antes del pull request. No comentes pruebas ni agregues
excepciones al lint para "hacerlo pasar".

Si tocaste estilos o navegación, agrega además:

```bash
pnpm test:e2e
```

### 12.4 Git para principiantes

```bash
git checkout -b feat/biblioteca      # crea tu rama
git status                           # revisa qué cambió
git add src/views/library.js         # prepara archivos
git commit -m "feat: agrega módulo de biblioteca"
git push -u origin feat/biblioteca   # sube tu rama
```

Después abre un **pull request** en GitHub y pide revisión a otra persona del
equipo. Un buen pull request incluye:

- Qué cambió y por qué.
- Cómo probarlo.
- Capturas si es visual.
- Qué archivos conviene revisar primero.

### 12.5 Checklist antes del pull request

- [ ] La app abre sin errores en la consola.
- [ ] Probé en escritorio y en celular.
- [ ] Probé con teclado, zoom al 200 % y texto grande.
- [ ] La interfaz mantiene alto contraste y movimiento reducido.
- [ ] `pnpm lint` pasa.
- [ ] Las pruebas relacionadas pasan.
- [ ] No subí contraseñas, archivos `.env` ni datos personales reales.
- [ ] Actualicé la documentación si agregué un módulo o cambié un flujo.
- [ ] Pedí revisión a alguien del equipo.

---

## 13. Problemas frecuentes

| Síntoma                        | Causa probable                         | Solución                                               |
| ------------------------------ | -------------------------------------- | ------------------------------------------------------ |
| La página queda en blanco      | Error de JavaScript al arrancar        | Abre F12 → Console y lee el primer error               |
| `Failed to load module script` | Ruta de import mal escrita             | Revisa que termine en `.js` y que la ruta sea correcta |
| La imagen no aparece           | Ruta incorrecta o archivo faltante     | Revisa `src` y la pestaña Network                      |
| El icono no se ve              | Nombre mal escrito en `icon()`         | Verifica que exista en `PATHS`                         |
| La fuente no cambia            | Falta el `@font-face` o el import      | Revisa `fonts.css` y `main.css`                        |
| Los estilos no se aplican      | El CSS no está importado en `main.css` | Agrega el `@import` en el orden correcto               |
| `QuotaExceededError`           | localStorage lleno                     | Elimina fotos o registros antiguos                     |
| La ruta muestra 404            | El `id` no está en `VIEWS`             | Agrega la vista al router                              |
| El cambio no aparece           | Caché del navegador                    | Recarga con Ctrl + Shift + R                           |
| `pnpm: command not found`      | pnpm no está instalado                 | `npm install -g pnpm` o revisa la guía oficial         |
| El lint falla por comillas     | Prettier no se ejecutó                 | `pnpm format` y vuelve a intentar                      |
| El modal queda abierto         | Falta llamar a `modal.close()`         | Revisa el flujo del botón                              |

Si nada funciona, no borres archivos al azar. Copia el error completo y
pregunta al equipo. Un buen reporte incluye: qué hiciste, qué esperabas, qué
pasó y el texto del error.

---

## 14. Glosario

| Término          | Definición                                                                              |
| ---------------- | --------------------------------------------------------------------------------------- |
| **API**          | Interfaz para que dos programas se comuniquen. Nuestra API REST recibe y entrega datos. |
| **Atributo**     | Información extra dentro de una etiqueta HTML (`href`, `class`, `id`).                  |
| **BEM**          | Convención para nombrar clases: bloque, `bloque__elemento`, `bloque--modificador`.      |
| **Base64**       | Forma de convertir una imagen en texto para guardarla en localStorage.                  |
| **Commit**       | Registro de un cambio en Git.                                                           |
| **CSS**          | Lenguaje que define la presentación visual.                                             |
| **DOM**          | Representación del HTML como árbol de objetos que JavaScript puede modificar.           |
| **ES Modules**   | Sistema nativo de `import` y `export` de JavaScript.                                    |
| **Hash**         | Parte de la URL después de `#`. Lo usa nuestro router.                                  |
| **HTML**         | Lenguaje de estructura y contenido de la web.                                           |
| **JavaScript**   | Lenguaje que da comportamiento e interactividad.                                        |
| **JSON**         | Formato de texto para guardar datos estructurados.                                      |
| **localStorage** | Almacenamiento del navegador que persiste entre visitas.                                |
| **Modal**        | Ventana emergente que bloquea el fondo y atrapa el foco.                                |
| **Pull request** | Propuesta de cambio que el equipo revisa antes de integrarla.                           |
| **Responsive**   | Diseño que se adapta a distintos tamaños de pantalla.                                   |
| **SPA**          | Aplicación de una sola página que cambia de vistas sin recargar.                        |
| **SVG**          | Formato de imagen vectorial; se puede colorear con CSS.                                 |
| **Token**        | Variable CSS que guarda un valor de diseño (color, espacio, radio).                     |
| **Vista**        | Módulo de la SPA que se monta en el contenedor principal.                               |
| **WCAG**         | Pautas internacionales de accesibilidad web.                                            |

---

## 15. Retos para practicar

Hazlos en orden. Cada uno suma una habilidad distinta.

### Reto 1 · Tu tarjeta personal (HTML + CSS)

Crea una página con tu nombre, rol en el equipo, una lista de tres habilidades
y un botón. Dale estilos con Flexbox, un borde redondeado y una sombra suave.
No uses los estilos de IntraNerd: escribe los tuyos.

### Reto 2 · Cambia la tipografía de los títulos (Tipografía)

Agrega una fuente nueva al proyecto, declara su token y úsala solo en los
títulos de las vistas. Verifica en DevTools que se sirve desde `assets/fonts/`.

### Reto 3 · Un icono nuevo (SVG)

Agrega el icono `camera` a `icon.js` y úsalo en el botón "Agregar foto" del
módulo de objetos perdidos. Cuida el `aria-label` y el tamaño.

### Reto 4 · Contador de caracteres (JavaScript)

En un formulario de práctica, muestra en tiempo real cuántos caracteres lleva
un `<textarea>`. Si supera el máximo, cambia el color del contador a rojo y
desactiva el botón de envío.

### Reto 5 · Módulo "Biblioteca" (SPA + localStorage)

Crea el módulo completo con:

- Entrada en `NAV_ITEMS`, vista y ruta.
- Formulario para agregar un libro (título, autor, categoría).
- Lista de libros con opción de eliminar.
- Persistencia con `storage`.
- Estado vacío cuando no hay libros.
- Prueba manual: recarga la página y verifica que los libros siguen ahí.

### Reto 6 · Mejora el footer (Diseño + accesibilidad)

Agrega al footer un enlace a las preguntas frecuentes del módulo de contacto.
Comprueba que se puede llegar con Tab, que el foco se ve bien y que en celular
las columnas se apilan sin desbordarse.

---

## ¿Dónde pedir ayuda?

- **Canal del equipo:** pregunta a la persona encargada del proyecto en tu
  colegio.
- **Documentación técnica:** [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) y
  [`README.md`](../README.md).
- **Contrato de la API:** [`docs/openapi.yaml`](openapi.yaml).
- **Módulo de contacto:** dentro de la app, en "Contacto y soporte".

---

**Hecho por y para el equipo de la escuela.** Si encontrás un error en esta
guía, corrígelo y avisa al equipo: la documentación también se mantiene entre
todos.
