import { config } from '../config.js';

/**
 * Documentos legales de IntraNerd.
 *
 * Este archivo es la única fuente de verdad de los textos legales: el footer,
 * el banner de cookies y los modales leen desde aquí. Para actualizar una
 * política, edita el documento y sube `LEGAL_VERSION` y `LEGAL_UPDATED`.
 *
 * Nota para el equipo: estos textos son un borrador de proyecto escolar. Antes
 * de publicar IntraNerd fuera del establecimiento, la dirección debe revisarlos
 * con asesoría legal.
 */

export const LEGAL_VERSION = '1.0';
export const LEGAL_UPDATED = '10 de noviembre de 2026';
export const LEGAL_UPDATED_ISO = '2026-11-10';

export const COOKIE_CONSENT_KEY = 'legal.cookieConsent';
export const COOKIE_CONSENT_VERSION = 1;

export const LEGAL_DOCUMENTS = {
  terms: {
    id: 'terms',
    eyebrow: 'Marco de uso',
    title: 'Términos y condiciones',
    description:
      'Las reglas básicas para convivir y usar bien la plataforma escolar de nuestro colegio.',
    intro:
      'Estos términos regulan el uso de IntraNerd, la plataforma interna de gestión escolar ' +
      'creada por el equipo de la escuela para alumnado, profesorado, apoderados y ' +
      'administración. Al entrar y usar la plataforma aceptas estas condiciones.',
    sections: [
      {
        heading: '1. Quiénes somos y qué es IntraNerd',
        paragraphs: [
          'IntraNerd es un proyecto tecnológico del equipo de la escuela, desarrollado con ' +
            'fines educativos para centralizar la información de la comunidad escolar. No es ' +
            'un servicio comercial ni una red social pública.',
        ],
      },
      {
        heading: '2. Aceptación de las condiciones',
        paragraphs: [
          'El uso de la plataforma implica que leíste y aceptaste estos términos y la ' +
            'Política de Privacidad. Si no estás de acuerdo, no publiques información ni ' +
            'utilices los módulos de registro.',
        ],
      },
      {
        heading: '3. Para qué puedes usar la plataforma',
        bullets: [
          'Consultar y registrar calificaciones, tareas y evaluaciones del año escolar.',
          'Inscribirte en talleres y revisar sus horarios, lugares y cupos.',
          'Reportar personas extraviadas, objetos perdidos y necesidades de seguridad.',
          'Opinar sobre asignaturas y docentes de forma respetuosa y fundamentada.',
          'Leer comunicados oficiales y contactar al equipo de soporte.',
        ],
      },
      {
        heading: '4. Uso aceptable',
        paragraphs: ['Al usar IntraNerd te comprometes a no realizar las siguientes conductas:'],
        bullets: [
          'Suplantar la identidad de otra persona o atribuirte publicaciones ajenas.',
          'Publicar insultos, amenazas, discriminación, acoso o contenido sexual.',
          'Usar el módulo de personas extraviadas para bromas, pruebas o falsas alarmas.',
          'Subir fotos o datos personales de terceros sin su autorización.',
          'Intentar acceder a información que no te corresponde o alterar el funcionamiento.',
          'Compartir capturas de datos privados de otros miembros de la comunidad.',
        ],
      },
      {
        heading: '5. Perfil local y ausencia de cuentas',
        paragraphs: [
          'En esta versión IntraNerd no tiene inicio de sesión: el perfil que eliges ' +
            '(nombre y rol) se guarda únicamente en tu navegador. Por eso, cualquier ' +
            'persona con acceso a tu equipo puede ver la información que registres. En ' +
            'equipos compartidos, borra los datos del sitio al terminar o usa una ventana ' +
            'privada.',
        ],
      },
      {
        heading: '6. Contenido publicado por la comunidad',
        paragraphs: [
          'Cada persona es responsable de lo que publica. La dirección y el equipo ' +
            'administrador pueden editar, ocultar o eliminar contenidos que incumplan estos ' +
            'términos o pongan en riesgo a la comunidad. Las opiniones y comunicados no ' +
            'representan necesariamente la posición oficial del establecimiento.',
        ],
      },
      {
        heading: '7. Emergencias y personas extraviadas',
        paragraphs: [
          'El módulo de personas extraviadas es una herramienta de apoyo interna. No ' +
            'reemplaza a los servicios de emergencia. Ante un extravío real, avisa de ' +
            'inmediato a inspectoría o dirección y llama a los números de emergencia de Chile ' +
            '(133 Carabineros, 132 Bomberos, 131 SAMU).',
        ],
      },
      {
        heading: '8. Propiedad intelectual',
        paragraphs: [
          'La marca, los textos y el código de IntraNerd pertenecen a sus autores y al ' +
            'equipo del proyecto. El código se distribuye bajo licencia MIT y la tipografía ' +
            'Inter bajo licencia OFL; conserva siempre sus archivos de licencia.',
        ],
      },
      {
        heading: '9. Disponibilidad y datos',
        paragraphs: [
          'La plataforma puede suspenderse por mantenimiento, fallas técnicas o decisiones ' +
            'del colegio. Como los datos se guardan en el navegador, borrar los datos del ' +
            'sitio, cambiar de equipo o usar el modo privado puede eliminarlos. Si necesitas ' +
            'conservar tu información, anótala antes de borrar los datos del navegador.',
        ],
      },
      {
        heading: '10. Privacidad y cookies',
        paragraphs: [
          'El tratamiento de datos se explica en la Política de Privacidad. El uso de ' +
            'almacenamiento local y las opciones de consentimiento se detallan en la ' +
            'Política de Cookies.',
        ],
      },
      {
        heading: '11. Cambios en los términos',
        paragraphs: [
          'Podemos actualizar estos términos cuando cambien los módulos o las normas del ' +
            'colegio. La versión vigente y su fecha aparecen siempre al inicio del documento. ' +
            'El uso de la plataforma después de una actualización implica su aceptación.',
        ],
      },
      {
        heading: '12. Contacto',
        paragraphs: [
          `Para consultas sobre estos términos escribe a ${config.contact.email} o usa el ` +
            'módulo de Contacto y soporte. Horario de atención: ' +
            `${config.contact.hours}.`,
        ],
      },
      {
        heading: '13. Legislación aplicable',
        paragraphs: [
          'Estos términos se interpretan conforme a las normas de la República de Chile, ' +
            'en especial la Ley 19.628 sobre protección de la vida privada y la Ley 21.719 ' +
            'sobre protección de datos personales, en lo que resulten aplicables al proyecto.',
        ],
      },
    ],
    footerNote:
      'Documento de ejemplo redactado por el equipo de la escuela. No constituye asesoría ' +
      'legal: antes de publicar la plataforma fuera del establecimiento, solicita revisión a ' +
      'la dirección y a un profesional del área.',
  },

  privacy: {
    id: 'privacy',
    eyebrow: 'Tus datos',
    title: 'Política de privacidad',
    description: 'Qué información guarda IntraNerd, dónde vive y cómo puedes controlarla.',
    intro:
      'Esta política explica cómo el equipo de la escuela trata la información que ' +
      'registras en IntraNerd. La idea es simple: guardar solo lo necesario para que la ' +
      'plataforma funcione y no compartirla con terceros.',
    sections: [
      {
        heading: '1. Responsable del tratamiento',
        paragraphs: [
          `El responsable es el equipo IntraNerd del ${config.app.school}. Puedes escribir ` +
            `a ${config.contact.email} para cualquier consulta sobre tus datos.`,
        ],
      },
      {
        heading: '2. Qué datos se tratan',
        bullets: [
          'Perfil local: nombre visible y rol que eliges (alumno, profesor, apoderado, etc.).',
          'Notas: asignaturas, calificaciones semestrales y promedios calculados.',
          'Seguridad: reportes de personas extraviadas, incluida la foto si la adjuntas.',
          'Profesores: valoraciones con estrellas, opiniones y evidencias adjuntas.',
          'Objetos perdidos: descripciones, ubicación, datos de contacto y miniaturas.',
          'Calendario y tareas: pruebas, evaluaciones y marcas de tareas completadas.',
          'Comunicados: publicaciones y autoría visible dentro de la comunidad.',
          'Contacto: nombre, correo, rol, motivo y mensaje que envías a soporte.',
        ],
      },
      {
        heading: '3. Dónde se guardan',
        paragraphs: [
          'Por defecto, los datos se guardan en el almacenamiento local del navegador ' +
            '(localStorage) del equipo que usas. Si el colegio configura la API, algunos ' +
            'registros también pueden guardarse en la base de datos interna del ' +
            'establecimiento.',
          'IntraNerd no envía tu información a servidores publicitarios ni a servicios de ' +
            'análisis de terceros.',
        ],
      },
      {
        heading: '4. Para qué se usan',
        bullets: [
          'Mostrar y recordar la información que tú mismo registraste.',
          'Calcular promedios, cupos, valoraciones y checklists.',
          'Permitir que la comunidad consulte comunicados y eventos oficiales.',
          'Responder consultas enviadas al equipo de soporte.',
          'Cumplir solicitudes de la dirección relacionadas con la convivencia escolar.',
        ],
      },
      {
        heading: '5. Datos sensibles y de menores',
        paragraphs: [
          'No publiques diagnósticos médicos, datos de salud, situación familiar ni otros ' +
            'datos sensibles en los campos abiertos de la plataforma. Si necesitas comunicar ' +
            'algo así, hazlo por los canales reservados del colegio.',
          'Las fotografías de menores de edad solo deben subirse con autorización de su ' +
            'apoderado y para el fin específico del reporte. Elimínalas cuando ya no sean ' +
            'necesarias.',
        ],
      },
      {
        heading: '6. Conservación',
        paragraphs: [
          'Los datos permanecen en tu navegador hasta que los elimines desde la plataforma o ' +
            'borres los datos del sitio. Si se usó la API, la base del colegio conserva los ' +
            'registros según sus plazos administrativos. Puedes revisar qué hay guardado en ' +
            'las herramientas del navegador (DevTools → Application → Local Storage).',
        ],
      },
      {
        heading: '7. Tus derechos',
        paragraphs: [
          'Puedes acceder, corregir y eliminar la información que registraste usando los ' +
            'mismos módulos de IntraNerd. Para solicitudes sobre datos alojados en la API o ' +
            'para ejercer derechos de acceso, rectificación, cancelación u oposición, ' +
            `escribe a ${config.contact.email}.`,
        ],
      },
      {
        heading: '8. Con quién se comparte',
        paragraphs: [
          'No vendemos ni cedemos datos a terceros. La información solo es visible para ' +
            'quienes usan el mismo navegador y, si existe API, para el personal autorizado ' +
            'del colegio. Las autoridades públicas pueden solicitarla cuando la ley lo exija.',
        ],
      },
      {
        heading: '9. Seguridad',
        paragraphs: [
          'La plataforma evita registrar contraseñas, usa conexiones cifradas cuando se ' +
            'publica con HTTPS y valida los datos en el servidor. Ningún sistema es ' +
            'infalible: usa equipos personales o de confianza y no dejes tu sesión abierta ' +
            'en computadores compartidos.',
        ],
      },
      {
        heading: '10. Cambios en esta política',
        paragraphs: [
          'Si cambiamos la forma de tratar los datos, actualizaremos este documento y su ' +
            'fecha. Los cambios importantes se comunicarán en el tablón de anuncios.',
        ],
      },
    ],
    footerNote:
      'Documento de ejemplo del proyecto escolar. Para el tratamiento de datos de menores, ' +
      'la dirección del colegio debe validar este texto con asesoría legal.',
  },

  cookies: {
    id: 'cookies',
    eyebrow: 'Almacenamiento local',
    title: 'Política de cookies',
    description: 'IntraNerd no usa cookies publicitarias. Te contamos qué guarda y cómo borrarlo.',
    intro:
      'Las cookies son pequeños archivos que un sitio guarda en tu navegador. IntraNerd ' +
      'casi no las necesita: funciona con almacenamiento local (localStorage), que cumple ' +
      'una función parecida pero no se envía al servidor en cada visita.',
    sections: [
      {
        heading: '1. Qué utiliza IntraNerd',
        bullets: [
          'Cookies publicitarias: no se utilizan.',
          'Cookies de analítica o rastreo: no se utilizan.',
          'Cookies de redes sociales: no se utilizan.',
          'Almacenamiento local esencial: guarda tus módulos, tu perfil y tu decisión de ' +
            'privacidad en este navegador.',
        ],
      },
      {
        heading: '2. Detalle del almacenamiento local',
        paragraphs: [
          'Todo lo que ves en esta tabla se guarda únicamente en tu equipo y bajo el prefijo ' +
            'intranerd.v2. No hay servidores de terceros ni píxeles de seguimiento.',
        ],
        bullets: [
          'intranerd.v2:session.profile — Nombre visible y rol elegido. Duración: hasta que ' +
            'borres los datos del sitio.',
          'intranerd.v2:grades.subjects — Asignaturas, notas y promedios. Duración: hasta que ' +
            'los elimines.',
          'intranerd.v2:safety.missing — Reportes de personas extraviadas y fotos. Duración: ' +
            'hasta que los elimines.',
          'intranerd.v2:legal.cookieConsent — Tu decisión sobre el almacenamiento y su fecha. ' +
            'Duración: hasta que la retires.',
          'intranerd.v2:* — Resto de módulos (talleres, objetos, calendario, comunicados, ' +
            'tareas y contacto). Duración: hasta que los elimines.',
        ],
      },
      {
        heading: '3. Para qué sirve el consentimiento',
        paragraphs: [
          'Al abrir IntraNerd te mostramos un aviso para que decidas si aceptas el ' +
            'almacenamiento local. Puedes elegir "Solo esenciales" o "Aceptar todas". La ' +
            'plataforma funciona igual en ambos casos porque no usamos rastreo; la elección ' +
            'queda registrada con su fecha y puedes cambiarla cuando quieras.',
        ],
      },
      {
        heading: '4. Cómo cambiar o retirar tu decisión',
        paragraphs: [
          'Usa el enlace "Preferencias de cookies" del pie de página. También puedes borrar ' +
            'los datos del sitio desde la configuración del navegador: en Chrome, Configuración ' +
            '→ Privacidad y seguridad → Configuración de sitios → Ver datos de sitios. Al ' +
            'borrarlos, el aviso volverá a aparecer.',
        ],
      },
      {
        heading: '5. Cookies de terceros en enlaces externos',
        paragraphs: [
          'Si abres un enlace externo, como la especificación de la API o un documento del ' +
            'equipo, ese sitio puede tener sus propias cookies. IntraNerd no controla esas ' +
            'políticas: revísalas antes de aceptar.',
        ],
      },
      {
        heading: '6. Cambios en esta política',
        paragraphs: [
          'Si en el futuro incorporamos un servicio que use cookies, lo declararemos aquí y ' +
            'pediremos consentimiento antes de activarlo. La fecha de actualización aparece ' +
            'al inicio del documento.',
        ],
      },
    ],
    footerNote:
      'Documento de ejemplo del equipo IntraNerd. La configuración real de cookies debe ' +
      'revisarse cada vez que se agregue un servicio externo a la plataforma.',
  },

  accessibility: {
    id: 'accessibility',
    eyebrow: 'Compromiso',
    title: 'Declaración de accesibilidad',
    description:
      'Qué hacemos para que IntraNerd funcione para toda la comunidad, también con tecnologías de apoyo.',
    intro:
      'La accesibilidad es parte del proyecto, no un agregado. Esta declaración resume ' +
      'las medidas que aplicamos, el nivel que perseguimos y las limitaciones que todavía ' +
      'estamos trabajando.',
    sections: [
      {
        heading: '1. Nuestro compromiso',
        paragraphs: [
          'IntraNerd busca que alumnado, profesorado, apoderados y dirección puedan usar la ' +
            'plataforma con teclado, lector de pantalla, zoom, contraste alto o movimiento ' +
            'reducido. La accesibilidad se revisa en cada módulo nuevo y en cada cambio de ' +
            'interfaz.',
        ],
      },
      {
        heading: '2. Medidas implementadas',
        bullets: [
          'Enlace "Saltar al contenido principal" y regiones semánticas (header, nav, main, footer).',
          'Navegación completa por teclado, foco visible y retorno del foco al cerrar modales.',
          'Modales con trampa de foco, cierre con Escape y fondo inerte para lectores de pantalla.',
          'Estrellas de calificación como radiogroup con flechas, Home y End.',
          'Avisos y resultados anunciados con regiones aria-live; errores de formulario asociados al campo.',
          'Iconos SVG decorativos con aria-hidden y nombres accesibles en botones y enlaces.',
          'Objetivos táctiles de al menos 24 px en los controles principales.',
          'Soporte para prefers-reduced-motion, prefers-contrast y modo de colores forzados.',
          'Centro de accesibilidad para ampliar el texto, activar alto contraste y reducir el movimiento.',
        ],
      },
      {
        heading: '3. Preferencias disponibles',
        paragraphs: [
          'Puedes abrir el centro de accesibilidad desde el botón de la barra superior o desde ' +
            'el enlace "Accesibilidad" del pie de página. Las preferencias se guardan solo en ' +
            'este navegador y no modifican los datos de la plataforma.',
        ],
      },
      {
        heading: '4. Nivel de conformidad',
        paragraphs: [
          'Nuestro objetivo es cumplir las Pautas de Accesibilidad para el Contenido Web ' +
            '(WCAG) 2.2 en nivel AA. Es un objetivo de trabajo y no una certificación externa: ' +
            'la plataforma evoluciona y pueden aparecer barreras nuevas.',
        ],
      },
      {
        heading: '5. Limitaciones conocidas',
        bullets: [
          'Las imágenes que sube la comunidad pueden no tener una descripción adecuada; ' +
            'quien publica debe escribirla.',
          'Los documentos del equipo se sirven como Markdown y el navegador los muestra ' +
            'como texto plano.',
          'Con zoom alto en pantallas pequeñas, el calendario y algunas tablas pueden ' +
            'requerir desplazamiento horizontal.',
          'La plataforma no ofrece todavía traducción a lengua de señas ni lectura en voz alta integrada.',
        ],
      },
      {
        heading: '6. Evaluación y mejora',
        paragraphs: [
          'Revisamos la interfaz con navegación por teclado, zoom y lectores de pantalla, y ' +
            'mantenemos pruebas automatizadas de navegación y responsive. Si encuentras una ' +
            'barrera, queremos saberlo: tu reporte entra al mismo flujo de mejoras del equipo.',
        ],
      },
      {
        heading: '7. Contacto y comentarios',
        paragraphs: [
          `Escríbenos a ${config.contact.email} o usa el módulo de Contacto y soporte con el ` +
            'motivo "Accesibilidad". Incluye la página, el paso y la tecnología de apoyo que ' +
            'estabas usando. Horario de atención: ' +
            `${config.contact.hours}.`,
        ],
      },
    ],
    footerNote:
      'Declaración viva del equipo IntraNerd. Revísala cada vez que cambie la interfaz o se ' +
      'incorpore un componente nuevo.',
  },
};

export const LEGAL_DOCUMENT_LIST = Object.values(LEGAL_DOCUMENTS);
