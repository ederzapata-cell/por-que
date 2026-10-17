¿POR QUÉ? — AUTH + FIRESTORE MÓVIL (POPUP)

Cambio principal:
- Se elimina signInWithRedirect.
- Google Sign-In usa popup tanto en computador como en celular.
- NO se fuerza select_account.
- Después de autenticar:
  1. se obtiene/refresca el token Firebase Auth
  2. se escribe users/{uid} directamente en Firestore
- onAuthStateChanged vuelve a intentar el guardado como respaldo.

Prueba recomendada:
1. Reemplaza todos los archivos del ZIP.
2. Espera el deploy.
3. En el celular, cierra sesión.
4. Vuelve a entrar con Google.
5. Abre Firebase → Firestore Database → Data.
6. Debe aparecer users/{uid}.

Si Google ya tiene la sesión activa en el teléfono, normalmente no debería pedir
la contraseña otra vez.
