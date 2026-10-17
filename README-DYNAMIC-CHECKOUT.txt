¿POR QUÉ? — CHECKOUT DINÁMICO WOMPI

Incluye:
- netlify/functions/create-checkout.js
- netlify.toml
- payment-return.html
- paywall conectado al checkout dinámico

Variables requeridas en Netlify:
- WOMPI_PUBLIC_KEY
- WOMPI_INTEGRITY_SECRET
- WOMPI_EVENT_SECRET  (se usará en el siguiente paso: webhook)

Flujo actual:
1. Usuario debe estar autenticado.
2. Selecciona 100 / 300 / all.
3. La app llama /.netlify/functions/create-checkout
4. El servidor genera:
   - referencia única
   - monto fijo según plan
   - firma SHA-256
5. Navega al Web Checkout oficial de Wompi.
6. Wompi vuelve a /payment-return.html

IMPORTANTE:
Este paso todavía NO activa el plan.
La activación real vendrá con el webhook verificado en el siguiente paso.

PRUEBA AHORA:
- Sube todos los archivos.
- Espera deploy.
- Inicia sesión.
- Abre el paywall.
- Pulsa uno de los planes.
- Debe abrir el checkout de Wompi con el monto correcto.
- NO completes un pago todavía si no quieres: solo verificamos que el checkout abre bien.
