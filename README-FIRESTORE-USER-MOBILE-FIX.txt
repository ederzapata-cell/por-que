¿POR QUÉ? — FIX FIRESTORE EN CELULAR

Qué cambia:
- El usuario se guarda con set(..., { merge: true }) directamente.
- Ya no hace una lectura previa antes de crear/actualizar el documento.
- El guardado se intenta:
  1) al volver del redirect de Google
  2) cada vez que Firebase detecta una sesión activa
- Muestra “Cuenta conectada y guardada en Firestore” si la escritura funciona.

Prueba:
1. Reemplaza todos los archivos del ZIP en el repo.
2. Espera el deploy de Netlify.
3. En el celular, cierra sesión si ya estabas dentro.
4. Vuelve a entrar con Google.
5. Abre el botón de cuenta: debe decir
   “Cuenta conectada y guardada en Firestore.”
6. En Firebase → Firestore Database → Data debe aparecer:
   users → {tu UID}

Si aparece un error de Firestore dentro de la app, copia exactamente ese mensaje.
