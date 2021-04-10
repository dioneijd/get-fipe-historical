const state = require('./state.js')

async function robot(browser) {
    console.log('>>>> CAR SELECTOR - Starting')

    let page

    await OpenUrl()
    await AskToSelectTheCar()
    await SaveSelection()

   
    console.log('>>>> CAR SELECTOR - Finished')



    async function OpenUrl(){
        const url = 'https://veiculos.fipe.org.br'
        
        page = await browser.newPage()

        await page.goto(url)    
        await page.waitForSelector('.tab.vertical.tab-veiculos ul li a')
        await page.click('.tab.vertical.tab-veiculos ul li a')

    }

    async function AskToSelectTheCar(){
        //await page.evaluate(() => alert('Selecione a Marca, o Modelo e o Ano do carro'))
        await page.click('#selectMarcacarro')

        await page.waitForFunction('_cod["marca"] != "" && _cod["modelo"] != "" && _cod["ano"] != ""', {timeout: 0})
        
    }
    
    async function SaveSelection(){
        
        let content = state.Load()

        const car = await page.evaluate(() => {
            return {
                brand: _cod["marca"],
                model: _cod["modelo"],
                year: _cod["ano"].substring(0,4),
                fuelType: _cod["ano"].slice(-1)[0]
            }
        })

        

        content.cars.push(car)

        state.Save(content)

    }

}


module.exports = robot