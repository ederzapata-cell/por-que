¿POR QUÉ? — GOOGLE SIGN-IN: ESCRITORIO + CELULAR

Comportamiento:
- Computador: Google Sign-In usa popup.
- Celular/tablet: Google Sign-In usa redirect.
- En móvil, Google abre el flujo de acceso y luego vuelve automáticamente a la app.
- Mantiene las 10 preguntas gratis sin exigir cuenta.
- Todavía no guarda progreso ni compras en Firestore.

IMPORTANTE:
Firebase Console → Authentication → Settings → Authorized domains
debe contener:
porque.tekkify.co

Para actualizar:
Reemplaza todos los archivos del ZIP en el repo, sin borrar archivos extra que no estén incluidos.
