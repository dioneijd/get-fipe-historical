
/*
GetDataFromFipe({
    anoInicial: 2009,
    anoFinal: 2020,
    marca: 59,
    modelo: 4931
})
*/




async function GetDataFromFipe (ano){    
    
    // criar um  botão fake
    const btn = {id: "buttonPesquisarcarro"}
    
    // altera os parametros de busca
    _cod["ano"] = `${ano}-1`
    _cod["marca"] = '59'
    _cod["modelo"] = '4931'
    
    // faz a busca 
    consultarPrecoComTodosParametros(btn)
    
    // busca tabela de resultado
    const tabRows = Array.from(document.querySelectorAll('#resultadoConsultacarroFiltros > table tbody tr'))    
    
    let post = {
        RefMonth: tabRows[0].children[1].innerText,
        FipeCode: tabRows[1].children[1].innerText,
        Brand: tabRows[2].children[1].innerText,
        Model: tabRows[3].children[1].innerText,
        Year: tabRows[4].children[1].innerText,
        Auth: tabRows[5].children[1].innerText,
        Price: tabRows[7].children[1].innerText
    }
    
    return post

}


function FindRefPeriod(year, month){
    const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
    
    periodToSearch = `${months[month - 1]}/${year}`
    
    const allPeriods = Array.from(document.querySelectorAll('#selectTabelaReferenciacarro option'))    
    const periodRefValue = allPeriods.find(op => op.text == periodToSearch).value
    return periodRefValue
}


async function SetNextPeriod(year, month){    
    const periodsSelect = document.querySelector('#selectTabelaReferenciacarro')    
    const periodRefValue = FindRefPeriod(year, month)
    periodsSelect.value = periodRefValue
}


async function GetAll(modelYear){
    let data = {
        details: "",
        priceHistory: []
    }


    let year = new Date().getFullYear()
    let month = new Date().getMonth() + 1

    while ( year >= modelYear ){
        
        await SetNextPeriod(year, month)        
        const ret = await GetDataFromFipe(modelYear)
        
        if (data.details == "") {
            const {Auth, Brand, FipeCode, Model, Year} = ret
            data.details = {Auth, Brand, FipeCode, Model, Year}
        }
                
        const price = {
            period: `${year}-${month}`,
            price: ret.Price
        }

        data.priceHistory.push(price)
        console.log(price)

        month--
        
        if (month == 0){
            month = 12
            year--
        }
        

    }

    console.log(JSON.stringify(data.priceHistory))


    //console.log(data)

}