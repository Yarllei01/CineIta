async function iniciarApp() {
    const resposta = await fetch('filmes.json');
    const dados = await resposta.json();
    
    const abas = document.querySelectorAll('.aba');
    for (let i = 0; i < abas.length; i++) {
        abas[i].onclick = function() {
            for (let j = 0; j < abas.length; j++) {
                abas[j].classList.remove('ativa');
            }
            this.classList.add('ativa');
            
            if (this.id === 'aba-cartaz') {
                document.getElementById('seletor-datas').style.display = 'flex';
                document.getElementById('btn-compartilhar').style.display = 'block';
                const datasDisponiveis = Object.keys(dados.emCartaz);
                if (datasDisponiveis.length > 0) {
                    renderizarSeletorDatas(datasDisponiveis, dados.emCartaz);
                    renderizarFilmes(dados.emCartaz[datasDisponiveis[0]]);
                    configurarBotaoCompartilhar(dados.emCartaz, datasDisponiveis[0]);
                }
            } else {
                document.getElementById('seletor-datas').style.display = 'none';
                document.getElementById('btn-compartilhar').style.display = 'none';
                renderizarEmBreve(dados.emBreve);
            }
        };
    }

    const datasDisponiveis = Object.keys(dados.emCartaz);
    if (datasDisponiveis.length > 0) {
        renderizarSeletorDatas(datasDisponiveis, dados.emCartaz);
        renderizarFilmes(dados.emCartaz[datasDisponiveis[0]]);
        configurarBotaoCompartilhar(dados.emCartaz, datasDisponiveis[0]);
    }
}

function renderizarSeletorDatas(datas, emCartaz) {
    const seletor = document.getElementById('seletor-datas');
    seletor.innerHTML = '';

    for (let i = 0; i < datas.length; i++) {
        const btn = document.createElement('button');
        btn.className = 'btn-data';
        if (i === 0) {
            btn.classList.add('ativo');
        }
        btn.textContent = datas[i];
        
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

function renderizarFilmes(filmesDoDia) {
    const container = document.getElementById('lista-filmes');
    container.innerHTML = '';

    for (let i = 0; i < filmesDoDia.length; i++) {
        const filme = filmesDoDia[i];
        const card = document.createElement('div');
        card.className = 'filme-card';
        
        let badgesHorarios = '';
        const listaHorarios = filme.horarios.split(', ');
        for (let j = 0; j < listaHorarios.length; j++) {
            badgesHorarios += '<span class="horario-badge">' + listaHorarios[j] + '</span>';
        }

        card.innerHTML = `
            <img src="${filme.imagem}" alt="Pôster" class="filme-poster">
            <div class="filme-info">
                <h2>${filme.titulo}</h2>
                <p class="detalhes">${filme.duracao} | ${filme.genero}</p>
                <p class="formato-classificacao">
                    <span class="tag-formato">${filme.formato}</span>
                    <span class="tag-classificacao">${filme.classificacao}</span>
                </p>
                <div class="horarios">${badgesHorarios}</div>
            </div>
        `;
        container.appendChild(card);
    }
}

function renderizarEmBreve(filmesBreve) {
    const container = document.getElementById('lista-filmes');
    container.innerHTML = '';

    for (let i = 0; i < filmesBreve.length; i++) {
        const filme = filmesBreve[i];
        const card = document.createElement('div');
        card.className = 'filme-card';
        
        card.innerHTML = `
            <div class="filme-info">
                <h2>${filme.titulo}</h2>
                <p class="detalhes">${filme.genero}</p>
            </div>
        `;
        container.appendChild(card);
    }
}

function configurarBotaoCompartilhar(emCartaz, dataAtiva) {
    const btn = document.getElementById('btn-compartilhar');
    
    btn.onclick = function() {
        const filmes = emCartaz[dataAtiva];
        let texto = "🎬 *Em cartaz (" + dataAtiva + ") em Itabaiana:*\n\n";
        
        for (let i = 0; i < filmes.length; i++) {
            const f = filmes[i];
            texto += "*" + f.titulo + "* (" + f.duracao + ")\n";
            texto += "-" + f.genero + "-\n";
            texto += "- " + f.horarios + "\n\n";
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