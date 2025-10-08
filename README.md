# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/86a23a29-ee39-4881-8424-091599733ad4

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/86a23a29-ee39-4881-8424-091599733ad4) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## ¿Cómo puedo jugarlo localmente?

Sigue estos pasos para montar el proyecto en tu computadora y probar el juego:

1. Asegúrate de tener [Node.js 18 o superior](https://nodejs.org/) y npm instalados.
2. Clona este repositorio y entra en la carpeta del proyecto.
3. Instala las dependencias con `npm install`.
4. Ejecuta `npm run dev` y abre el enlace que aparece en consola (por defecto http://localhost:5173).

```
git clone <URL_DEL_REPO>
cd zombieroguelike
npm install
npm run dev
```

Esto levanta un servidor de desarrollo con recarga en caliente para que puedas iterar rápidamente.

Para verificar la build de producción antes de desplegar, ejecuta:

```
npm run build
npm run preview
```

## ¿Cómo puedo hostearlo en línea?

Si quieres publicar el juego para compartirlo con otras personas, puedes usar cualquiera de estas opciones gratuitas:

- **Vercel**
  1. Crea una cuenta en [vercel.com](https://vercel.com/).
  2. Importa este repositorio desde GitHub.
  3. Cuando Vercel te pregunte por el comando de build usa `npm run build` y para el output deja el valor por defecto `dist`.
  4. Pulsa Deploy; en pocos segundos tendrás una URL pública.
- **Netlify**
  1. Crea una cuenta en [netlify.com](https://www.netlify.com/).
  2. Selecciona “Add new site” → “Import an existing project”.
  3. Conecta tu repositorio y configura `npm run build` como comando de build y `dist` como carpeta de publicación.
  4. Despliega y comparte la URL generada.
- **GitHub Pages**
  1. Ejecuta `npm run build` para generar la carpeta `dist`.
  2. Instala [gh-pages](https://www.npmjs.com/package/gh-pages) (`npm install --save-dev gh-pages`) y agrega un script "deploy": "gh-pages -d dist".
  3. Corre `npm run deploy` y GitHub publicará el sitio en `https://<tu_usuario>.github.io/<tu_repo>/`.

Cada plataforma se encarga del hosting automáticamente, así que no necesitas mantener un servidor propio.

## ¿Cómo lo convierto en una app para macOS y un ejecutable para Windows?

Habilitamos un contenedor de escritorio con Electron para que puedas empaquetar el juego sin tocar el código principal.

### Prueba rápida del contenedor de escritorio

1. Instala dependencias si aún no lo has hecho (`npm install`).
2. Ejecuta `npm run dev:desktop`.
3. Espera a que Vite levante el servidor y se abrirá una ventana nativa con el juego renderizado.

Esto te permite validar el “feel” de la versión de escritorio mientras sigues iterando sobre la versión web.

### Generar una `.app` en macOS

1. Abre la Terminal en macOS dentro de la carpeta del proyecto.
2. Ejecuta `npm run build:desktop:mac`.
3. El instalador (`.dmg`) y la aplicación (`.app`) se guardarán en la carpeta `release/`.

> Nota: el script desactiva la búsqueda automática de certificados (`CSC_IDENTITY_AUTO_DISCOVERY=false`) para que puedas generar builds sin firmarlas. Si quieres distribuirla fuera de tu entorno local considera firmar y notarizar la app.

### Generar un `.exe` en Windows

1. Abre PowerShell o CMD dentro del proyecto.
2. Ejecuta `npm run build:desktop:win`.
3. El instalador (`.exe`) quedará disponible en la carpeta `release/` listo para compartir.

### Empaquetar ambos desde su sistema correspondiente

Si solo necesitas los artefactos para compartirlos internamente, corre el comando en el sistema operativo objetivo. Electron Builder no soporta crear binarios de macOS desde Windows (ni viceversa), por lo que cada build debe generarse en su plataforma correspondiente.

Cuando quieras limpiar builds anteriores, elimina la carpeta `release/`.
