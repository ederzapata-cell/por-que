¿POR QUÉ? — SINCRONIZACIÓN DE PROGRESO CON FIRESTORE

Ahora users/{uid} guarda también:
- discoveredQuestions
- questionOrder
- currentIndex
- progressUpdatedAt

Por qué se guarda questionOrder:
La app baraja 1.000 preguntas. Guardar solo currentIndex no permitiría continuar
en la misma pregunta desde otro dispositivo si cada dispositivo tuviera un orden distinto.

Comportamiento:
1. Sin cuenta: la prueba gratis sigue funcionando con localStorage.
2. Al iniciar sesión:
   - se conservan las preguntas descubiertas en ese dispositivo;
   - se fusionan con las ya guardadas en Firestore;
   - si Firestore tiene un progreso más reciente, se recupera su orden y posición;
   - si el dispositivo tiene progreso más reciente, se sube a Firestore.
3. Mientras el usuario está conectado:
   - descubrir una pregunta sincroniza automáticamente;
   - avanzar/retroceder sincroniza la posición;
   - empezar una nueva ronda sincroniza el nuevo orden.
4. localStorage continúa como respaldo local.

PRUEBA:
A. En computador, inicia sesión y avanza varias preguntas.
B. Abre Sencillo/Profundo en algunas para agregarlas a Mis preguntas.
C. Espera 1–2 segundos.
D. En Firebase → Firestore → users/{uid}, revisa:
   discoveredQuestions, questionOrder, currentIndex, progressUpdatedAt.
E. Cierra la app en el celular y vuelve a abrir con la MISMA cuenta.
   Debe recuperar el progreso y Mis preguntas.

Reemplaza todos los archivos del ZIP en el repo.
