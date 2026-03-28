const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function extrairDados() {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
        });
        const page = await browser.newPage();

        await page.goto('https://lasercinemas.com.br/programacao/', {
            waitUntil: 'networkidle2'
        });

        await page.waitForSelector('#select-cidade', { timeout: 10000 });
        
        await page.click('#select-cidade');
        await page.type('#select-cidade', 'Itabaiana', { delay: 100 });
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');

        await page.waitForSelector('[id^="movie-"]', { timeout: 15000 });

        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                let distance = 100;
                let timer = setInterval(() => {
                    let scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    if(totalHeight >= scrollHeight - window.innerHeight){
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        });

        const dadosExtraidos = await page.evaluate(() => {
            const filmes = {
                emCartaz: {},
                emBreve: [],
                ultimaAtualizacao: new Date().toLocaleString('pt-BR')
            };

            const dataAtual = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            filmes.emCartaz[dataAtual] = [];

            const celulas = document.querySelectorAll('[id^="movie-"]');

            celulas.forEach(celula => {
                const imgElement = celula.querySelector('img');
                const imagem = imgElement && imgElement.src.includes('http') ? imgElement.src : 'assets/poster-fallback.jpg';

                let titulo = 'Título Indisponível';
                let genero = 'Indefinido';
                let classificacao = 'Livre';
                let duracao = '--h--';
                let formato = 'Padrão';
                let horariosArray = [];

                let curr = celula.nextElementSibling;
                
                while (curr && !curr.id.startsWith('movie-')) {
                    const h3 = curr.querySelector('h3');
                    if (h3) titulo = h3.innerText;

                    const h6 = curr.querySelector('h6');
                    if (h6) genero = h6.innerText;

                    const spans = Array.from(curr.querySelectorAll('span[translate="no"]'));
                    if (spans.length > 0) classificacao = spans[0].innerText;
                    if (spans.length > 1) duracao = spans[1].innerText;

                    const links = Array.from(curr.querySelectorAll('a'));
                    links.forEach(b => {
                        const txt = b.innerText;
                        if (txt.includes('|')) {
                            formato = txt.split('\n')[0].trim();
                        }
                        const match = txt.match(/\d{2}:\d{2}/);
                        if (match) {
                            horariosArray.push(match[0]);
                        }
                    });

                    curr = curr.nextElementSibling;
                }

                const horarios = horariosArray.length > 0 ? [...new Set(horariosArray)].join(', ') : 'Sem sessões hoje';

                filmes.emCartaz[dataAtual].push({
                    titulo: titulo,
                    duracao: duracao,
                    genero: genero,
                    formato: formato,
                    classificacao: classificacao,
                    imagem: imagem,
                    horarios: horarios
                });
            });

            return filmes;
        });

        const caminhoArquivo = path.join(__dirname, '..', 'filmes.json');
        fs.writeFileSync(caminhoArquivo, JSON.stringify(dadosExtraidos, null, 2));

        await browser.close();
        console.log('Extração concluída com sucesso.');
    } catch (erro) {
        console.error('Falha na extração:', erro.message);
        if (browser) {
            await browser.close();
        }
    }
}

extrairDados();