const puppeteer = require('puppeteer')

const robots = {
    carSelector: require('./robots/CarSelector.js')
}


async function Start(){
    
    console.log('>>>> START - Starting') 

    let browser
    await OpenBrowser(true)
    await robots.carSelector(browser)








    console.log('>>>> START - Finished') 


    
    async function OpenBrowser(show){
        let option = {
            timeout: 30000,
            headless: true,
        }

        if (show) option.headless = false 

        browser = await puppeteer.launch(option)
    }
}

Start()