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

// --- NOVO: BUSCA DE DADOS DO IBGE (CENSO 2022) ---
let populacaoMunicipios = {};

// Conecta na API oficial do IBGE para buscar a população de SP
fetch('https://servicodados.ibge.gov.br/api/v3/agregados/9514/periodos/2022/variaveis/93?localidades=N6[N3[35]]')
    .then(response => response.json())
    .then(data => {
        if(data[0] && data[0].resultados[0].series) {
            data[0].resultados[0].series.forEach(serie => {
                // Guarda a população usando o Código IBGE como chave
                populacaoMunicipios[serie.localidade.id] = serie.serie['2022'];
            });
        }
    })
    .catch(error => console.error("Erro ao buscar dados do Censo IBGE:", error));
// --------------------------------------------------

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
    
    // NOVO: Verifica se a API do IBGE já retornou a população, senão avisa que está carregando
    const populacao = populacaoMunicipios[codigoIBGE];
    const populacaoFormatada = populacao ? parseInt(populacao).toLocaleString('pt-BR') : 'Carregando...';
    
    const conteudoPopup = `
        <div style="min-width: 180px;">
            <h3 style="color: #333; margin-bottom: 5px; font-size: 15px;">${nomeMunicipio}</h3>
            <p style="margin: 5px 0; font-size: 12px; color: #666;"><strong>Cód. IBGE:</strong> ${codigoIBGE}</p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;"><strong>População (2022):</strong> ${populacaoFormatada} hab.</p>
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

// --- NOVO: LÓGICA DOS BOTÕES E MODAIS ---
const configModais = {
    'btn-membros': 'modal-membros',
    'btn-producoes': 'modal-producoes',
    'btn-historia': 'modal-historia'
};

// Faz um "loop" para ativar cada um dos 3 botões
Object.keys(configModais).forEach(btnId => {
    const btn = document.getElementById(btnId);
    const modal = document.getElementById(configModais[btnId]);
    const closeBtn = modal.querySelector('.close-btn');

    // Ao clicar no botão, a janela aparece
    btn.addEventListener('click', () => {
        modal.style.display = 'flex';
    });

    // Ao clicar no 'X', a janela some
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Ao clicar fora da janela (no fundo escuro), a janela some
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});