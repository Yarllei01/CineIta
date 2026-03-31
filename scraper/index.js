const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { autoScroll, selecionarCidade } = require('./utils');
const { extrairEmCartaz } = require('./cartaz');

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

async function rasparCartaz() {
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
    });
    try {
        const page = await browser.newPage();
        await page.goto('https://lasercinemas.com.br/programacao/', { waitUntil: 'networkidle2' });
        await selecionarCidade(page, 'Itabaiana');
        await autoScroll(page);
        const dados = await page.evaluate(extrairEmCartaz);
        await browser.close();
        return dados;
    } catch (erro) {
        await browser.close();
        throw erro;
    }
}

async function executar() {
    const caminhoArquivo = path.join(__dirname, '..', 'filmes.json');
    let dadosAtuais = { emCartaz: {}, ultimaAtualizacao: '' };

    if (fs.existsSync(caminhoArquivo)) {
        try {
            const rawData = fs.readFileSync(caminhoArquivo);
            const dadosAntigos = JSON.parse(rawData);
            if (dadosAntigos.emCartaz) {
                dadosAtuais.emCartaz = dadosAntigos.emCartaz;
            }
        } catch (e) {}
    }

    try {
        const novosCartaz = await rasparCartaz();
        const chavesNovas = Object.keys(novosCartaz);
        for (let i = 0; i < chavesNovas.length; i++) {
            const chave = chavesNovas[i];
            dadosAtuais.emCartaz[chave] = novosCartaz[chave];
        }
        dadosAtuais.emCartaz = limparDatasAntigas(dadosAtuais.emCartaz);
        dadosAtuais.ultimaAtualizacao = new Date().toLocaleString('pt-BR');
    } catch (e) {}

    fs.writeFileSync(caminhoArquivo, JSON.stringify(dadosAtuais, null, 2));
}

executar();