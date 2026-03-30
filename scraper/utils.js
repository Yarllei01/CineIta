const autoScroll = async (page) => {
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
};

const selecionarCidade = async (page, cidade) => {
    await page.waitForSelector('#select-cidade', { timeout: 10000 });
    await page.click('#select-cidade');
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    const cidadeMacete = cidade.slice(0, -1);
    await page.type('#select-cidade', cidadeMacete, { delay: 100 });
    await new Promise(r => setTimeout(r, 1000));
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    try {
        await page.waitForSelector('[id^="movie-"]', { timeout: 15000 });
    } catch (e) {}
    await new Promise(r => setTimeout(r, 2000));
};

module.exports = { autoScroll, selecionarCidade };