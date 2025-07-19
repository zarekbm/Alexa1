const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const { ExpressAdapter } = require('ask-sdk-express-adapter');
const Alexa = require('ask-sdk-core');
const axios = require('axios');

const app = express();
app.use(express.json());

// Configuración
//const APPSCRIPT_URL = process.env.APPSCRIPT_URL;



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

 

  
  }

  // Manejar otros tipos de solicitud
  
  res.status(400).json({ error: "Solicitud no soportada" });

});

// Mapeo de intents a acciones



/*
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

const adapter = new ExpressAdapter(skillBuilder.create(), false, false);

app.post('/', adapter.getRequestHandlers());
*/
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});


/*



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
