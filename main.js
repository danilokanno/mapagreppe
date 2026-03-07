import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './style.css'; 

let dadosDaPlanilha = {};
let geojsonLayer; 
let modoColoracao = 'padrao'; 

function obterCorPopulacao(populacao) {
    if (populacao === "Sem dados" || isNaN(populacao)) return '#cccccc'; 
    
    const pop = Number(populacao);
    
    if (pop <= 10000) return '#edf8fb';       
    if (pop <= 50000) return '#b2e2e2';       
    if (pop <= 100000) return '#66c2a4';      
    if (pop <= 500000) return '#2ca25f';      
    return '#006d2c';                         
}

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

function estiloDoMapa(feature) {
    const codigoIBGE = feature.properties.id;
    const dados = dadosDaPlanilha[codigoIBGE];
    const pop = dados ? dados.populacao : "Sem dados";
    
    let corDeFundo = '#70cbe9'; 
    if (modoColoracao === 'populacao') {
        corDeFundo = obterCorPopulacao(pop);
    }

    return {
        fillColor: corDeFundo,
        weight: 1,            
        opacity: 1,           
        color: 'white',       
        fillOpacity: 1      
    };
}

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
    layer.bindTooltip(nomeMunicipio, { sticky: true, direction: 'auto' });

    layer.on({
        mouseover: (e) => {
            const munLayer = e.target;
            munLayer.setStyle({ weight: 3, color: '#333', fillOpacity: 1 });
            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                munLayer.bringToFront();
            }
        },
        mouseout: (e) => {
            geojsonLayer.resetStyle(e.target);
        }
    });
}

async function iniciarMapa() {
    await carregarPlanilha();

    const map = L.map('mapa', { zoomSnap: 0.5, zoomDelta: 0.5 }).setView([-22.2, -48.5], 7.2);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
        maxZoom: 19, attribution: '© OpenStreetMap contributors © CARTO'
    }).addTo(map);

    const urlGeoJsonSP = 'https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-35-mun.json';
    
    fetch(urlGeoJsonSP)
        .then(response => response.json())
        .then(data => {
            geojsonLayer = L.geoJSON(data, {
                style: estiloDoMapa, 
                onEachFeature: interacoesPorMunicipio
            }).addTo(map);
        })
        .catch(error => console.error("Erro ao carregar o mapa:", error));
}

iniciarMapa();

window.abrirModal = function(idModal) { document.getElementById(idModal).style.display = 'block'; };
window.fecharModal = function(idModal) { document.getElementById(idModal).style.display = 'none'; };

window.alternarColoracao = function() {
    const btn = document.getElementById('btn-colorir');
    const legenda = document.getElementById('legenda-mapa');

    if (modoColoracao === 'padrao') {
        modoColoracao = 'populacao';
        btn.innerText = 'Remover Cores da População';
        btn.style.backgroundColor = '#b2e2e2'; 
        legenda.style.display = 'block';       
    } else {
        modoColoracao = 'padrao';
        btn.innerText = 'Colorir por População';
        btn.style.backgroundColor = '#fff';    
        legenda.style.display = 'none';        
    }
    
    geojsonLayer.setStyle(estiloDoMapa);
};