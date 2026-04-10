const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { autoScroll, selecionarCidade } = require('./utils');

function limparDatasAntigas(emCartaz) {
    const agora = new Date();
    const fusoBrasilia = new Date(agora.getTime() - (3 * 60 * 60 * 1000));
    const anoAtual = fusoBrasilia.getUTCFullYear();
    const mesAtual = fusoBrasilia.getUTCMonth();
    const diaAtual = fusoBrasilia.getUTCDate();
    const dataHojeBRT = new Date(anoAtual, mesAtual, diaAtual);
    const chaves = Object.keys(emCartaz);
    
    for (let i = 0; i < chaves.length; i++) {
        const partes = chaves[i].split('/');
        const dataChave = new Date(anoAtual, parseInt(partes[1]) - 1, parseInt(partes[0]));
        if (dataChave < dataHojeBRT) {
            delete emCartaz[chaves[i]];
        }
    }
    return emCartaz;
}

async function rasparDia(page) {
    return await page.evaluate(() => {
        const blocosImagem = document.querySelectorAll('div[id^="movie-"]');
        let filmes = [];

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

            filmes.push({
                titulo: titulo,
                genero: genero,
                duracao: duracao,
                classificacao: classificacao,
                imagem: imagem,
                sessoes: sessoes
            });
        }
        return filmes;
    });
}

async function executarSemana() {
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
    });

    try {
        const page = await browser.newPage();
        await page.goto('https://lasercinemas.com.br/programacao/', { waitUntil: 'networkidle2' });
        await selecionarCidade(page, 'Itabaiana');
        await page.waitForSelector('div[id^="movie-"]', { timeout: 15000 });
        await new Promise(r => setTimeout(r, 2000));

        const emCartazSemana = {};

        const diasEncontrados = await page.evaluate(() => {
            const botoesNodeList = document.querySelectorAll('button');
            const botoes = [];
            for (let n = 0; n < botoesNodeList.length; n++) {
                if (botoesNodeList[n].offsetParent !== null) {
                    botoes.push(botoesNodeList[n]);
                }
            }
            const mesesValidos = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
            const resultados = [];
            for (let i = 0; i < botoes.length; i++) {
                const texto = (botoes[i].textContent || '').toUpperCase();
                let mesEncontrado = null;
                for (let m = 0; m < mesesValidos.length; m++) {
                    if (texto.includes(mesesValidos[m])) {
                        mesEncontrado = mesesValidos[m];
                        break;
                    }
                }
                const matchDia = texto.match(/(\d{1,2})/);
                if (mesEncontrado && matchDia) {
                    let dia = matchDia[0];
                    if (dia.length === 1) dia = '0' + dia;
                    let jaExiste = false;
                    for (let r = 0; r < resultados.length; r++) {
                        if (resultados[r].mes === mesEncontrado && resultados[r].dia === dia) {
                            jaExiste = true;
                            break;
                        }
                    }
                    if (!jaExiste && resultados.length < 7) {
                        resultados.push({ dia: dia, mes: mesEncontrado });
                    }
                }
            }
            return resultados;
        });

        const mesesMap = {
            'JAN': '01', 'FEV': '02', 'MAR': '03', 'ABR': '04',
            'MAI': '05', 'JUN': '06', 'JUL': '07', 'AGO': '08',
            'SET': '09', 'OUT': '10', 'NOV': '11', 'DEZ': '12'
        };

        for (let i = 0; i < diasEncontrados.length; i++) {
            const alvo = diasEncontrados[i];
            const botoesElemento = await page.$$('button');
            let clicou = false;
            for (let b = 0; b < botoesElemento.length; b++) {
                const btn = botoesElemento[b];
                const isVisible = await page.evaluate(el => el.offsetParent !== null, btn);
                if (!isVisible) continue;
                
                const texto = await page.evaluate(el => (el.textContent || '').toUpperCase(), btn);
                const matchDia = texto.match(/(\d{1,2})/);
                if (texto.includes(alvo.mes) && matchDia) {
                    let diaBtn = matchDia[0];
                    if (diaBtn.length === 1) diaBtn = '0' + diaBtn;
                    if (diaBtn === alvo.dia) {
                        await btn.click();
                        clicou = true;
                        break;
                    }
                }
            }
            if (clicou) {
                await new Promise(r => setTimeout(r, 5000));
                await autoScroll(page);
                const filmesDoDia = await rasparDia(page);
                if (filmesDoDia && filmesDoDia.length > 0) {
                    const dataFormatada = alvo.dia + '/' + mesesMap[alvo.mes];
                    emCartazSemana[dataFormatada] = filmesDoDia;
                }
            }
        }

        const caminhoArquivo = path.join(__dirname, '..', 'filmes.json');
        let dadosAtuais = { emCartaz: {}, ultimaAtualizacao: '' };
        if (fs.existsSync(caminhoArquivo)) {
            try {
                const rawData = fs.readFileSync(caminhoArquivo);
                const dadosAntigos = JSON.parse(rawData);
                if (dadosAntigos.ultimaAtualizacao) {
                    dadosAtuais.ultimaAtualizacao = dadosAntigos.ultimaAtualizacao;
                }
                if (dadosAntigos.emCartaz && Object.keys(emCartazSemana).length === 0) {
                    dadosAtuais.emCartaz = dadosAntigos.emCartaz; 
                }
            } catch (e) {}
        }
        
        if (Object.keys(emCartazSemana).length > 0) {
            dadosAtuais.emCartaz = emCartazSemana;
        }

        dadosAtuais.emCartaz = limparDatasAntigas(dadosAtuais.emCartaz);
        const agoraBRT = new Date(new Date().getTime() - (3 * 60 * 60 * 1000));
        dadosAtuais.ultimaAtualizacao = agoraBRT.toLocaleString('pt-BR');
        
        fs.writeFileSync(caminhoArquivo, JSON.stringify(dadosAtuais, null, 2));
        await browser.close();
    } catch (erro) {
        await browser.close();
    }
}

executarSemana();