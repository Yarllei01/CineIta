const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { autoScroll, selecionarCidade } = require('./utils');

function limparDatasAntigas(emCartaz) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const chaves = Object.keys(emCartaz);
    for (let i = 0; i < chaves.length; i++) {
        const partes = chaves[i].split('/');
        const dataChave = new Date(hoje.getFullYear(), parseInt(partes[1]) - 1, parseInt(partes[0]));
        if (dataChave < hoje) {
            delete emCartaz[chaves[i]];
        }
    }
    return emCartaz;
}

async function rasparDia(page) {
    return await page.evaluate(() => {
        const celulas = document.querySelectorAll('[id^="movie-"]');
        let filmes = [];

        for (let i = 0; i < celulas.length; i++) {
            const celula = celulas[i];
            const imgElement = celula.querySelector('img');
            let imagem = 'assets/poster-fallback.jpg';
            if (imgElement && imgElement.src.includes('http')) {
                imagem = imgElement.src;
            }

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
                let horariosUnicos = [];
                for (let h = 0; h < sessoesMap[form].length; h++) {
                    let horarioAtual = sessoesMap[form][h];
                    let achou = false;
                    for (let u = 0; u < horariosUnicos.length; u++) {
                        if (horariosUnicos[u] === horarioAtual) {
                            achou = true;
                            break;
                        }
                    }
                    if (!achou) {
                        horariosUnicos.push(horarioAtual);
                    }
                }
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

            filmes.push({
                titulo: titulo,
                duracao: duracao,
                genero: genero,
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
        
        await page.waitForSelector('[id^="movie-"]', { timeout: 15000 });
        await new Promise(r => setTimeout(r, 2000));

        const emCartazSemana = {};

        const diasEncontrados = await page.evaluate(() => {
            const botoes = Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent !== null);
            const mesesValidos = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
            const resultados = [];
            
            for (let i = 0; i < botoes.length; i++) {
                const texto = (botoes[i].innerText || botoes[i].textContent || '').toUpperCase();
                
                let mesEncontrado = null;
                for (let m = 0; m < mesesValidos.length; m++) {
                    if (texto.includes(mesesValidos[m])) {
                        mesEncontrado = mesesValidos[m];
                        break;
                    }
                }

                const matchDia = texto.match(/\b(0?[1-9]|[12][0-9]|3[01])\b/);

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
                        resultados.push({ 
                            dia: dia, 
                            mes: mesEncontrado 
                        });
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

                const texto = await page.evaluate(el => (el.innerText || el.textContent || '').toUpperCase(), btn);
                const matchDia = texto.match(/\b(0?[1-9]|[12][0-9]|3[01])\b/);
                
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
                await new Promise(r => setTimeout(r, 3500));
                await autoScroll(page);
                
                const filmesDoDia = await rasparDia(page);
                const dataFormatada = alvo.dia + '/' + mesesMap[alvo.mes];
                emCartazSemana[dataFormatada] = filmesDoDia;
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
            } catch (e) {}
        }

        dadosAtuais.emCartaz = emCartazSemana;
        dadosAtuais.emCartaz = limparDatasAntigas(dadosAtuais.emCartaz);
        dadosAtuais.ultimaAtualizacao = new Date().toLocaleString('pt-BR');
        
        fs.writeFileSync(caminhoArquivo, JSON.stringify(dadosAtuais, null, 2));
        
        await browser.close();
    } catch (erro) {
        await browser.close();
    }
}

executarSemana();