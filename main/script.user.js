// ==UserScript==
// @name         Google GenAI - Método Directo (API Fetch)
// @namespace    http://tampermonkey.net/
// @version      4.4.1
// @description  Se conecta a la API de Gemini directamente usando GM_xmlhttpRequest, sin la biblioteca @google/genai.
// @author       TuNombre
// @match        https://git.*
// @include      */issues/*
// @connect      googleapis.com
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @updateURL    https://github.com/FlJesusLorenzo/prueba_imputar_ia/raw/refs/heads/main/main/script.user.js
// @downloadURL  https://github.com/FlJesusLorenzo/prueba_imputar_ia/raw/refs/heads/main/main/script.user.js
// ==/UserScript==

(function() {
    'use strict';
    if (!GM_getValue("API_KEY")){
        GM_setValue("API_KEY", prompt("Agregar clave API"))
    }
    const API_KEY = GM_getValue("API_KEY");
    window.addEventListener('load', function() {
        // Selecciona el elemento donde quieres añadir el botón
        const sidebar = document.querySelector('.issuable-sidebar-header div[data-testid="sidebar-todo"]');
        if (sidebar) {
            // Crea el botón
            const button = document.createElement('button');
            button.classList.add('btn', 'hide-collapsed', 'btn-default', 'btn-sm', 'gl-button');
            const span = document.createElement('span');
            span.innerText = 'Imputación por IA';
            button.appendChild(span);
            // Añade un evento al botón para enviar la URL
            button.addEventListener('click', function() {
                gen_ia_description()
            });
            // Añade el botón al sidebar
            sidebar.appendChild(button);
        }
    });

    function gen_ia_description(){
        let issue_desc = document.querySelector(".detail-page-description").textContent
        let day = new Date
        let comments = document.getElementById("notes-list").textContent
        let user = document.getElementById("disclosure-6").getElementsByClassName("gl-font-bold")[0].textContent

        // El texto que quieres enviar a la IA
        const promptText = `
Actúa como un desarrollador de software que debe resumir su trabajo del día para una imputación de horas. Tu objetivo es crear una descripción breve pero clara, basada únicamente en la actividad de hoy.
**Día**: ${day}
**Usuario**: ${user}

**Contexto de la Tarea:**
${issue_desc}

**Actividad Realizada Hoy:**

*   **Comentarios:**
${comments}

**Instrucciones para la Generación:**

Genera una descripción para la imputación de horas que cumpla estos requisitos:
1.  **Breve:** No más de dos frases.
2.  **Descriptiva:** Debe quedar claro qué se ha hecho y cuál ha sido el progreso.
3.  **Enfocada:** Céntrate solo en la "Actividad Realizada Hoy y los comentarios del usuario, en caso de que el usuario no haya realizado ningun comentario o ningun movimiento sobre la tarea deberás mostrar un mensaje de que no se puede imputar sobre una tarea en la que no has generado comentario o movimiento".`;

        // Comprobación de que la clave fue editada
        if (!API_KEY || API_KEY === "AIzaSy...") {
            alert("ERROR: Por favor, edita el script y pon tu clave de API real.");
            return;
        }

        console.log("Iniciando petición directa a la API de Gemini...");

        // Usamos GM_xmlhttpRequest para la petición
        GM_xmlhttpRequest({
            method: "POST",
            url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
            headers: {
                "Content-Type": "application/json"
            },
            data: JSON.stringify({
                "contents": [{
                    "parts": [{
                        "text": promptText
                    }]
                }]
            }),
            onload: function(response) {
                if (response.status >= 200 && response.status < 300) {
                    try {
                        const data = JSON.parse(response.responseText);
                        // Navegamos de forma segura por la respuesta para encontrar el texto
                        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

                        if (text) {
                            console.log("Respuesta recibida:", text);
                            alert(`¡FUNCIONÓ!\n\nRespuesta de Gemini:\n${text.trim()}`);
                        } else {
                            console.error("La respuesta de la API no tuvo el formato esperado:", data);
                            alert("Se recibió una respuesta de la API, pero no contenía texto. Revisa la consola.");
                        }
                    } catch (e) {
                        console.error("Error al parsear la respuesta JSON:", e);
                        alert("No se pudo procesar la respuesta del servidor. Revisa la consola.");
                    }
                } else {
                    console.error("La API devolvió un error:", response.status, response.responseText);
                    alert(`Error de la API: ${response.status}. Revisa la consola para más detalles.`);
                }
            },
            onerror: function(response) {
                console.error("Error de red o de conexión:", response);
                alert("No se pudo conectar con la API de Gemini. Revisa tu conexión a internet o la consola.");
            }
        });
    }
})();
