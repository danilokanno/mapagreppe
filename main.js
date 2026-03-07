import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './style.css'; 

const map = L.map('mapa', {
    zoomSnap: 0.5,
    zoomDelta: 0.5
}).setView([-22.2, -48.5], 7.2);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors © CARTO'
}).addTo(map);

const urlGeoJsonSP = 'https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-35-mun.json';
let geojsonLayer;

function estiloPadrao(feature) {
    return {
        fillColor: '#70cbe9',
        weight: 1,            
        opacity: 1,           
        color: 'white',       
        fillOpacity: 1      
    };
}

function interacoesPorMunicipio(feature, layer) {
    
    const nomeMunicipio = feature.properties.name;
    const codigoIBGE = feature.properties.id; 
    
    // Popup agora tem o espaço exato para os dados demográficos
    const conteudoPopup = `
        <div style="min-width: 200px;">
            <h3 style="color: #333; margin-bottom: 5px; font-size: 15px;">${nomeMunicipio}</h3>
            <p style="margin: 5px 0; font-size: 12px; color: #666;"><strong>Cód. IBGE:</strong> ${codigoIBGE}</p>
            
            <hr style="border: 0; border-top: 1px solid #ccc; margin: 10px 0;">
            
            <p style="margin: 5px 0; font-size: 13px; color: #333;"><strong>Dados Demográficos:</strong></p>
            <p style="margin: 5px 0; font-size: 12px; color: #555;">
                População (2022): <span style="color:#70cbe9; font-weight:bold;">Aguardando dados...</span>
            </p>

            <hr style="border: 0; border-top: 1px solid #ccc; margin: 10px 0;">

            <p style="margin: 5px 0; font-size: 13px; color: #333;"><strong>Dados da Pesquisa:</strong></p>
            <p style="margin: 5px 0; font-size: 12px; font-style: italic; color: #888;">
                (As variáveis da sua planilha aparecerão aqui futuramente)
            </p>
        </div>
    `;

    layer.bindPopup(conteudoPopup);

    layer.bindTooltip(nomeMunicipio, {
        sticky: true,
        direction: 'auto'
    });

    layer.on({
        mouseover: (e) => {
            const munLayer = e.target;
            munLayer.setStyle({ 
                weight: 3,       
                color: '#333', 
                fillOpacity: 1 
            });
            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                munLayer.bringToFront();
            }
        },
        mouseout: (e) => {
            geojsonLayer.resetStyle(e.target);
        }
    });
}

fetch(urlGeoJsonSP)
    .then(response => response.json())
    .then(data => {
        geojsonLayer = L.geoJSON(data, {
            style: estiloPadrao,
            onEachFeature: interacoesPorMunicipio
        }).addTo(map);
    })
    .catch(error => console.error("Erro ao carregar o mapa:", error));

// ==========================================================
// FUNÇÕES PARA ABRIR E FECHAR OS MODAIS (CAIXAS FLUTUANTES)
// ==========================================================
window.abrirModal = function(idModal) {
    document.getElementById(idModal).style.display = 'block';
};

window.fecharModal = function(idModal) {
    document.getElementById(idModal).style.display = 'none';
};