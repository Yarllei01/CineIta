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
            const h3 = curr.querySelector('h3');
            if (h3 && titulo === 'Título Indisponível') titulo = h3.innerText;

            const h6 = curr.querySelector('h6');
            if (h6 && genero === 'Indefinido') genero = h6.innerText;

            const spans = curr.querySelectorAll('span[translate="no"]');
            if (spans.length > 0 && classificacao === 'Livre') classificacao = spans[0].innerText;
            if (spans.length > 1 && duracao === '--h--') duracao = spans[1].innerText;

            const links = curr.querySelectorAll('a');
            for (let j = 0; j < links.length; j++) {
                const b = links[j];
                const txt = b.innerText;
                let formatoStr = 'Padrão';
                if (txt.includes('|')) {
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