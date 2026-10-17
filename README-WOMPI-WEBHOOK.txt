¿POR QUÉ? — CHECKOUT SEGURO + WEBHOOK WOMPI → FIRESTORE

Variables que deben existir en Netlify:
WOMPI_PUBLIC_KEY
WOMPI_INTEGRITY_SECRET
WOMPI_EVENT_SECRET
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY

IMPORTANTE:
FIREBASE_PRIVATE_KEY debe conservar el valor completo de private_key del JSON.
El código convierte los caracteres \n en saltos de línea al inicializar Firebase Admin.

MEJORAS INCLUIDAS
1. create-checkout ya NO confía en uid/email enviados por el navegador.
2. El frontend envía Firebase ID Token.
3. Netlify verifica ese token con Firebase Admin.
4. La referencia sigue incluyendo plan + UID, pero el UID proviene del token verificado.
5. wompi-webhook valida la firma usando exactamente signature.properties,
   timestamp y WOMPI_EVENT_SECRET.
6. Solo transaction.updated + APPROVED activa acceso.
7. También valida:
   - referencia PQ válida
   - moneda COP
   - monto exacto del plan
   - UID existente en Firebase Authentication
8. Protección contra eventos duplicados mediante wompiPurchases/{transactionId}.
9. Un pago menor nunca degrada un plan mayor.

PLANES
100 → $14.900 → 1.490.000 centavos
300 → $29.900 → 2.990.000 centavos
all → $49.900 → 4.990.000 centavos

URL DEL WEBHOOK
https://porque.tekkify.co/.netlify/functions/wompi-webhook

SIGUIENTE PASO DESPUÉS DE SUBIR ESTE ZIP
En Wompi, configurar esa URL como URL de eventos.

NO HAGAS UN PAGO REAL TODAVÍA.
Primero confirma que Netlify terminó el deploy sin errores.
