¿POR QUÉ? — LINKS WOMPI CONECTADOS

Paywall:
- 100 preguntas → https://checkout.wompi.co/l/m7CdM0
- 300 preguntas → https://checkout.wompi.co/l/hd2osZ
- Completo / 1000 → https://checkout.wompi.co/l/gRfusB

Los botones ya redirigen al checkout real de Wompi.

IMPORTANTE:
Esto SOLO conecta el checkout.
Aún falta el webhook/backend que:
1. reciba el evento aprobado de Wompi;
2. valide la transacción;
3. identifique al usuario;
4. actualice users/{uid}.plan y unlockedCount en Firestore.

No debe activarse un plan desde el navegador ni desde payment-return.html.
La activación real debe hacerse en backend/webhook.
