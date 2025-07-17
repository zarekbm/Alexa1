require('dotenv').config();
const express = require('express');
const { ExpressAdapter } = require('ask-sdk-express-adapter');
const Alexa = require('ask-sdk-core');
const axios = require('axios');

const app = express();
app.use(express.json());

const APPSCRIPT_URL = process.env.APPSCRIPT_URL;

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

const ConsultarMedicamentoHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ConsultarMedicamento';
    },
    async handle(handlerInput) {
        const medicamento = handlerInput.requestEnvelope.request.intent.slots.medicamento.value;
        const resultado = await consultarAppscript({
            action: "consultar",
            medicamento
        });
        const mensaje = resultado?.message || `No pude encontrar información para ${medicamento}.`;
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
        const resultado = await consultarAppscript({
            action: "registrar_toma",
            medicamento,
            cantidad: 1, // Puedes mejorar esto preguntando la cantidad después
            usuario: "Alexa"
        });
        const mensaje = resultado?.message || `He registrado la toma de ${medicamento}. ¿Cuántas unidades tomaste?`;
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
        // Para este intent necesitas también el medicamento, deberías almacenarlo en sessionAttributes
        const cantidad = handlerInput.requestEnvelope.request.intent.slots.cantidad.value;
        // Recupera el medicamento de los sessionAttributes (puedes mejorar esto)
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const medicamento = sessionAttributes.medicamento || "el medicamento";
        const resultado = await consultarAppscript({
            action: "registrar_toma",
            medicamento,
            cantidad,
            usuario: "Alexa"
        });
        const mensaje = resultado?.message || `He registrado ${cantidad} unidades de ${medicamento}.`;
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
        const resultado = await consultarAppscript({
            action: "consultar_alertas"
        });
        let mensaje;
        if (resultado?.alertas && resultado.alertas.length > 0) {
            mensaje = "Alertas activas: ";
            resultado.alertas.forEach(a => {
                mensaje += `${a.tipo} de ${a.medicamento}: ${a.detalle}. `;
            });
        } else {
            mensaje = "No hay alertas por el momento.";
        }
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

const adapter = new ExpressAdapter(skillBuilder.create(), false, false);

app.post('/', adapter.getRequestHandlers());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Alexa escuchando en puerto ${PORT}`);
});
