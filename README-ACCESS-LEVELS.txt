¿POR QUÉ? — NIVELES DE ACCESO / PAYWALL

Planes definidos:
- free = 10 preguntas
- 100 = 100 preguntas
- 300 = 300 preguntas
- all = 1000 preguntas

Precios:
- 100 preguntas: $14.900 COP
- 300 preguntas: $29.900 COP
- Completo / 1000: $49.900 COP

Comportamiento:
- La app lee `plan` desde users/{uid} en Firestore.
- Si no hay sesión o no existe plan, usa `free`.
- Al intentar abrir una pregunta por encima del límite, aparece el paywall.
- Todavía NO se conecta Wompi.
- Los botones del paywall solo muestran que Wompi se conectará después.

Para probar manualmente:
1. Abre Firebase → Firestore → users/{uid}.
2. Cambia `plan` entre:
   free
   100
   300
   all
3. Recarga la app con la sesión iniciada.
4. La app debe respetar el límite correspondiente.

IMPORTANTE:
Antes de activar pagos reales, la escritura de `plan` y desbloqueos debe pasar a backend/webhook.
El cliente no debe poder autorizar compras por sí mismo.
