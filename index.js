require('dotenv').config();
const express = require('express');
const { ExpressAdapter } = require('ask-sdk-express-adapter');
const Alexa = require('ask-sdk-core');
const axios = require('axios');

const app = express();
app.use(express.json());

// Configuración
const INTENT_TO_ACTION_MAP = {
  'ConsultarMedicamento': 'consultar',
  'RegistrarToma': 'registrar_toma',
  'ConfirmarCantidad': 'registrar_toma',
  'ConsultarAlertas': 'consultar_alertas',
  'AgregarMedicamento': 'agregar_medicamento',
  'ActualizarStock': 'actualizar_stock'
};

const APPSCRIPT_URL = process.env.APPSCRIPT_URL;

// Función para comunicarse con Google Apps Script
async function consultarAppscript(payload) {
  try {
    const response = await axios.post(APPSCRIPT_URL, payload, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.APPSCRIPT_TOKEN}`
      },
      timeout: 8000
    });
    return response.data;
  } catch (error) {
    console.error("Error:", error.message);
    return { 
      status: 'error',
      message: 'Error al conectar con el inventario'
    };
  }
}

// Handlers de Alexa
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speakOutput = 'Bienvenido al inventario de medicamentos. Puedes consultar, agregar o actualizar medicamentos.';
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

const ConsultarMedicamentoHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ConsultarMedicamento';
  },
  async handle(handlerInput) {
    const medicamento = handlerInput.requestEnvelope.request.intent.slots.medicamento.value;
    const resultado = await consultarAppscript({
      action: 'consultar',
      medicamento
    });
    return handlerInput.responseBuilder
      .speak(resultado.message || 'No se encontró el medicamento')
      .getResponse();
  }
};

const AgregarMedicamentoHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AgregarMedicamento';
  },
  async handle(handlerInput) {
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const resultado = await consultarAppscript({
      action: 'agregar_medicamento',
      nombre: slots.nombre.value,
      cantidad: slots.cantidad.value,
      cantidadMinima: slots.cantidadMinima.value,
      vencimiento: slots.vencimiento.value
    });
    return handlerInput.responseBuilder
      .speak(resultado.message)
      .getResponse();
  }
};

// ... (otros handlers similares para ActualizarStock, RegistrarToma, etc.)

const skillBuilder = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    ConsultarMedicamentoHandler,
    AgregarMedicamentoHandler,
    // ... otros handlers
  )
  .withApiClient(new Alexa.DefaultApiClient());

const adapter = new ExpressAdapter(skillBuilder.create(), false, false);

app.post('/', adapter.getRequestHandlers());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});
