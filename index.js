{
    "interactionModel": {
        "languageModel": {
            "invocationName": "inventario medicamentos",
            "intents": [
                {
                    "name": "ConsultarMedicamento",
                    "slots": [
                        {
                            "name": "medicamento",
                            "type": "AMAZON.SearchQuery"
                        }
                    ],
                    "samples": [
                        "consultar {medicamento}",
                        "cuánto tengo de {medicamento}",
                        "ver stock de {medicamento}",
                        "revisar {medicamento}",
                        "dónde está {medicamento}",
                        "qué cantidad hay de {medicamento}",
                        "información de {medicamento}",
                        "estado de {medicamento}"
                    ]
                },
                {
                    "name": "RegistrarToma",
                    "slots": [
                        {
                            "name": "medicamento",
                            "type": "AMAZON.SearchQuery"
                        }
                    ],
                    "samples": [
                        "tomé {medicamento}",
                        "consumí {medicamento}",
                        "registrar toma de {medicamento}",
                        "usé {medicamento}",
                        "voy a tomar {medicamento}"
                    ]
                },
                {
                    "name": "ConfirmarCantidad",
                    "slots": [
                        {
                            "name": "cantidad",
                            "type": "AMAZON.NUMBER"
                        }
                    ],
                    "samples": [
                        "fueron {cantidad}",
                        "cantidad {cantidad}",
                        "tome {cantidad}",
                        "{cantidad} unidades",
                        "solo {cantidad}"
                    ]
                },
                {
                    "name": "ConsultarAlertas",
                    "slots": [],
                    "samples": [
                        "revisar alertas",
                        "qué medicamentos están por vencer",
                        "hay medicamentos vencidos",
                        "necesito comprar algo",
                        "qué medicamentos faltan",
                        "medicamentos con stock bajo",
                        "ver vencimientos"
                    ]
                },
                {
                    "name": "AMAZON.HelpIntent",
                    "samples": []
                },
                {
                    "name": "AMAZON.StopIntent",
                    "samples": []
                },
                {
                    "name": "AMAZON.CancelIntent",
                    "samples": []
                },
                {
                    "name": "AMAZON.NavigateHomeIntent",
                    "samples": []
                }
            ],
            "types": []
        },
        "dialog": {
            "intents": [
                {
                    "name": "RegistrarToma",
                    "delegationStrategy": "ALWAYS",
                    "confirmationRequired": false,
                    "prompts": {},
                    "slots": [
                        {
                            "name": "medicamento",
                            "type": "AMAZON.SearchQuery",
                            "confirmationRequired": false,
                            "elicitationRequired": true,
                            "prompts": {
                                "elicitation": "Elicit.RegistrarToma.medicamento"
                            }
                        }
                    ]
                },
                {
                    "name": "ConfirmarCantidad",
                    "delegationStrategy": "ALWAYS",
                    "confirmationRequired": false,
                    "prompts": {},
                    "slots": [
                        {
                            "name": "cantidad",
                            "type": "AMAZON.NUMBER",
                            "confirmationRequired": false,
                            "elicitationRequired": true,
                            "prompts": {
                                "elicitation": "Elicit.ConfirmarCantidad.cantidad"
                            }
                        }
                    ]
                }
            ],
            "delegationStrategy": "SKILL_RESPONSE"
        },
        "prompts": [
            {
                "id": "Elicit.RegistrarToma.medicamento",
                "variations": [
                    {
                        "type": "PlainText",
                        "value": "¿Qué medicamento tomaste?"
                    },
                    {
                        "type": "PlainText",
                        "value": "Dime el nombre del medicamento que consumiste"
                    }
                ]
            },
            {
                "id": "Elicit.ConfirmarCantidad.cantidad",
                "variations": [
                    {
                        "type": "PlainText",
                        "value": "¿Cuántas unidades tomaste?"
                    },
                    {
                        "type": "PlainText",
                        "value": "Dime la cantidad que consumiste"
                    }
                ]
            },
            {
                "id": "Confirm.RegistrarToma.medicamento",
                "variations": [
                    {
                        "type": "PlainText",
                        "value": "Voy a registrar que tomaste {medicamento}. ¿Es correcto?"
                    }
                ]
            },
            {
                "id": "Confirm.ConfirmarCantidad.cantidad",
                "variations": [
                    {
                        "type": "PlainText",
                        "value": "Voy a registrar {cantidad} unidades. ¿Confirmas?"
                    }
                ]
            }
        ]
    }
}
