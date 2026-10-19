POR QUÉ? — MEDICIÓN DEL EMBUDO (PASO 2)

Eventos añadidos:
- app_open
- trial_started
- question_10_reached
- paywall_view

Dónde quedan:
1. localStorage: pq_funnel_events
2. Si el usuario ya inició sesión:
   users/{uid}/funnel_events en Firestore

Cada evento incluye la fuente (src) capturada en el paso anterior.

Definiciones:
- app_open: abre la experiencia.
- trial_started: usuario FREE revela una respuesta por primera vez en la sesión.
- question_10_reached: usuario FREE revela la respuesta de la pregunta 10.
- paywall_view: se muestra el paywall.

No se modificaron:
- límite de 10 preguntas
- preguntas/respuestas
- planes/precios
- Wompi
- lógica de desbloqueo
