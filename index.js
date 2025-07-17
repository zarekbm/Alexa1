require('dotenv').config();
const express = require('express');
const { ExpressAdapter } = require('ask-sdk-express-adapter');
const Alexa = require('ask-sdk-core');
const axios = require('axios');

const app = express();
app.use(express.json());

// Mapeo de intents a acciones
const INTENT_MAP = {
  'IniciarAgregarMedicamento': { action: 'iniciar_agregar' },
  'CapturarNombreMedicamento': { action: 'agregar_medicamento', param: 'nombre' },
  'CapturarCantidadMedicamento': { action: 'agregar_medicamento', param: 'cantidad' },
  'CapturarCantidadMinima': { action: 'agregar_medicamento', param: 'cantidadMinima' },
  'CapturarVencimiento': { action: 'agregar_medicamento', param: 'vencimiento' },
  'IniciarActualizarStock': { action: 'iniciar_actualizar' },
  'CapturarMedicamentoActualizar': { action: 'actualizar_stock', param: 'medicamento' },
  'CapturarNuevaCantidad': { action: 'actualizar_stock', param: 'cantidad' },
  'IniciarRegistrarToma': { action: 'iniciar_toma' },
  'CapturarMedicamentoToma': { action: 'registrar_toma', param: 'medicamento' },
  'ConfirmarCantidadToma': { action: 'registrar_toma', param: 'cantidad' }
};

// Handler para gestionar el estado de la conversación
const GestionInventarioHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' 
      && Object.keys(INTENT_MAP).includes(Alexa.getIntentName(handlerInput.requestEnvelope));
  },
  async handle(handlerInput) {
    const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
    const { intent } = handlerInput.requestEnvelope.request;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const config = INTENT_MAP[intentName];
    
    // Almacenar datos en sesión
    if (config.param && intent.slots[config.param]) {
      sessionAttributes[config.param] = intent.slots[config.param].value;
    }

    // Determinar próximo paso
    let response;
    if (intentName === 'CapturarVencimiento') {
      const payload = {
        action: 'agregar_medicamento',
        ...sessionAttributes
      };
      const result = await callAppScript(payload);
      response = result.message;
    } 
    else if (intentName === 'CapturarNuevaCantidad') {
      const payload = {
        action: 'actualizar_stock',
        medicamento: sessionAttributes.medicamento,
        cantidad: sessionAttributes.cantidad
      };
      const result = await callAppScript(payload);
      response = result.message;
    }
    else if (intentName === 'ConfirmarCantidadToma') {
      const payload = {
        action: 'registrar_toma',
        medicamento: sessionAttributes.medicamento,
        cantidad: sessionAttributes.cantidad
      };
      const result = await callAppScript(payload);
      response = result.message;
    } else {
      response = getNextPrompt(intentName);
    }

    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    return handlerInput.responseBuilder.speak(response).reprompt(response).getResponse();
  }
};

// Función para llamar a Google Apps Script
async function callAppScript(payload) {
  try {
    const response = await axios.post(process.env.APPSCRIPT_URL, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  } catch (error) {
    console.error('Error calling AppScript:', error);
    return { message: 'Hubo un error al procesar tu solicitud' };
  }
}

// Configuración del skill
const skillBuilder = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    GestionInventarioHandler,
    // ... otros handlers estándar
  )
  .withPersistenceAdapter(
    new Alexa.DynamoDbPersistenceAdapter({ tableName: 'medicamentos_sessions' })
  );

const adapter = new ExpressAdapter(skillBuilder.create(), false, false);
app.post('/', adapter.getRequestHandlers());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
