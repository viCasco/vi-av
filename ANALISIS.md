# agenciavisual.es: análisis y rediseño

Análisis realizado el 20/11/2026 sobre la web publicada.

## Virtudes que se mantienen

| Virtud | Cómo se aprovecha |
|---|---|
| **Voz propia y con humor**: "Equipo no… equipazo", los tres cerditos aplicados al branding, "¿Eres invisible?" | Se usa como eje tipográfico: cada frase potente se convierte en un titular gigante |
| **Aforismos por servicio** ("Mostrad vuestra diferencia, pero no olvidéis compartirla") | Se muestran en serif cursiva lima dentro de cada servicio desplegable |
| **Identidad lima (#d4ff40)** de la campaña "Las marcas valientes" | Es el único color de acento sobre papel y tinta |
| **Material visual de calidad** (Marsil, Montiber, Mecanorba, ojo, texturas líquidas) | Las imágenes aparecen en blanco y negro y recuperan el color al pasar el cursor, como "hacer visible" |
| **Equipo con caras reales** | Retratos editoriales con enlace a LinkedIn y una casilla "¿Tú?" que lleva a Únete |
| **Citas de diseño** (Saul Bass, J. C. Fernández) | Pasan a ser pausas tipográficas a página completa |
| **Reel en vídeo y "Trabajando en…"** | El reel ocupa una sección a sangre y "Trabajando en…" es una marquesina que muestra el trabajo de ahora |

## Carencias detectadas y corrección

| Carencia en la web actual | Corrección |
|---|---|
| **El logo de la cabecera da 404** (`logoAV-blanco-pequeño.png`) | Logotipo tipográfico en HTML/CSS (un "AV" con una pupila que se mueve), así que no puede romperse |
| **Texto *lorem ipsum* publicado** ("Our Founder · Michael Bauer") en La Agencia y en Únete | Se elimina |
| **El LinkedIn de Marta Alcántara apunta a otra persona** (carlos-aguilar-pache) | Se quita el enlace hasta tener el correcto |
| **Llámanos, Escríbenos y Ven a vernos no tienen enlace** | `tel:`, ancla al formulario y Google Maps |
| **No aparece ningún email de contacto** | Pendiente: hace falta la dirección real (ver abajo) |
| **Datos contradictorios**: "más de 20 años" y "más de 18 años" en la misma página | Un único relato: 2002 empieza el equipo, 2008 nace AV, "+20 años" |
| **Secciones duplicadas**: "Cómo lo hacemos" y "Áreas de trabajo" repiten textos | Se unen en un solo bloque de 6 servicios |
| **Proyectos "Próximamente" desde 2020** y la promesa de "disfruta de la nueva web" de Iberitos, sin enlace | Se separan en "En el horno" sin falsas promesas, y solo los casos reales se pueden abrir |
| **Rejilla de proyectos rota**: "Marsil" repetido 4 veces y filtros sin contenido | Proyectos definidos en datos, filtros con recuento real y ocultación automática de los vacíos |
| **Interfaz en inglés**: "Read More", "Under:", "0 comments", "Home / Here" | Todo en español, con fecha y categoría |
| **Emojis rotos (`??`)** y erratas ("día a a día", "comunicacióny", "Todos quieres", ",,,,") | Textos revisados |
| **Vídeo .mov de 30 MB** con autoplay y vídeos con `preload="auto"` | Todos los vídeos se cargan solo al entrar en pantalla (`preload="none"`) y se pausan al salir |
| **YouTube incrustado al cargar** (cookies y peso) | Fachada ligera: el iframe (`youtube-nocookie`) solo se carga al pulsar Play |
| **Banner de cookies intrusivo** | No se cargan terceros sin acción del usuario, así que no hace falta banner (sí la política) |
| **WordPress con más de 280 KB de HTML** y decenas de plugins | HTML estático (unos 8–18 KB por página), 1 CSS, 1 JS, sin dependencias |
| **Accesibilidad**: sin H1 coherente, sin foco visible, sin `alt` | H1 único por página, foco lima, enlace "saltar al contenido", `prefers-reduced-motion`, acordeón nativo `<details>` |
| **Formulario de CV sin validación** | Validación de tamaño máximo de 4 MB y del formato, más un campo trampa antispam |

## Estructura

Se mantienen 6 secciones, pero el Blog pasa a ser **Actualidad**:
Home · Proyectos · La Agencia · Únete a AV · Actualidad · Contacto.

El blog era la parte débil: solo tiene 3 entradas y la última es de 2022. **Actualidad** une en una sola lista cronológica las entradas del blog y las publicaciones de Instagram, LinkedIn, Facebook y X, con filtros por origen. Así la sección refleja la actividad real del estudio aunque no se escriban artículos.

Se alimenta con `tools/actualidad/` (ver su README):

- El blog ya está conectado mediante la API pública de WordPress.
- Las redes tienen el conector preparado y solo necesitan sus claves de API.

`blog.html` redirige a `actualidad.html` para no romper los enlaces antiguos.

## Concepto de diseño

**"Hacemos visible lo esencial."** El nombre de la agencia es la idea: la página empieza casi vacía y lo que importa aparece al interactuar.

- Papel y tinta con un único acento lima. Grano analógico como guiño a "del germen de lo analógico".
- Tipografía protagonista: Archivo comprimida en mayúsculas contra Instrument Serif cursiva.
- El ojo de la web original sustituye a la "A" de "esencial" y parpadea.
- El cursor es una lente, y el índice de proyectos muestra la imagen flotando bajo el cursor.
- El manifiesto se "enciende" palabra a palabra al hacer scroll.
- "¿Eres invisible?" está en contorno y se rellena de lima al pasar el cursor.

## Pendiente de datos reales

1. **Email de contacto** (ninguno es público en la web actual).
2. **Endpoint de los formularios**: rellenar `data-endpoint=""` en `contacto.html` y `unete.html` (Formspree, Getform, una función propia…). Mientras no esté, el formulario muestra el teléfono.
3. **LinkedIn de Marta Alcántara.**
4. Confirmar si las 2 vacantes de Únete siguen abiertas.
5. Las páginas legales enlazan a las de la web actual.

## Archivos

```
index.html  proyectos.html  agencia.html  unete.html  actualidad.html  contacto.html
blog.html                    redirección a actualidad.html
assets/css/style.css
assets/js/main.js            interacción compartida
assets/js/projects.js        datos de proyectos (añadir un caso = añadir un objeto)
data/actualidad.js           datos de Actualidad (generado; no editar a mano)
data/actualidad.manual.json  publicaciones manuales, ajustes y ocultas
tools/actualidad/            actualizador: blog y conectores de redes (ver README)
```

Todas las imágenes y vídeos apuntan a `https://agenciavisual.es/www/wp-content/uploads/…`. Se comprobaron las 63 URLs y todas responden con 200.
