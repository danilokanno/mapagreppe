import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './style.css'; 

// 1. Variáveis globais para armazenar os dados e a camada do mapa
let dadosDaPlanilha = {};
let geojsonLayer; 

// 2. Função para ler o seu arquivo Excel (CSV)
async function carregarPlanilha() {
    try {
        const resposta = await fetch('/dados.csv');
        const textoCsv = await resposta.text();
        
        const linhas = textoCsv.split('\n');
        
        for (let i = 1; i < linhas.length; i++) {
            const linha = linhas[i].trim();
            if (!linha) continue;

            const colunas = linha.split(';');
            const idIBGE = colunas[0]; 
            
            dadosDaPlanilha[idIBGE] = {
                populacao: colunas[2],
                privatizacao: colunas[3],
                escolas: colunas[4]
            };
        }
        console.log("Planilha carregada com sucesso!");
    } catch (erro) {
        console.error("Erro ao carregar a planilha dados.csv:", erro);
    }
}

// 3. Estilo base do mapa
function estiloPadrao(feature) {
    return {
        fillColor: '#70cbe9',
        weight: 1,            
        opacity: 1,           
        color: 'white',       
        fillOpacity: 1      
    };
}

// 4. Interações e cruzamento de dados (O "PROCV")
function interacoesPorMunicipio(feature, layer) {
    const nomeMunicipio = feature.properties.name;
    const codigoIBGE = feature.properties.id; 
    
    const dados = dadosDaPlanilha[codigoIBGE] || { 
        populacao: "Sem dados", 
        privatizacao: "Sem dados", 
        escolas: "Sem dados" 
    };
    
    let popFormatada = dados.populacao;
    if (popFormatada !== "Sem dados" && !isNaN(popFormatada)) {
        popFormatada = Number(popFormatada).toLocaleString('pt-BR');
    }
    
    const conteudoPopup = `
        <div style="min-width: 200px;">
            <h3 style="color: #333; margin-bottom: 5px; font-size: 15px;">${nomeMunicipio}</h3>
            <p style="margin: 5px 0; font-size: 12px; color: #666;"><strong>Cód. IBGE:</strong> ${codigoIBGE}</p>
            
            <hr style="border: 0; border-top: 1px solid #ccc; margin: 10px 0;">
            
            <p style="margin: 5px 0; font-size: 13px; color: #333;"><strong>Dados Demográficos:</strong></p>
            <p style="margin: 5px 0; font-size: 12px; color: #555;">
                População (2022): <span style="color:#70cbe9; font-weight:bold;">${popFormatada}</span>
            </p>

            <hr style="border: 0; border-top: 1px solid #ccc; margin: 10px 0;">

            <p style="margin: 5px 0; font-size: 13px; color: #333;"><strong>Dados da Pesquisa:</strong></p>
            <p style="margin: 5px 0; font-size: 12px; color: #555;">Nível de Privatização: <strong>${dados.privatizacao}</strong></p>
            <p style="margin: 5px 0; font-size: 12px; color: #555;">Qtd. Escolas: <strong>${dados.escolas}</strong></p>
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
            // CORREÇÃO: Aplica forçadamente o estilo padrão de volta em vez de buscar o histórico
            e.target.setStyle(estiloPadrao(feature));
        }
    });
}

// 5. Função mestre que inicia tudo na ordem certa
async function iniciarMapa() {
    await carregarPlanilha();

    const map = L.map('mapa', {
        zoomSnap: 0.5,
        zoomDelta: 0.5
    }).setView([-22.2, -48.5], 7.2);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors © CARTO'
    }).addTo(map);

    const urlGeoJsonSP = 'https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-35-mun.json';
    
    fetch(urlGeoJsonSP)
        .then(response => response.json())
        .then(data => {
            // O geojsonLayer agora é global, facilitando manipulações futuras
            geojsonLayer = L.geoJSON(data, {
                style: estiloPadrao,
                onEachFeature: interacoesPorMunicipio
            }).addTo(map);
        })
        .catch(error => console.error("Erro ao carregar o mapa:", error));
}

iniciarMapa();

// ==========================================================
// FUNÇÕES DOS MODAIS (CAIXAS FLUTUANTES)
// ==========================================================
window.abrirModal = function(idModal) {
    document.getElementById(idModal).style.display = 'block';
};

window.fecharModal = function(idModal) {
    document.getElementById(idModal).style.display = 'none';
};