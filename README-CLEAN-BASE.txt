¿POR QUÉ? — BASE LIMPIA ANTES DEL CHECKOUT DINÁMICO

Correcciones críticas:
1. El login ya NO escribe `plan: "free"` ni `unlockedCount: 10`.
   Así un usuario que compre un plan no puede ser degradado al volver a iniciar sesión.

2. Se eliminó el paywall viejo de 50 / 200 preguntas.

3. Queda un único paywall:
   - 100 preguntas — $14.900
   - 300 preguntas — $29.900
   - Completo / 1000 — $49.900

4. El límite ya usa el plan real:
   free = 10
   100 = 100
   300 = 300
   all = 1000

5. Los links Wompi reutilizables siguen funcionando por ahora.

SIGUIENTE PASO:
Sustituir estos links por checkout dinámico firmado + webhook para activación automática.
