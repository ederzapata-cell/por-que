POR QUÉ? — EMBUDO ANÓNIMO

La app ahora:
- NO pide nombre.
- NO pide email.
- NO exige registro para las 10 preguntas.
- Genera automáticamente pq_visitor_id en el navegador.
- Registra app_open, trial_started, question_10_reached y paywall_view.
- Conserva src (meta / instagram / facebook / etc.).
- Usa colecciones raíz:
    funnel_events
    visitors

IMPORTANTE:
Para que Firestore acepte eventos de visitantes SIN autenticar, las reglas de Firestore
deben permitir CREATE en funnel_events y CREATE/UPDATE en visitors con validación limitada.
Si las reglas actuales exigen request.auth != null para toda la base, el navegador bloqueará
estos writes aunque el código de la app sea correcto.

No se modificaron las 10 preguntas, planes, precios, Wompi ni desbloqueos.
