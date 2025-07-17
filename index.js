require('dotenv').config();
const express = require('express');
const { ExpressAdapter } = require('ask-sdk-express-adapter');
const Alexa = require('ask-sdk-core');
const axios = require('axios');

const app = express();
app.use(express.json());

// Configuración
const APPSCRIPT_URL = process.env.APPSCRIPT_URL;

// Mapeo de intents a acciones
const INTENT_HANDLERS = {
  'IniciarAgregarMedicamento': {
    prompt: '¿Qué medicamento deseas agregar?',
    nextIntent: 'CapturarNombreMedicamento'
  },
  'CapturarNombreMedicamento': {
    param: 'nombre',
    prompt: '¿Cuántas unidades ingresas?',
    nextIntent: 'CapturarCantidadMedicamento'
  },
  'CapturarCantidadMedicamento': {
    param: 'cantidad',
    prompt: '¿Cuál será la cantidad mínima para alertas?',
    nextIntent: 'CapturarCantidadMinima'
  },
  'CapturarCantidadMinima': {
    param: 'cantidadMinima',
    prompt: '¿Cuál es la fecha de vencimiento? (ejemplo: 2024-12-31)',
    nextIntent: 'CapturarVencimiento'
  },
  'CapturarVencimiento': {
    param: 'vencimiento',
    action: 'agregar_medicamento'
  },
  'IniciarActualizarStock': {
    prompt: '¿Qué medicamento deseas actualizar?',
    nextIntent: 'CapturarMedicamentoActualizar'
  },
  'CapturarMedicamentoActualizar': {
    param: 'medicamento',
    prompt: '¿A qué cantidad deseas actualizar?',
    nextIntent: 'CapturarNuevaCantidad'
  },
  'CapturarNuevaCantidad': {
    param: 'cantidad',
    action: 'actualizar_stock'
  },
  'IniciarRegistrarToma': {
    prompt: '¿Qué medicamento tomaste?',
    nextIntent: 'CapturarMedicamentoToma'
  },
  'CapturarMedicamentoToma': {
    param: 'medicamento',
    prompt: '¿Cuántas unidades tomaste?',
    nextIntent: 'ConfirmarCantidadToma'
  },
  'ConfirmarCantidadToma': {
    param: 'cantidad',
    action: 'registrar_toma'
  }
};

// Handler principal
const GestionInventarioHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' 
      && Object.keys(INTENT_HANDLERS).includes(Alexa.getIntentName(handlerInput.requestEnvelope));
  },
  async handle(handlerInput) {
    const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
    const { intent } = handlerInput.requestEnvelope.request;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const handlerConfig = INTENT_HANDLERS[intentName];

    // Almacenar dato si corresponde
    if (handlerConfig.param && intent.slots[handlerConfig.param]?.value) {
      sessionAttributes[handlerConfig.param] = intent.slots[handlerConfig.param].value;
    }

    // Si es acción final, llamar a AppScript
    if (handlerConfig.action) {
      const payload = {
        action: handlerConfig.action,
        ...sessionAttributes
      };
      
      try {
        const result = await callAppScript(payload);
        handlerInput.attributesManager.setSessionAttributes({});
        return handlerInput.responseBuilder
          .speak(result.message)
          .getResponse();
      } catch (error) {
        return handlerInput.responseBuilder
          .speak('Ocurrió un error al procesar tu solicitud')
          .getResponse();
      }
    }

    // Continuar con el siguiente paso
    return handlerInput.responseBuilder
      .speak(handlerConfig.prompt)
      .reprompt(handlerConfig.prompt)
      .getResponse();
  }
};

// Función para llamar a Google Apps Script
async function callAppScript(payload) {
  const response = await axios.post(APPSCRIPT_URL, payload, {
    headers: { 'Content-Type': 'application/json' }
  });
  return response.data;
}

// Handlers básicos de Alexa
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechText = 'Bienvenido al sistema de inventario de medicamentos. Puedes agregar medicamentos, actualizar existencias o registrar tomas. ¿Qué deseas hacer?';
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'Puedes decir: agregar un medicamento, actualizar stock, o registrar una toma. ¿En qué te puedo ayudar?';
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Hasta luego. Que tengas un buen día.';
    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  }
};

// Configuración del skill sin DynamoDB
const skillBuilder = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    GestionInventarioHandler,
    LaunchRequestHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler
  )
  .withApiClient(new Alexa.DefaultApiClient());

const adapter = new ExpressAdapter(skillBuilder.create(), false, false);

app.post('/', adapter.getRequestHandlers());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', version: '2.0.0' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});
