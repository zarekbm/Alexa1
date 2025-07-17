# Alexa Medicamentos Proxy

Servidor Node.js para Render, que expone la Alexa Skill y conecta con un Google App Script backend (Spreadsheet).

## Uso

1. Clona este repositorio.
2. Copia `.env.example` a `.env` y ajusta la URL de tu Google App Script.
3. Instala dependencias:

   ```
   npm install
   ```

4. Ejecuta el servidor localmente:

   ```
   npm start
   ```

5. Despliega en [Render](https://render.com/) como servicio web.

## Endpoint

- `/alexa`: endpoint POST de la Alexa Skill (configura este endpoint en el backend de tu Skill en la consola de Amazon).

## Variables de entorno

- `GOOGLE_APP_SCRIPT_URL`: URL de tu Google Apps Script WebApp.
- `PORT`: Puerto (opcional, default 3000).

## Notas

- La skill de Alexa usa axios para comunicarse directamente con el App Script.
- El servidor simplemente actúa de "puente" y expone el handler HTTP para Alexa.