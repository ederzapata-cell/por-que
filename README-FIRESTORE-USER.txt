¿POR QUÉ? — FIRESTORE USER PILOT

Qué añade:
- Firebase Firestore SDK.
- Al iniciar sesión con Google:
  - si el usuario NO existe, crea users/{uid}
  - si ya existe, actualiza lastLogin
- Guarda inicialmente:
  uid
  name
  email
  photoURL
  provider
  createdAt
  lastLogin
  discoveredQuestions
  unlockedQuestions
  currentIndex
  plan = "free"

No cambia:
- 10 preguntas gratis sin registro
- Google Sign-In escritorio/móvil
- banco de 1.000 preguntas
- navegación sin repeticiones

Después de subir:
1. Inicia sesión con Google en https://porque.tekkify.co/
2. Firebase → Firestore Database → Data
3. Debe aparecer la colección users
4. Dentro debe aparecer un documento con tu UID

Para actualizar:
Reemplaza los archivos del ZIP en el repo, sin borrar archivos extra.
