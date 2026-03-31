const extrairEmCartaz = () => {
    const dataAtual = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    let filmes = {};
    filmes[dataAtual] = [];

    const celulas = document.querySelectorAll('[id^="movie-"]');

    for (let i = 0; i < celulas.length; i++) {
        const celula = celulas[i];
        const imgElement = celula.querySelector('img');
        const imagem = imgElement && imgElement.src.includes('http') ? imgElement.src : 'assets/poster-fallback.jpg';

        let titulo = 'Título Indisponível';
        let genero = 'Indefinido';
        let classificacao = 'Livre';
        let duracao = '--h--';
        let sessoesMap = {};

        let curr = celula.nextElementSibling;
        
        while (curr && !curr.id.startsWith('movie-')) {
            const headings = curr.querySelectorAll('h1, h2, h3, h4, h5, h6');
            if (headings.length > 0 && titulo === 'Título Indisponível') {
                titulo = headings[0].innerText.trim();
            }

            const linhas = curr.innerText.split('\n');
            for (let j = 0; j < linhas.length; j++) {
                const txt = linhas[j].trim();
                if (txt.includes('|') && /\d{2}h\d{2}/.test(txt)) {
                    const partes = txt.split('|');
                    duracao = partes[0].trim();
                    genero = partes[1].trim();
                } else if (/^(L|10|12|14|16|18)$/.test(txt) && classificacao === 'Livre') {
                    classificacao = txt;
                }
            }

            const links = curr.querySelectorAll('a, button');
            for (let j = 0; j < links.length; j++) {
                const b = links[j];
                const txt = b.innerText;
                let formatoStr = 'Padrão';
                if (txt.includes('|') && !/\d{2}h\d{2}/.test(txt)) {
                    formatoStr = txt.split('\n')[0].trim();
                }
                const match = txt.match(/\d{2}:\d{2}/);
                if (match) {
                    if (!sessoesMap[formatoStr]) {
                        sessoesMap[formatoStr] = [];
                    }
                    sessoesMap[formatoStr].push(match[0]);
                }
            }

            curr = curr.nextElementSibling;
        }

        let sessoes = [];
        const chavesFormatos = Object.keys(sessoesMap);
        for (let k = 0; k < chavesFormatos.length; k++) {
            const form = chavesFormatos[k];
            const horariosUnicos = [...new Set(sessoesMap[form])];
            sessoes.push({
                formato: form,
                horarios: horariosUnicos.join(', ')
            });
        }

        if (sessoes.length === 0) {
            sessoes.push({
                formato: 'Padrão',
                horarios: 'Sem sessões hoje'
            });
        }

        filmes[dataAtual].push({
            titulo: titulo,
            duracao: duracao,
            genero: genero,
            classificacao: classificacao,
            imagem: imagem,
            sessoes: sessoes
        });
    }

    return filmes;
};

module.exports = { extrairEmCartaz };