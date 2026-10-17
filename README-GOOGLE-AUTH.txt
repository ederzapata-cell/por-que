¿POR QUÉ? — PILOTO GOOGLE SIGN-IN

Archivos nuevos:
- firebase-config.js
- auth.js

Archivos actualizados:
- index.html
- styles.css
- app.js (mantiene navegación sin repeticiones)
- questions.js (1.000 preguntas)

Qué hace:
- Mantiene las 10 preguntas gratis SIN exigir cuenta.
- Añade un botón de cuenta arriba a la derecha.
- Abre un modal con “Continuar con Google”.
- Permite elegir cuenta Google.
- Mantiene la sesión iniciada mediante Firebase Authentication.
- Permite cerrar sesión.
- Todavía NO guarda progreso ni compras en Firestore.

ANTES DE PROBAR EN NETLIFY:
Firebase Console → Authentication → Settings → Authorized domains
Añadir:
por-que-app.netlify.app

Luego subir estos archivos reemplazando los actuales.
