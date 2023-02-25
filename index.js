const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path');
const dataPath = path.join(app.getPath('userData'), 'data.json'); 
const modsPath = path.join(app.getPath('userData'), 'mods');
const fs = require('fs');
const rw = require('random-words');

if (!fs.existsSync(dataPath) || fs.readFileSync(dataPath).length == 0) {
    fs.writeFileSync(dataPath, JSON.stringify({mods:[]}));
}
if (!fs.existsSync(modsPath)) 
    fs.mkdirSync(modsPath);



//let modName = null;

let data = require(dataPath);

var win;

function createWindow() {
    win = new BrowserWindow({
        width: 800, 
        height: 600, 
        webPreferences: {
            preload: __dirname + '/preload.js', 
            nodeIntegration: true 
        },
        
        
    })
    win.loadFile('renderer/index.html') 

    win.on('closed', () => {
        win = null; 
    });

    setTimeout(() => {
        win.webContents.send('data', { 
            data
        }); 
    }, 800)
}

app.on('ready', () => createWindow()); 

ipcMain.on('data', (event, _data) => {
    data = _data;
    fs.writeFileSync(dataPath, JSON.stringify(data));
})
ipcMain.on('randomWords', (event, _data) => {
    let words = rw(_data.count);
    //reply to the renderer so the api.send function will return the words
    //console.log(words)
    win.webContents.send('randomWords', {words});
})
ipcMain.on('addAsset', (event, _data) => {
    let modAssetFolder = path.join(modsPath, _data.mod);
    if (!fs.existsSync(modAssetFolder)) {
        fs.mkdirSync(modAssetFolder);
    }
    console.log(modAssetFolder)
    let originalPath = _data.path;
    let fileName = originalPath.split('\\').pop();
    let assetPath = path.join(modAssetFolder, fileName);
    
    fs.copyFileSync(originalPath, assetPath);
})
ipcMain.on('export', (event, _data) => {
    let manifest = {
        Name: _data.name,
        Author: _data.author,
        Description: _data.description,
        Version: _data.version,
        UniqueID: _data.id,
        ContentPackFor: {
            UniqueID: 'Pathoschild.ContentPatcher',
            MinimumVersion: '1.20.0',
        },
        MinimumApiVersion: '3.0',
    }
    _data = _data.mod;
    let content = _data.content

    content.Format = '1.21.0';
    
    //console.log([modsPath, _data.id, `${_data.name}-${_data.version}-${generateRandomString(5)}`].join(":"))
    let exportPath = path.join(modsPath, _data.internalid, `${_data.name}-${_data.version}-${generateRandomString(5)}`);

    let contentPath = path.join(exportPath, 'content.json');
    let manifestPath = path.join(exportPath, 'manifest.json');
    let assetsPath = path.join(exportPath, 'assets');
    
    if (!fs.existsSync(exportPath)) fs.mkdirSync(exportPath, { recursive: true });
    if (!fs.existsSync(assetsPath)) fs.mkdirSync(assetsPath, { recursive: true });


    //copy all the assets and files
    fs.writeFileSync(contentPath, JSON.stringify(content, null, 4));
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4));
    //copy the assets

    let filesInAssets = fs.readdirSync(path.join(modsPath, _data.internalid));
    for (let i = 0; i < filesInAssets.length; i++) {
        console.log(filesInAssets[i])
        if (!fs.lstatSync(path.join(modsPath, _data.internalid, filesInAssets[i])).isDirectory()) 
            fs.copyFileSync(path.join(modsPath, _data.internalid, filesInAssets[i]), path.join(assetsPath, filesInAssets[i]));
    }

    explorer(exportPath);

    


})


function generateRandomString(len) {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < len; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function explorer(path) {
    const { exec } = require('child_process');
    exec(`explorer ${path}`);
}