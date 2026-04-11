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
        renderizarFilmes(dados.emCartaz[datasDisponiveis[0]], datasDisponiveis[0]);
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

    const agora = new Date();
    const fusoBrasilia = new Date(agora.getTime() - (3 * 60 * 60 * 1000));
    const hojeStr = fusoBrasilia.getUTCDate().toString().padStart(2, '0') + '/' + (fusoBrasilia.getUTCMonth() + 1).toString().padStart(2, '0');

    for (let i = 0; i < datas.length; i++) {
        const infoData = formatarDataParaBotao(datas[i]);
        const ehHoje = datas[i] === hojeStr;
        const btn = document.createElement('button');
        btn.className = 'btn-data';
        if (i === 0) {
            btn.classList.add('ativo');
        }

        btn.innerHTML = `
            <span class="mes">${infoData.mes}</span>
            <span class="dia">${infoData.dia}</span>
            <span class="semana${ehHoje ? ' hoje' : ''}">${ehHoje ? 'HOJE' : infoData.semana}</span>
        `;
        
        btn.onclick = function() {
            const botoes = document.querySelectorAll('.btn-data');
            for (let j = 0; j < botoes.length; j++) {
                botoes[j].classList.remove('ativo');
            }
            this.classList.add('ativo');
            renderizarFilmes(emCartaz[datas[i]], datas[i]);
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

function renderizarFilmes(filmesDoDia, dataSelecionada) {
    const container = document.getElementById('lista-filmes');
    container.innerHTML = '';

    const agora = new Date();
    const brStr = agora.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false });
    const hojeStr = agora.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' });
    const ehHoje = dataSelecionada === hojeStr;

    for (let i = 0; i < filmesDoDia.length; i++) {
        const filme = filmesDoDia[i];
        const ratingClass = obterClasseRating(filme.classificacao);
        const card = document.createElement('div');
        card.className = 'filme-card';
        card.style.animationDelay = (i * 0.08) + 's';

        let htmlSessoes = '';
        for (let k = 0; k < filme.sessoes.length; k++) {
            const sessao = filme.sessoes[k];
            let badgesHorarios = '';
            const listaHorarios = sessao.horarios.split(', ');
            for (let j = 0; j < listaHorarios.length; j++) {
                const expirado = ehHoje && listaHorarios[j].match(/^\d{2}:\d{2}$/) && listaHorarios[j] < brStr;
                badgesHorarios += '<span class="horario-badge' + (expirado ? ' expirado' : '') + '">' + listaHorarios[j] + '</span>';
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