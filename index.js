require('dotenv').config();
const express = require('express');
const { ExpressAdapter } = require('ask-sdk-express-adapter');
const Alexa = require('ask-sdk-core');
const axios = require('axios');

const app = express();
app.use(express.json());

// URL de tu AppScript (colócala en tu .env como APPSCRIPT_URL)
const APPSCRIPT_URL = process.env.APPSCRIPT_URL;

// Función helper para consultar tu AppScript
async function consultarAppscript(payload) {
    try {
        const response = await axios.post(APPSCRIPT_URL, payload, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    } catch (error) {
        console.error("Error al conectar con AppScript:", error.message);
        return null;
    }
}

// Handlers de intents
const ConsultarMedicamentoHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ConsultarMedicamento';
    },
    async handle(handlerInput) {
        const medicamento = handlerInput.requestEnvelope.request.intent.slots.medicamento.value;
        // Llama a Appscript
        const resultado = await consultarAppscript({
            intent: "ConsultarMedicamento",
            medicamento
        });
        const mensaje = resultado?.respuesta || `No pude encontrar información para ${medicamento}.`;
        return handlerInput.responseBuilder
            .speak(mensaje)
            .getResponse();
    }
};

const RegistrarTomaHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RegistrarToma';
    },
    async handle(handlerInput) {
        const medicamento = handlerInput.requestEnvelope.request.intent.slots.medicamento.value;
        // Llama a Appscript
        const resultado = await consultarAppscript({
            intent: "RegistrarToma",
            medicamento
        });
        const mensaje = resultado?.respuesta || `He registrado la toma de ${medicamento}. ¿Cuántas unidades tomaste?`;
        return handlerInput.responseBuilder
            .speak(mensaje)
            .addElicitSlotDirective('cantidad')
            .getResponse();
    }
};

const ConfirmarCantidadHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ConfirmarCantidad';
    },
    async handle(handlerInput) {
        const cantidad = handlerInput.requestEnvelope.request.intent.slots.cantidad.value;
        // Llama a Appscript
        const resultado = await consultarAppscript({
            intent: "ConfirmarCantidad",
            cantidad
        });
        const mensaje = resultado?.respuesta || `He registrado ${cantidad} unidades.`;
        return handlerInput.responseBuilder
            .speak(mensaje)
            .getResponse();
    }
};

const ConsultarAlertasHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ConsultarAlertas';
    },
    async handle(handlerInput) {
        // Llama a Appscript
        const resultado = await consultarAppscript({
            intent: "ConsultarAlertas"
        });
        const mensaje = resultado?.respuesta || "No hay alertas por el momento.";
        return handlerInput.responseBuilder
            .speak(mensaje)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const mensaje = "Puedes preguntarme por el inventario o registrar que tomaste un medicamento.";
        return handlerInput.responseBuilder
            .speak(mensaje)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (
                Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent'
            );
    },
    handle(handlerInput) {
        const mensaje = "Hasta luego.";
        return handlerInput.responseBuilder
            .speak(mensaje)
            .getResponse();
    }
};

const FallbackHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const mensaje = "Perdón, no entendí eso. ¿Puedes repetirlo?";
        return handlerInput.responseBuilder
            .speak(mensaje)
            .getResponse();
    }
};

// Skill builder
const skillBuilder = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        ConsultarMedicamentoHandler,
        RegistrarTomaHandler,
        ConfirmarCantidadHandler,
        ConsultarAlertasHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackHandler
    );

// Adaptador para Express
const adapter = new ExpressAdapter(skillBuilder.create(), false, false);

app.post('/', adapter.getRequestHandlers());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Alexa escuchando en puerto ${PORT}`);
});
