async function iniciarApp() {
    const resposta = await fetch('filmes.json');
    const dados = await resposta.json();
    
    const datasDisponiveis = Object.keys(dados.emCartaz);
    const dataInicial = datasDisponiveis[0];

    renderizarSeletorDatas(datasDisponiveis, dados.emCartaz);
    renderizarFilmes(dados.emCartaz[dataInicial]);
    configurarBotaoCompartilhar(dados.emCartaz, dataInicial);
}

function renderizarSeletorDatas(datas, emCartaz) {
    const seletor = document.getElementById('seletor-datas');
    seletor.innerHTML = '';

    datas.forEach((data, index) => {
        const btn = document.createElement('button');
        btn.className = `btn-data ${index === 0 ? 'ativo' : ''}`;
        btn.textContent = data;
        
        btn.onclick = () => {
            document.querySelectorAll('.btn-data').forEach(b => b.classList.remove('ativo'));
            btn.classList.add('ativo');
            renderizarFilmes(emCartaz[data]);
            configurarBotaoCompartilhar(emCartaz, data);
        };
        
        seletor.appendChild(btn);
    });
}

function renderizarFilmes(filmesDoDia) {
    const container = document.getElementById('lista-filmes');
    container.innerHTML = '';

    filmesDoDia.forEach(filme => {
        const card = document.createElement('div');
        card.className = 'filme-card';
        
        const badgesHorarios = filme.horarios.split(', ')
            .map(h => `<span class="horario-badge">${h}</span>`)
            .join('');

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
    });
}

function configurarBotaoCompartilhar(emCartaz, dataAtiva) {
    const btn = document.getElementById('btn-compartilhar');
    
    btn.onclick = () => {
        const filmes = emCartaz[dataAtiva];
        let texto = `🎬 *Em cartaz (${dataAtiva}) em Itabaiana:*\n\n`;
        
        filmes.forEach(f => {
            texto += `*${f.titulo}* (${f.duracao})\n`;
            texto += `-${f.genero}-\n`;
            texto += `- ${f.horarios}\n\n`;
        });

        const link = "https://wa.me/?text=" + encodeURIComponent(texto);
        window.open(link, "_blank");
    };
}

iniciarApp();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js');
    });
}