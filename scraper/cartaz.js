const extrairEmCartaz = () => {
    const agora = new Date();
    const fusoBrasilia = new Date(agora.getTime() - (3 * 60 * 60 * 1000));
    let diaStr = fusoBrasilia.getUTCDate().toString().padStart(2, '0');
    let mesStr = (fusoBrasilia.getUTCMonth() + 1).toString().padStart(2, '0');
    const dataAtual = diaStr + '/' + mesStr;
    let filmes = {};
    filmes[dataAtual] = [];

    const blocosImagem = document.querySelectorAll('div[id^="movie-"]');

    for (let i = 0; i < blocosImagem.length; i++) {
        const blocoImg = blocosImagem[i];

        let imagem = 'assets/poster-fallback.jpg';
        const imgElement = blocoImg.querySelector('img');
        if (imgElement && imgElement.src && imgElement.src.includes('http')) {
            imagem = imgElement.src;
        }

        let sibling = blocoImg.nextElementSibling;
        let blocoInfo = null;
        let blocoSessoes = null;

        while (sibling && !(sibling.id && sibling.id.startsWith('movie-'))) {
            if (!blocoInfo && sibling.querySelector('span[translate="no"]')) {
                blocoInfo = sibling;
            } else if (!blocoSessoes && sibling.innerHTML.match(/\d{2}:\d{2}/)) {
                blocoSessoes = sibling;
            }
            sibling = sibling.nextElementSibling;
        }

        let titulo = 'Título Indisponível';
        let genero = '';
        let classificacao = 'Livre';
        let duracao = '--h--';

        var prev = blocoImg.previousElementSibling;
        if (prev) {
            var h6 = prev.querySelector('h6');
            if (h6 && h6.textContent.trim()) {
                titulo = h6.textContent.trim();
            }
        }

        if (blocoInfo) {
            var pGenero = blocoInfo.querySelector('p');
            if (pGenero && pGenero.textContent.trim()) {
                genero = pGenero.textContent.trim();
            }
            const spans = blocoInfo.querySelectorAll('span[translate="no"]');
            if (spans.length > 0) classificacao = spans[0].textContent.trim().toUpperCase();
            if (spans.length > 1) duracao = spans[1].textContent.trim();
        }

        let sessoesMap = {};
        if (blocoSessoes) {
            const els = blocoSessoes.querySelectorAll('h6, p, span');
            let formatoAtual = 'Padrão';
            for (let e = 0; e < els.length; e++) {
                const txt = els[e].textContent.trim();
                if (txt.includes('DUB') || txt.includes('LEG') || txt.includes('NAC')) {
                    formatoAtual = txt;
                } else if (txt.match(/^\d{2}:\d{2}$/)) {
                    if (!sessoesMap[formatoAtual]) sessoesMap[formatoAtual] = [];
                    if (!sessoesMap[formatoAtual].includes(txt)) {
                        sessoesMap[formatoAtual].push(txt);
                    }
                }
            }
        }

        let sessoes = [];
        const chavesFormatos = Object.keys(sessoesMap);
        for (let k = 0; k < chavesFormatos.length; k++) {
            sessoes.push({
                formato: chavesFormatos[k],
                horarios: sessoesMap[chavesFormatos[k]].join(', ')
            });
        }

        if (sessoes.length === 0) {
            sessoes.push({ formato: 'Padrão', horarios: 'Sem sessões hoje' });
        }

        filmes[dataAtual].push({
            titulo: titulo,
            genero: genero,
            duracao: duracao,
            classificacao: classificacao,
            imagem: imagem,
            sessoes: sessoes
        });
    }

    return filmes;
};

module.exports = { extrairEmCartaz };