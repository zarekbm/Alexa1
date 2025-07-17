require('dotenv').config();
const express = require('express');
const { ExpressAdapter } = require('ask-sdk-express-adapter');
const Alexa = require('ask-sdk-core');
const axios = require('axios');

const app = express();
app.use(express.json());

// Configuración y mapeos
const INTENT_TO_ACTION_MAP = {
  'ConsultarMedicamento': 'consultar',
  'RegistrarToma': 'registrar_toma',
  'ConfirmarCantidad': 'registrar_toma',
  'ConsultarAlertas': 'consultar_alertas',
  'AgregarMedicamento': 'agregar_medicamento',
  'ActualizarStock': 'actualizar_stock',
  'ListarMedicamentos': 'listar_medicamentos'
};

const APPSCRIPT_URL = process.env.APPSCRIPT_URL;

// Función mejorada para comunicación con App Script
async function consultarAppscript(payload) {
  try {
    if (!payload.action) throw new Error('Acción no especificada');
    
    const response = await axios.post(APPSCRIPT_URL, payload, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.APPSCRIPT_TOKEN}` 
      },
      timeout: 8000
    });

    if (!response.data) throw new Error('Respuesta vacía del servidor');
    if (response.data.status === 'error') throw new Error(response.data.message);

    return response.data;
  } catch (error) {
    console.error("Error en consultarAppscript:", {
      error: error.message,
      payload: payload,
      url: APPSCRIPT_URL,
      stack: error.stack
    });
    
    return { 
      status: 'error',
      message: error.response?.data?.message || 'Error al comunicarse con el sistema de inventario',
      details: error.message
    };
  }
}

// Handlers actualizados
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speakOutput = 'Bienvenido al sistema de inventario de medicamentos. ' +
      'Puedes consultar o agregar medicamentos, registrar tomas, actualizar stock o revisar alertas. ' +
      '¿Qué deseas hacer?';
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
    
    if (!medicamento) {
      return handlerInput.responseBuilder
        .speak('No especificaste un medicamento. ¿Qué medicamento deseas consultar?')
        .addElicitSlotDirective('medicamento')
        .getResponse();
    }

    const resultado = await consultarAppscript({
      action: INTENT_TO_ACTION_MAP['ConsultarMedicamento'],
      medicamento: medicamento
    });
    
    return handlerInput.responseBuilder
      .speak(resultado.message || resultado.resumen)
      .getResponse();
  }
};

const AgregarMedicamentoHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AgregarMedicamento';
  },
  async handle(handlerInput) {
    const { intent } = handlerInput.requestEnvelope.request;
    const slots = intent.slots;
    
    // Validar datos mínimos
    if (!slots.nombre.value) {
      return handlerInput.responseBuilder
        .speak('¿Qué medicamento deseas agregar?')
        .addElicitSlotDirective('nombre')
        .getResponse();
    }
    
    if (!slots.cantidad.value) {
      return handlerInput.responseBuilder
        .speak(`¿Cuántas unidades de ${slots.nombre.value} ingresas?`)
        .addElicitSlotDirective('cantidad')
        .getResponse();
    }
    
    if (!slots.cantidadMinima.value) {
      return handlerInput.responseBuilder
        .speak(`¿Cuál es la cantidad mínima para ${slots.nombre.value}?`)
        .addElicitSlotDirective('cantidadMinima')
        .getResponse();
    }
    
    if (!slots.vencimiento.value) {
      return handlerInput.responseBuilder
        .speak(`¿Cuándo vence ${slots.nombre.value}? (por ejemplo: 2024-12-31)`)
        .addElicitSlotDirective('vencimiento')
        .getResponse();
    }
    
    // Construir payload
    const payload = {
      action: INTENT_TO_ACTION_MAP['AgregarMedicamento'],
      nombre: slots.nombre.value,
      cantidad: slots.cantidad.value,
      cantidadMinima: slots.cantidadMinima.value,
      vencimiento: slots.vencimiento.value,
      usuario: "Alexa"
    };
    
    // Campos opcionales
    if (slots.principioActivo.value) payload.principioActivo = slots.principioActivo.value;
    if (slots.presentacion.value) payload.presentacion = slots.presentacion.value;
    if (slots.lote.value) payload.lote = slots.lote.value;
    
    try {
      const resultado = await consultarAppscript(payload);
      return handlerInput.responseBuilder
        .speak(resultado.message)
        .getResponse();
    } catch (error) {
      return handlerInput.responseBuilder
        .speak(`Error al agregar medicamento: ${error.message}`)
        .getResponse();
    }
  }
};

const ActualizarStockHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ActualizarStock';
  },
  async handle(handlerInput) {
    const { slots } = handlerInput.requestEnvelope.request.intent;
    
    if (!slots.medicamento.value) {
      return handlerInput.responseBuilder
        .speak('¿Qué medicamento deseas actualizar?')
        .addElicitSlotDirective('medicamento')
        .getResponse();
    }
    
    if (!slots.cantidad.value) {
      return handlerInput.responseBuilder
        .speak(`¿A qué cantidad actualizamos ${slots.medicamento.value}?`)
        .addElicitSlotDirective('cantidad')
        .getResponse();
    }
    
    const payload = {
      action: INTENT_TO_ACTION_MAP['ActualizarStock'],
      medicamento: slots.medicamento.value,
      cantidad: slots.cantidad.value,
      motivo: slots.motivo?.value || "Ajuste por comando de voz",
      usuario: "Alexa"
    };
    
    try {
      const resultado = await consultarAppscript(payload);
      return handlerInput.responseBuilder
        .speak(resultado.message)
        .getResponse();
    } catch (error) {
      return handlerInput.responseBuilder
        .speak(`Error al actualizar stock: ${error.message}`)
        .getResponse();
    }
  }
};

// ... (otros handlers como RegistrarToma, ConfirmarCantidad, ConsultarAlertas se mantienen similares pero actualizados)

// Configuración final del Skill
const skillBuilder = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    ConsultarMedicamentoHandler,
    AgregarMedicamentoHandler,
    ActualizarStockHandler,
    RegistrarTomaHandler,
    ConfirmarCantidadHandler,
    ConsultarAlertasHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .withApiClient(new Alexa.DefaultApiClient())
  .withPersistenceAdapter(
    new Alexa.DynamoDbPersistenceAdapter({
      tableName: 'alexa_medicamentos_v2',
      createTable: true
    })
  );

const adapter = new ExpressAdapter(skillBuilder.create(), false, false);

app.post('/', adapter.getRequestHandlers());

// Endpoints adicionales
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    version: '2.0',
    timestamp: new Date().toISOString(),
    capabilities: ['consultar', 'agregar', 'actualizar', 'registrar', 'alertas']
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Alexa v2.0 ejecutándose en puerto ${PORT}`);
});
