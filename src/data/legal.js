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

export const LEGAL_VERSION = '1.1';
export const LEGAL_UPDATED = '12 de noviembre de 2026';
export const LEGAL_UPDATED_ISO = '2026-11-12';

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
          'Conversar por mensajería interna con los contactos que agregues al directorio.',
          'Revisar el menú semanal y enviar comentarios o sugerencias a la cafetería.',
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
        heading: '7. Mensajería interna',
        paragraphs: [
          'El módulo de Mensajes permite crear contactos y conversaciones con integrantes de ' +
            'la comunidad. En esta versión los mensajes se guardan en el navegador y no se ' +
            'entregan a la persona destinataria; no uses este canal para comunicar una ' +
            'emergencia ni información urgente. Para casos reales, acude a inspectoría, ' +
            'dirección o a los canales oficiales del colegio.',
          'No publiques datos sensibles, contraseñas, información médica ni antecedentes de ' +
            'terceros. La mensajería debe usarse con respeto y para fines escolares.',
        ],
      },
      {
        heading: '8. Emergencias y personas extraviadas',
        paragraphs: [
          'El módulo de personas extraviadas es una herramienta de apoyo interna. No ' +
            'reemplaza a los servicios de emergencia. Ante un extravío real, avisa de ' +
            'inmediato a inspectoría o dirección y llama a los números de emergencia de Chile ' +
            '(133 Carabineros, 132 Bomberos, 131 SAMU).',
        ],
      },
      {
        heading: '9. Propiedad intelectual',
        paragraphs: [
          'La marca, los textos y el código de IntraNerd pertenecen a sus autores y al ' +
            'equipo del proyecto. El código se distribuye bajo licencia MIT y la tipografía ' +
            'Inter bajo licencia OFL; conserva siempre sus archivos de licencia.',
        ],
      },
      {
        heading: '10. Disponibilidad y datos',
        paragraphs: [
          'La plataforma puede suspenderse por mantenimiento, fallas técnicas o decisiones ' +
            'del colegio. Como los datos se guardan en el navegador, borrar los datos del ' +
            'sitio, cambiar de equipo o usar el modo privado puede eliminarlos. Si necesitas ' +
            'conservar tu información, anótala antes de borrar los datos del navegador.',
        ],
      },
      {
        heading: '11. Privacidad y cookies',
        paragraphs: [
          'El tratamiento de datos se explica en la Política de Privacidad. El uso de ' +
            'almacenamiento local y las opciones de consentimiento se detallan en la ' +
            'Política de Cookies.',
        ],
      },
      {
        heading: '12. Cambios en los términos',
        paragraphs: [
          'Podemos actualizar estos términos cuando cambien los módulos o las normas del ' +
            'colegio. La versión vigente y su fecha aparecen siempre al inicio del documento. ' +
            'El uso de la plataforma después de una actualización implica su aceptación.',
        ],
      },
      {
        heading: '13. Contacto',
        paragraphs: [
          `Para consultas sobre estos términos escribe a ${config.contact.email} o usa el ` +
            'módulo de Contacto y soporte. Horario de atención: ' +
            `${config.contact.hours}.`,
        ],
      },
      {
        heading: '14. Legislación aplicable',
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

  aviso: {
    id: 'aviso',
    eyebrow: 'Información del sitio',
    title: 'Aviso legal',
    description:
      'Quién está detrás de IntraNerd, con qué finalidad se publica y cómo se identifican sus responsables.',
    intro:
      'Este aviso identifica el proyecto y las condiciones generales de publicación de ' +
      'IntraNerd. Es un documento informativo del equipo escolar y complementa los términos, ' +
      'la privacidad y las cookies.',
    sections: [
      {
        heading: '1. Titularidad del proyecto',
        paragraphs: [
          `IntraNerd es una plataforma interna del ${config.app.school}, desarrollada por el ` +
            'equipo tecnológico del establecimiento con fines educativos y de gestión escolar. ' +
            'No es un producto comercial independiente ni una red social abierta al público.',
        ],
      },
      {
        heading: '2. Finalidad y ámbito de uso',
        paragraphs: [
          'La plataforma centraliza información académica, comunitaria y de seguridad para ' +
            'alumnado, profesorado, apoderados, inspectoría y dirección. Su uso está limitado ' +
            'a la comunidad del colegio y a las tareas propias del año escolar.',
        ],
      },
      {
        heading: '3. Responsable y contacto',
        paragraphs: [
          `El responsable editorial es el equipo IntraNerd del ${config.app.school}. ` +
            `Para consultas sobre el sitio, escribe a ${config.contact.email}. ` +
            `Horario de atención: ${config.contact.hours}.`,
        ],
      },
      {
        heading: '4. Alojamiento y funcionamiento',
        paragraphs: [
          'La versión offline-first funciona con archivos estáticos y almacenamiento local del ' +
            'navegador. Si el colegio publica la plataforma en un servidor, el establecimiento ' +
            'define el proveedor de alojamiento, el dominio y las medidas de seguridad de la ' +
            'infraestructura. Esta versión no incluye pagos, publicidad ni servicios de ' +
            'seguimiento de terceros.',
        ],
      },
      {
        heading: '5. Propiedad intelectual y licencias',
        paragraphs: [
          'La marca, los textos propios y el código de IntraNerd pertenecen a sus autores y al ' +
            'equipo del proyecto. El código se distribuye bajo licencia MIT y la tipografía ' +
            'Inter bajo licencia OFL. Las imágenes, íconos y recursos de ejemplo se usan con ' +
            'fines educativos; conserva sus archivos de licencia al reutilizarlos.',
        ],
      },
      {
        heading: '6. Enlaces a sitios externos',
        paragraphs: [
          'La plataforma puede enlazar documentación técnica, la especificación de la API u ' +
            'otros recursos. IntraNerd no controla esos sitios ni sus políticas; revise sus ' +
            'condiciones antes de usarlos.',
        ],
      },
      {
        heading: '7. Limitación de responsabilidad',
        paragraphs: [
          'La información se ofrece como apoyo a la gestión escolar y puede contener errores ' +
            'o quedar desactualizada. El colegio debe validar los datos oficiales por sus ' +
            'canales habituales. IntraNerd no reemplaza los servicios de emergencia, los ' +
            'registros académicos oficiales ni la comunicación formal de la dirección.',
        ],
      },
      {
        heading: '8. Legislación aplicable',
        paragraphs: [
          'Este aviso se interpreta conforme a las normas de la República de Chile, en ' +
            'particular la Ley 19.628 sobre protección de la vida privada y la Ley 21.719 ' +
            'sobre protección de datos personales, en lo que resulten aplicables.',
        ],
      },
      {
        heading: '9. Actualizaciones',
        paragraphs: [
          'El aviso puede actualizarse cuando cambien los responsables, los módulos o las ' +
            'condiciones de publicación. La versión y la fecha vigentes aparecen al inicio de ' +
            'este documento.',
        ],
      },
    ],
    footerNote:
      'Aviso legal de ejemplo del proyecto escolar. La dirección debe revisarlo antes de ' +
      'publicar la plataforma fuera del establecimiento.',
  },

  security: {
    id: 'security',
    eyebrow: 'Protección y confianza',
    title: 'Política de seguridad',
    description:
      'Cómo cuidamos la información, qué límites tiene esta versión y cómo reportar un problema de seguridad.',
    intro:
      'La seguridad de una plataforma escolar se construye entre el equipo, el colegio y ' +
      'quienes la usan. Esta política resume las medidas actuales, sus límites y el canal ' +
      'para reportar una vulnerabilidad de forma responsable.',
    sections: [
      {
        heading: '1. Alcance',
        paragraphs: [
          'Esta política cubre la SPA, la API REST y los datos almacenados por IntraNerd. ' +
            'No cubre los equipos personales, las redes del colegio ni los servicios de ' +
            'terceros que se enlacen desde la plataforma.',
        ],
      },
      {
        heading: '2. Medidas implementadas',
        bullets: [
          'Validación de datos en la interfaz y en el servidor; los errores de negocio no se ocultan.',
          'Consultas parametrizadas en la API para reducir el riesgo de inyección SQL.',
          'Límites de tamaño y tipo para fotos y evidencias; no se aceptan contraseñas.',
          'Degradación controlada a localStorage si la API no está disponible.',
          'Escapado de texto en la interfaz para evitar inyección de HTML en contenidos de usuario.',
          'Dependencias revisadas y pruebas automatizadas de los flujos críticos.',
          'Recomendación de HTTPS para cualquier publicación fuera de localhost.',
        ],
      },
      {
        heading: '3. Límites de esta versión',
        paragraphs: [
          'IntraNerd no incluye autenticación ni permisos por rol. El perfil es local y ' +
            'cualquier persona con acceso al navegador puede ver los datos guardados. Por eso ' +
            'no debe publicarse en Internet como si fuera un sistema con cuentas reales. La ' +
            'mensajería interna es local: no entrega mensajes a otras personas ni sincroniza ' +
            'dispositivos.',
        ],
      },
      {
        heading: '4. Datos y copias de respaldo',
        paragraphs: [
          'Los datos de la SPA viven en el navegador y pueden perderse al borrar los datos del ' +
            'sitio, cambiar de equipo o usar una ventana privada. Si se usa la API, el ' +
            'establecimiento debe definir copias de respaldo, retención y acceso restringido a ' +
            'la base de datos.',
        ],
      },
      {
        heading: '5. Reporte responsable de vulnerabilidades',
        paragraphs: [
          `Si encuentras una falla de seguridad, no publiques datos de otras personas ni ` +
            `pruebes técnicas invasivas. Escribe a ${config.contact.email} con el asunto ` +
            '“Seguridad IntraNerd”, indicando la página, los pasos para reproducir el ' +
            'problema y el impacto que observaste. El equipo confirmará la recepción y ' +
            'coordinará una revisión con la dirección del colegio.',
        ],
      },
      {
        heading: '6. Incidentes y comunicación',
        paragraphs: [
          'Si se detecta un incidente que afecte datos personales, el colegio activará su ' +
            'protocolo interno, limitará el acceso afectado y comunicará lo necesario a las ' +
            'personas involucradas y a las autoridades cuando corresponda. IntraNerd no ' +
            'sustituye ese protocolo.',
        ],
      },
      {
        heading: '7. Recomendaciones para la comunidad',
        bullets: [
          'Usa equipos personales o de confianza y cierra la sesión del navegador al terminar.',
          'No subas fotos de menores sin autorización de su apoderado.',
          'No compartas capturas con datos privados de otras personas.',
          'Reporta enlaces sospechosos, suplantaciones o mensajes ofensivos al colegio.',
          'Mantén actualizado el navegador y el sistema operativo del equipo.',
        ],
      },
      {
        heading: '8. Contacto',
        paragraphs: [
          `Canal de seguridad: ${config.contact.email}. Horario de atención: ` +
            `${config.contact.hours}. ${config.contact.responseTime}`,
        ],
      },
    ],
    footerNote:
      'Política de ejemplo del proyecto escolar. Antes de exponer la plataforma a Internet, ' +
      'la dirección debe revisar la autenticación, el alojamiento y el protocolo de incidentes.',
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
          'Mensajes internos: contactos que agregas, notas de contacto y conversaciones.',
          'Menú: comentarios y sugerencias asociados a una semana y un día.',
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
          'intranerd.v2:chat.contacts y chat.threads — Contactos, notas y mensajes del chat. ' +
            'Duración: hasta que los elimines o borres los datos del sitio.',
          'intranerd.v2:menu.comments — Comentarios y sugerencias del menú semanal. ' +
            'Duración: hasta que los elimines o borres los datos del sitio.',
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
