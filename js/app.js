async function iniciarApp() {
    const resposta = await fetch('filmes.json');
    const dados = await resposta.json();
    
    const elementoAtualizacao = document.getElementById('data-atualizacao');
    if (elementoAtualizacao && dados.ultimaAtualizacao) {
        elementoAtualizacao.textContent = `Atualizado em: ${dados.ultimaAtualizacao}`;
    }

    const datasDisponiveis = Object.keys(dados.emCartaz);
    if (datasDisponiveis.length > 0) {
        document.getElementById('seletor-datas').style.display = 'flex';
        document.getElementById('btn-compartilhar').style.display = 'block';
        renderizarSeletorDatas(datasDisponiveis, dados.emCartaz);
        renderizarFilmes(dados.emCartaz[datasDisponiveis[0]]);
        configurarBotaoCompartilhar(dados.emCartaz, datasDisponiveis[0]);
    }
}

function formatarDataParaBotao(dataString) {
    const partes = dataString.split('/');
    const dia = partes[0];
    const mesNum = parseInt(partes[1], 10) - 1;
    const ano = new Date().getFullYear();
    const dataObjeto = new Date(ano, mesNum, dia);
    
    const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const diasSemana = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
    
    return {
        mes: meses[dataObjeto.getMonth()],
        dia: dia,
        semana: diasSemana[dataObjeto.getDay()]
    };
}

function renderizarSeletorDatas(datas, emCartaz) {
    const seletor = document.getElementById('seletor-datas');
    seletor.innerHTML = '';

    for (let i = 0; i < datas.length; i++) {
        const infoData = formatarDataParaBotao(datas[i]);
        const btn = document.createElement('button');
        btn.className = 'btn-data';
        if (i === 0) {
            btn.classList.add('ativo');
        }
        
        btn.innerHTML = `
            <span class="mes">${infoData.mes}</span>
            <span class="dia">${infoData.dia}</span>
            <span class="semana">${infoData.semana}</span>
        `;
        
        btn.onclick = function() {
            const botoes = document.querySelectorAll('.btn-data');
            for (let j = 0; j < botoes.length; j++) {
                botoes[j].classList.remove('ativo');
            }
            this.classList.add('ativo');
            renderizarFilmes(emCartaz[datas[i]]);
            configurarBotaoCompartilhar(emCartaz, datas[i]);
        };
        seletor.appendChild(btn);
    }
}

function obterClasseRating(classificacao) {
    if (!classificacao) {
        return 'rating-L';
    }
    const idade = classificacao.toString().toUpperCase().replace(/[^0-9L]/g, '');
    return `rating-${idade}`;
}

function renderizarFilmes(filmesDoDia) {
    const container = document.getElementById('lista-filmes');
    container.innerHTML = '';

    for (let i = 0; i < filmesDoDia.length; i++) {
        const filme = filmesDoDia[i];
        const ratingClass = obterClasseRating(filme.classificacao); 
        const card = document.createElement('div');
        card.className = 'filme-card';
        
        let htmlSessoes = '';
        for (let k = 0; k < filme.sessoes.length; k++) {
            const sessao = filme.sessoes[k];
            let badgesHorarios = '';
            const listaHorarios = sessao.horarios.split(', ');
            for (let j = 0; j < listaHorarios.length; j++) {
                badgesHorarios += '<span class="horario-badge">' + listaHorarios[j] + '</span>';
            }
            htmlSessoes += `
                <div class="grupo-sessao" style="margin-bottom: 12px;">
                    <div style="margin-bottom: 8px;">
                        <span class="tag-formato">${sessao.formato}</span>
                    </div>
                    <div class="horarios">${badgesHorarios}</div>
                </div>
            `;
        }

        card.innerHTML = `
            <img src="${filme.imagem}" alt="Pôster" class="filme-poster">
            <div class="filme-info">
                <h2>${filme.titulo}</h2>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                    <span class="tag-classificacao ${ratingClass}">${filme.classificacao}</span>
                    <span class="detalhes" style="margin: 0;">${filme.genero ? filme.genero + ' | ' : ''}${filme.duracao}</span>
                </div>
                <div class="sessoes-container">
                    ${htmlSessoes}
                </div>
            </div>
        `;
        container.appendChild(card);
    }
}

function configurarBotaoCompartilhar(emCartaz, dataAtiva) {
    const btn = document.getElementById('btn-compartilhar');
    
    btn.onclick = function() {
        const filmes = emCartaz[dataAtiva];
        let texto = "*Em cartaz (" + dataAtiva + ") em Itabaiana:*\n\n";
        
        for (let i = 0; i < filmes.length; i++) {
            const f = filmes[i];
            texto += "*" + f.titulo + "*\n";
            texto += (f.genero ? f.genero + " | " : "") + f.duracao + "\n";
            for (let k = 0; k < f.sessoes.length; k++) {
                texto += "- " + f.sessoes[k].formato + ": " + f.sessoes[k].horarios + "\n";
            }
            texto += "\n";
        }

        const link = "https://wa.me/?text=" + encodeURIComponent(texto);
        window.open(link, "_blank");
    };
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw.js');
    });
}

iniciarApp();