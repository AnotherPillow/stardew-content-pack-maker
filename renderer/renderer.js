let currentInternalID = null;
let mods = []
let modList = document.querySelector('.mods')

api.send('randomWords', {
    count: 5
})

api.toRenderer('data', (event, data) => {
    console.log(JSON.stringify(data))
    if (data.mods === []) return
    mods = data.data.mods
    console.log(mods)
    for (let i = 0; i < mods.length; i++) {
        const mod = mods[i];
        addModItem(mod, i)
    }
});

function selectMod(index) {
    let mod = mods[index]

    let oldSelectedMod = document.querySelector('.selected')
    if (oldSelectedMod) oldSelectedMod.classList.remove('selected')

    let modItem = document.querySelector(`[data-index="${index}"]`)
    modItem.classList.add('selected')
    displayMod(mod, index)
    api.send('selectedMod', {
        name: mod.name
    })
}

function newPack() {
    mods.push({
        name: 'New Mod',
        description: 'A new mod',
        version: '1.0.0',
        id: 'Author.ModName',
        author: 'Author',
        assets: [],
        internalid: generateInteralID(),
        content: {},
    })
    addModItem(mods[mods.length - 1], mods.length - 1)

    selectMod(mods.length - 1)
    updateData()

}

function updateData() {
    api.send('data', {
        mods: mods
    })
}

function addModItem(mod, index) {
    let modItem = document.createElement('div')
    modItem.classList.add('mod')
    modItem.innerHTML = mod.name
    modItem.setAttribute('onclick', `selectMod(${index})`)
    modItem.setAttribute('data-index', index)
    modList.appendChild(modItem)
}

function displayMod(mod, i) {


    let body = document.querySelector('.options')

    body.innerHTML = `<h1 class="nomargin_info">Name: <input type="text" class="invisinput" value="${mod.name}"
        oninput="mods[${i}].name = this.value; updateName(${i}); updateData();" spellcheck="false"></h1>`
    body.innerHTML += `<h2 class="nomargin_info">Description: <input type="text" class="invisinput" value="${mod.description}"
        oninput="mods[${i}].description = this.value; updateData();" spellcheck="false"></h2>`
    body.innerHTML += `<h3 class="nomargin_info">UniqueID: <input type="text" class="invisinput" value="${mod.id}"
        oninput="mods[${i}].id = this.value; updateData();" spellcheck="false"></h3>`
    body.innerHTML += `<h3 class="nomargin_info">Version: <input type="text" class="invisinput" value="${mod.version}"
        oninput="mods[${i}].version = this.value; updateData();" spellcheck="false"></h3>`
    body.innerHTML += `<h3 class="nomargin_info">Author: <input type="text" class="invisinput" value="${mod.author}"
        oninput="mods[${i}].author = this.value; updateData();" spellcheck="false"></h3>`
    body.innerHTML += `<div id="assetpool" dropzone><p>Add a file to the asset pool</p></div>`

    let assetpool = document.querySelector('#assetpool')

    console.log(assetpool)

    assetpool.setAttribute('ondragover', `event.preventDefault()`)
    console.log(mods[i])
    assetpool.setAttribute('ondrop', `
        event.preventDefault()

        let path = event.dataTransfer.files[0].path
        
        mods[${i}].assets.push(path.split("\\\\").pop())
        
        updateData()
        api.send('addAsset', {path: path, mod: mods[${i}].internalid})
        document.querySelector('.options').innerHTML = ''
        displayMod(mods[${i}], ${i})


        `)

    console.log(assetpool)


    let customLocations = []
    if (mod.content.CustomLocations) customLocations = mod.content.CustomLocations
    body.innerHTML += `<h1>Custom Locations</h1>`
    body.innerHTML += `<div id="customlocations"></div>`
    body.innerHTML += `<button onclick="addCustomLocation(${i})">Add Custom Location</button>`

    for (let j = 0; j < customLocations.length; j++) {
        let customLocation = customLocations[j];

        console.log(customLocation)

        addCustomLocationElem(customLocation, j, i)
    }

    body.innerHTML += `<br>`
    body.innerHTML += `<button class="export" onclick="exportMod(${i})">Export Mod</button>`


}

function exportMod(i) {
    api.send('export', {
        mod: mods[i]
    })
}

function addCustomLocation(index) {

    let customLocation = {
        Name: 'Custom_NewLocation',
        FromMapFile: 'Choose a map file',
    }
    addCustomLocationElem(customLocation, index, index)

    let assetDropdown = document.querySelector(`.assetDropdown[data-index="${index}"]`)


    if (!mods[index].content.CustomLocations) {
        mods[index].content.CustomLocations = []
        updateData()
    }

    mods[index].content.CustomLocations.push(customLocation)
    let option = document.createElement('option')
    option.setAttribute('value', customLocation.Name)
    option.innerHTML = customLocation.Name
    
    assetDropdown.appendChild(option)
    updateData()
}

function addCustomLocationElem(customLocation, j, i) {
    let customLocationItem = document.createElement('div')
    let customLocationName = customLocation.Name
    let mod = mods[i]
    let customLocationList = document.querySelector('#customlocations')

    let customLocationNameElement = document.createElement('input')
    customLocationNameElement.setAttribute('type', 'text')
    customLocationNameElement.setAttribute('value', customLocationName)
    customLocationNameElement.setAttribute('oninput', `mods[${i}].content.CustomLocations[${j}].name = this.value; updateData();`)
    customLocationNameElement.setAttribute('spellcheck', 'false')
    customLocationNameElement.classList.add('invisinput')

    customLocationItem.appendChild(customLocationNameElement)

    let assetDropdown = document.createElement('select')
    assetDropdown.setAttribute('data-index', j)
    assetDropdown.classList.add('assetDropdown')
    assetDropdown.setAttribute('onchange', `mods[${i}].content.CustomLocations[${j}].FromMapFile = 'assets/' + this.value; updateData(); console.log(this)`)
    for (const asset of mod.assets.filter(a => a.endsWith('.tmx') || a.endsWith('.tbin'))) {
        console.log(asset)
        let option = document.createElement('option')
        option.value = asset
        option.innerHTML = asset
        assetDropdown.appendChild(option)
    }
    customLocationItem.appendChild(assetDropdown)
    customLocationList.appendChild(customLocationItem)
    
    console.log(customLocation.FromMapFile.split('/').pop())
    assetDropdown.value = customLocation.FromMapFile.split('/').pop()
    console.log(assetDropdown.value, assetDropdown)

    //get the option that matches the value
    //assetDropdown.value = customLocation.FromMapFile.split('/').pop()
    let optiontoselect = assetDropdown.querySelector(`option[value="${customLocation.FromMapFile.split('/').pop()}"]`)
    if (optiontoselect) 
        optiontoselect.setAttribute('selected', 'selected')
}

/*function updateAssetDropdown() {
    let assetDropdowns = document.querySelectorAll('.assetDropdown')
    for (const assetDropdown of assetDropdowns) {
        assetDropdown.innerHTML = ''
        for (const asset of mods[index].assets.filter(a => a.endsWith('.tmx') || a.endsWith('.tbin'))) {
            console.log(asset)
            let option = document.createElement('option')
            option.value = asset
            option.innerHTML = asset
            assetDropdown.appendChild(option)
        }
    }
}*/

function updateName(i) {
    let modItem = document.querySelector(`[data-index="${i}"]`)
    let name = mods[i].name;
    if (name === '') name = 'New Mod'
    modItem.innerHTML = name
}
api.toRenderer('randomWords', (event, data) => {
    let words = data.words;
    currentInternalID = words.join('-')
})

function generateInteralID() {
    api.send('randomWords', {
        count: 5
    })
    return currentInternalID
}