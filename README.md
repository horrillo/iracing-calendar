# 🏁 iRacing Calendar by Horrillo

Calendario completo de iRacing con todas las series, circuitos, condiciones climáticas y eventos especiales.

![Preview](https://img.shields.io/badge/Season-2%20•%202026-8B5CF6?style=for-the-badge)

## 🚀 Instalación en Vercel (5 minutos)

### Paso 1: Preparar los archivos
1. Descarga este proyecto completo (toda la carpeta)
2. Asegúrate de que tienes esta estructura:
```
horrillo-iracing-calendar/
├── public/
│   ├── index.html      (web principal)
│   ├── admin.html      (panel para subir PDFs)
│   ├── app.js          (código JavaScript)
│   ├── logo.png        (tu logo)
│   └── data/
│       └── calendar.json  (datos del calendario)
└── vercel.json         (configuración)
```

### Paso 2: Subir a Vercel
1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Haz clic en **"Add New..."** → **"Project"**
3. Selecciona **"Upload"** (subir archivos)
4. Arrastra toda la carpeta `horrillo-iracing-calendar`
5. Haz clic en **"Deploy"**
6. ¡Listo! Vercel te dará una URL como `horrillo-iracing-calendar.vercel.app`

### Paso 3: Personalizar la URL (opcional)
1. En el dashboard de Vercel, ve a tu proyecto
2. Haz clic en **"Settings"** → **"Domains"**
3. Puedes cambiar el subdominio o añadir tu propio dominio

---

## 📅 Actualizar el Calendario (Nueva Temporada)

Cuando salga una nueva temporada de iRacing:

### Opción A: Usar el Panel Admin (Recomendado)
1. Ve a `tu-web.vercel.app/admin.html`
2. Sube el nuevo PDF del calendario de iRacing
3. Haz clic en "Procesar PDF"
4. Descarga el archivo `calendar.json` generado
5. Reemplaza el archivo en `public/data/calendar.json`
6. Sube los cambios a Vercel (re-deploy)

### Opción B: Manual
1. Descarga el PDF de iRacing
2. Usa el panel admin para generar el JSON
3. Reemplaza `public/data/calendar.json`
4. Re-deploy en Vercel

---

## 📁 Estructura de Archivos

| Archivo | Descripción |
|---------|-------------|
| `public/index.html` | Página principal del calendario |
| `public/admin.html` | Panel para procesar PDFs |
| `public/app.js` | Lógica de la aplicación |
| `public/logo.png` | Tu logo |
| `public/data/calendar.json` | Datos del calendario actual |
| `vercel.json` | Configuración de Vercel |

---

## 🎨 Personalización

### Cambiar colores
Edita las variables CSS en `public/index.html`:
```css
:root {
    --purple-primary: #8B5CF6;  /* Color principal */
    --purple-light: #A78BFA;    /* Color secundario */
    /* ... */
}
```

### Cambiar redes sociales
Busca los enlaces en `public/index.html` y modifícalos:
```html
<a href="https://twitch.tv/TU_CANAL" ...>
<a href="https://x.com/TU_TWITTER" ...>
<a href="https://youtube.com/@TU_CANAL" ...>
```

---

## ❓ FAQ

**¿Es gratis?**
Sí, Vercel tiene un plan gratuito que es más que suficiente.

**¿Puedo usar mi propio dominio?**
Sí, puedes conectar tu dominio en la configuración de Vercel.

**¿Se actualiza automáticamente?**
No, tienes que subir el nuevo PDF cada temporada manualmente.

**¿Funciona en móvil?**
Sí, el diseño es 100% responsive.

---

## 📞 Soporte

- **Twitch:** [twitch.tv/horrillo](https://twitch.tv/horrillo)
- **Twitter/X:** [@horrillo22](https://x.com/horrillo22)
- **YouTube:** [@Horrillo_1](https://youtube.com/@Horrillo_1)

---

Hecho con 💜 por Horrillo
