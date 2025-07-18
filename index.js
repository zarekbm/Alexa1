require('dotenv').config();
const express = require('express');
const { ExpressAdapter } = require('ask-sdk-express-adapter');
const Alexa = require('ask-sdk-core');
const axios = require('axios');

const app = express();

// Configuración de middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración
const APPSCRIPT_URL = process.env.APPSCRIPT_URL;

// Headers para respuestas de Alexa
const ALEXA_HEADERS = {
  'Content-Type': 'application/json;charset=UTF-8',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache'
};

// Manejador para SessionEndedRequest
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    const { reason } = handlerInput.requestEnvelope.request;
    console.log(`Sesión terminada por: ${reason}`);
    
    // Lógica de limpieza si es necesaria
    return handlerInput.responseBuilder.getResponse();
  }
};

// [Aquí irían los demás handlers que ya tenías...]

// Configuración del skill con el nuevo handler
const skillBuilder = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    GestionInventarioHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler // Añadido el nuevo handler
  )
  .addErrorHandlers(ErrorHandler)
  .withApiClient(new Alexa.DefaultApiClient());

const skill = skillBuilder.create();
const adapter = new ExpressAdapter(skill, false, false);

// Endpoint principal para Alexa
app.post('/', (req, res) => {
  // Verificación básica del cuerpo de la solicitud
  if (!req.body || !req.body.request) {
    return res.status(400).set(ALEXA_HEADERS).json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "Solicitud inválida"
        },
        shouldEndSession: true
      }
    });
  }

  // Manejar la solicitud a través del adapter de Alexa
  adapter.execute(req, res)
    .catch(error => {
      console.error('Error en el adapter:', error);
      res.status(500).set(ALEXA_HEADERS).json({
        version: "1.0",
        response: {
          outputSpeech: {
            type: "PlainText",
            text: "Error interno del servidor"
          },
          shouldEndSession: true
        }
      });
    });
});

// [Resto de tu configuración del servidor...]

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
  console.log(`AppScript URL: ${APPSCRIPT_URL || 'No configurada'}`);
});

/* const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(express.json());
const app = express();
app.use(bodyParser.json());

app.post('/', (req, res) => {
  const requestType = req.body.request.type;
  
  if (requestType === 'LaunchRequest') {
    // Respuesta para "Alexa, abre mi botiquín"
    const response = {
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "Bienvenido a Mi Botiquín. ¿Qué necesitas?"
        },
        shouldEndSession: false
      }
    };
    return res.json(response);
  }

  // Manejar otros tipos de solicitud
  res.status(400).json({ error: "Solicitud no soportada" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
/*
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
*/
