const fs = require('fs')
const contentFilePath = './content/data.json'

function Save(content){
    const contentString = JSON.stringify(content)
    return fs.writeFileSync(contentFilePath, contentString)
}

function Load(){
    const fileBuffer = fs.readFileSync(contentFilePath, 'utf-8')
    const contentJson = JSON.parse(fileBuffer)
    return contentJson
}

module.exports = {
    Save,
    Load
}