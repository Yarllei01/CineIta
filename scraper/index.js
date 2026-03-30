const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { autoScroll, selecionarCidade } = require('./utils');
const { extrairEmCartaz } = require('./cartaz');

async function rasparCartaz() {
    const browser = await puppeteer.launch({
        headless: false,
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
        dadosAtuais.emCartaz = novosCartaz;
        dadosAtuais.ultimaAtualizacao = new Date().toLocaleString('pt-BR');
    } catch (e) {}

    fs.writeFileSync(caminhoArquivo, JSON.stringify(dadosAtuais, null, 2));
}

executar();