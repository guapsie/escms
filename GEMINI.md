# 📜 BIBLIA DEL PROYECTO: ESCMS (ECMAScript CMS)

---

## 🎯 1. VISIÓN GENERAL Y OBJETIVOS
* **Nombre:** ESCMS (ECMAScript CMS / El CMS ESpañol / ES CMS -en español-).
* **Concepto:** Un CMS ultraligero, *zero-bloat*, construido íntegramente con Vanilla JS y PHP a pelo. Sin frameworks, sin dependencias. 
* **Interfaz:** Paradigma IDE visual (estilo Framer/VS Code). No es un simple editor, es una herramienta profesional de diseño y maquetación web.

---

## 🏗️ 2. ARQUITECTURA DE DIRECTORIOS Y ACTUALIZACIONES
Separación sagrada para que las actualizaciones del sistema no rompan la web del usuario. Todo pasa por el `index.php` que actúa de Poli de Tráfico (enrutador).

* 📁 `/core/` -> **EL MOTOR.** Aquí vive el backoffice (UI), el API REST en PHP y los diccionarios base. Se sobrescribe por completo en cada actualización. 
* 📁 `/data/` -> **LA ZONA SAGRADA.** Aquí está la base de datos `escms.db` (SQLite), las imágenes, las templates, los plugins (átomos) y los idiomas bajados por el usuario. Intocable por las updates.

---

## 🛠️ 3. TECH STACK Y FILOSOFÍA TÉCNICA
* **Frontend:** Vanilla JS (ES6+), HTML5, CSS Nativo. 
* **Backend:** PHP puro (para el API REST) y SQLite.
* **Seguridad:** Login exclusivo mediante **Passkeys**. Cero contraseñas.
* **Cero Dependencias:** Prohibido usar `npm`, Tailwind, React o cualquier mierda externa.

---

## 🎨 4. DISEÑO UI/UX (Look & Feel "Dark Premium")
* **Paradigma de Pantalla:**
  * **Top Bar:** Controles globales (SEO, Idioma, Modo Fullscreen F11) y un **Toggle directo Draft/Published** que cambia de estado con un clic.
  * **Panel Izquierdo:** Árbol de capas y Copiloto IA (el usuario mete su propia API Key). Adiós Spotlight.
  * **Centro (Lienzo):** Documento envuelto en **Shadow DOM** (para aislar CSS) y escalado con `transform: scale`. Edición directa con `contenteditable` y auto-zoom al hacer clic. Cero iframes.
  * **Panel Derecho (Inspector):** Única fuente de verdad para los estilos y propiedades.

* **Paleta de Colores (Variables CSS Strict):**
  * `Background`: `#0a0a0a`
  * `Text`: `#f5f5f5` (Solid: 1, Fade: 0.6, Faint: 0.3)
  * `Accent`: `#3b82f6` (Solid: 1, Fade: 0.6, Faint: 0.3)
  
* **Reglas de Interfaz:** 
  * **Muerte a las sombras:** PROHIBIDO usar `box-shadow` clásicas. Solo se permiten *glows* (resplandores finos y elegantes) usando el color accent, y ligeros desenfoques (`backdrop-filter: blur`).
  * **Controles a medida:** Prohibido usar `<select>` nativos (se simulan con JS) y las *checkboxes* se cambian por *toggles* tipo píldora.
  * **Feedback Visual y Auditivo:** Animación CSS de **shake** (temblor) para errores. Para éxitos (ej. guardar ajustes), se reproduce un sonido premium **sintetizado 100% con JS (Web Audio API)**. Cero archivos `.mp3` u `.ogg`.

---

## 💾 5. GUARDADO Y RENDIMIENTO
* **Guardado en la Sombra:** No hay botón enorme de "Guardar". Funciona con un autoguardado vía `fetch` al API usando un **debounce** (ej: 2 segundos sin teclear). Guarda el árbol JSON completo.
* **Salvavidas:** `sendBeacon()` al evento `beforeunload` para no perder nada al cerrar.
* **Atajos:** `Ctrl+S` fuerza el guardado (evitando el de descarga del navegador).
* **Deshacer/Rehacer:** `Ctrl+Z` / `Ctrl+Y` manejan un historial en memoria RAM (array de estados capado a 50 pasos) para máxima velocidad.

---

## 🌍 6. INTERNACIONALIZACIÓN (i18n)
* **Inglés por Omisión:** El idioma maestro y único instalado por defecto es el inglés (`en.json` en `/core/locales/`). 
* Si el usuario descarga otro idioma (ej: español o coreano en `/data/`), sobrescribe al maestro al vuelo en JS usando `data-i18n`. Si falta una clave nueva por una actualización, tira del inglés para que no pete la interfaz (Fallback).

---

## 🧠 7. PROTOCOLO PARA LA IA (GEMINI WEB) 
4. Habla claro, crudo, sin halagos y ve directo al grano. Tono de barra de bar.

---

## 📝 ESTADO DE SESIÓN (Log de Batalla)
* **Infraestructura:** Creado el script `build.js` que genera un "Fat Installer" (`dist/index.php`) blindado, inyectando JS/CSS en Base64 para que PHP los vomite en `/core/` al instalarse, creando también la zona segura `/data/` y la DB SQLite.
* **Seguridad y Core:** `00-preflight.php` (checks de PHP 8.1+ y soporte para servidor interno cli), `02-core.php` (cabeceras restrictivas HTTPS/CSP, sesión segura, conexión PDO a SQLite), y enrutador universal agnóstico en `04-router.php` (funciona con Apache, Nginx o cli-server).
* **Autenticación (Passkeys):** Implementada en `03-auth.php` de forma nativa sin librerías de terceros (CBOR). Cero fricción (User Presence mode, sin requerir PIN constante). Endpoints API montados en el router para registro y login.
* **Interfaz (Dark Premium):** Vistas del instalador (`01-installer.php`) y Login (`05-login.php`) operativas. Lógica Vanilla JS (`installer.js`, `login.js`) con feedback háptico visual (animación de *shake*) y sonoro usando la Web Audio API (sintetizador premium, nada de mp3).
* **Editor UI (El Motor Visual):** Cascarón principal montado (`06-editor.php`, `editor-app.js`). Implementada la barra superior (`editor-topbar.js`), el lienzo responsivo con viewports (`editor-canvas.js`), el motor de traducciones (`editor-i18n.js`) y un catálogo de controles a medida (`editor-controls.js`: Toggles, Selects, Sliders, Spacing, ColorPicker con OS fallback). 
* **El Francotirador:** Sistema de selección de nodos en el Shadow DOM (`editor-selection.js`) que se comunica con el Inspector (`editor-inspector.js`) a través de CustomEvents.
* **Panel Izquierdo & Layers:** Implementado `editor-leftpanel.js` con pestañas de Elementos (Átomos estructurales como Section, Container, Heading...) y Árbol de Capas reactivo (`MutationObserver`) con soporte Drag & Drop nativo para reordenar y anidar.
* **Ajustes Globales:** Añadido `editor-settings.js` (Overlay Dark Premium) inyectando variables CSS en vivo (Max Width, Colores, Tipografías) al lienzo y gestionando Google Fonts múltiples.
* **Lienzo Infinito y Edición Estricta:** Canvas con márgenes dinámicos para scroll masivo al hacer zoom, y auto-fit de dispositivos. El lienzo ahora es estructuralmente estricto (cero textos fantasma), permitiendo edición inline `contenteditable` solo al hacer clic en bloques de texto reales y protegiendo la selección.
* **Controles UI Avanzados:** `EscmsColorPicker` ahora cuenta con input HEX interactivo y canal Alpha.
* **Top Bar:** Añadido soporte Fullscreen nativo con cambio de icono dinámico.

**Siguiente paso lógico:** Conectar el Inspector (Panel Derecho) de forma bidireccional leyendo el `window.getComputedStyle()` para alterar los estilos del nodo seleccionado en tiempo real. Después, implementar la lógica de Autoguardado (Autosave) en `editor-app.js` para guardar el DOM en SQLite vía AJAX.
