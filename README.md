# App de la cantina (etapa 2)

App web instalable (PWA) para la empleada: ventas al contado y a crédito, cobro de deudas, stock y cierre de caja.
Se conecta a la API `cantina-backend` y sigue funcionando sin internet.

## Publicar en GitHub Pages
1. Creá un repositorio **público** (ej: `cantina-app`) y subí todos los archivos de esta carpeta.
   (No tiene datos secretos: solo la dirección de la API.)
2. Settings → Pages → Source: *Deploy from a branch* → Branch `main`, carpeta `/ (root)` → Save.
3. Editá `config.js` y poné la dirección de tu API de Render.
4. En Render, en la API, cambiá `CORS_ORIGINS` por `https://TUUSUARIO.github.io` (sin barra ni nombre del repositorio).
5. Abrí `https://TUUSUARIO.github.io/cantina-app/` en el celular y agregalo a la pantalla de inicio.

## Reglas
- Para entrar y abrir el turno hace falta internet. Después se puede vender sin conexión.
- Sin conexión, el crédito y los cobros se confirman con **firma** (el PIN del cliente solo se verifica con internet).
- Las operaciones sin enviar se guardan en el aparato y se envían solas al volver la conexión (no se duplican).
- Para cerrar la caja hace falta internet y que no haya operaciones pendientes.
- Si cambiás archivos de la app, subí también `sw.js` con un número de versión nuevo en `const V` para que los aparatos se actualicen.
