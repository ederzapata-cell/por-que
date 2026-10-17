¿POR QUÉ? — FIX DE "MIS PREGUNTAS" ENTRE DISPOSITIVOS

Problema corregido:
La versión anterior fusionaba primero las preguntas locales de cada dispositivo.
Eso podía producir un orden diferente en "Mis preguntas".

Nueva regla:
- Antes de tener cuenta: localStorage.
- Primer login, si Firestore todavía no tiene discoveredQuestions:
  se migran una sola vez las preguntas locales.
- Después de eso:
  FIRESTORE ES LA FUENTE OFICIAL.
- Celular y computador reciben:
  - exactamente los mismos IDs
  - exactamente el mismo orden en Mis preguntas
  - el mismo questionOrder de Explorar
  - el mismo currentIndex

Prueba:
1. Reemplaza los archivos.
2. En computador, entra con la cuenta y abre 3 preguntas nuevas.
3. Espera 1–2 segundos.
4. En celular, cierra y abre la app con la misma cuenta.
5. En Mis preguntas deben aparecer las mismas preguntas y en el mismo orden.

NOTA:
Si el documento de Firestore ya acumuló preguntas de pruebas anteriores,
esa lista acumulada será ahora la lista oficial. A partir de este fix todos
los dispositivos quedarán iguales.
