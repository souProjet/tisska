//############################################################################################################
//                                     FONCTIONS GÉNÉRIQUES
//############################################################################################################
function escapeHTML(unsafe) {
    return unsafe ? unsafe
        .replace(/&/g, "&")
        .replace(/</g, "<")
        .replace(/>/g, ">")
        .replace(/"/g, '"')
        .replace(/'/g, "'") : '';
}

let token = escapeHTML(document.querySelector('meta[name="token"]').getAttribute('content')); //récupération du token
let productID = escapeHTML(document.querySelector('meta[name="productID"]').getAttribute('content')); //récupération de l'ID du produit
let productOptionsText = escapeHTML(document.querySelector('meta[name="productOptions"]').getAttribute('content')); //récupération des options du produit

let cartBtn = document.querySelectorAll('.cart-btn');
cartBtn.forEach((item, index) => {

    if (index == 0) item.remove();
    else item.parentNode.remove();
});


//############################################################################################################
//                                     CODE SPÉCIFIQUE À LA PAGE EDITPRODUCT
//############################################################################################################


/*----------------------------- User Dropdown ---------------------- */
let dropdown = document.querySelector('.dropdown');
let dropdownMenu = document.querySelector('.dropdown-menu');

dropdown.addEventListener('click', function() {
    if (dropdownMenu.style.display == 'block') {
        dropdownMenu.style = '';
        return;
    }
    dropdownMenu.style.display = 'block';
    dropdownMenu.style.position = 'absolute';
    dropdownMenu.style.inset = '0px auto auto 0px';
    dropdownMenu.style.marginRight = '0px';
    dropdownMenu.style.marginLeft = '0px';
    dropdownMenu.style.transform = 'translate(-114px, 43px)';
});

//############################################################################################################
//                                     ÉVÈNEMENTS LIÉS À LA SUPPRESSION DU PRODUIT
//############################################################################################################
let deleteBtn = document.querySelector('.delete-product-btn');
deleteBtn.addEventListener('click', function() {
    let warning = confirm('Êtes-vous sûr de vouloir supprimer ce produit ?');
    if (warning) {
        fetch('/api/product/' + productID, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        }).then(response => {
            if (response.error) {
                console.log(response.error);
                return;
            }
            window.location.href = '/';
        })
    }
});


// ############################################################################################################
//                                     ÉVÈNEMENTS LIÉS À L'AJOUT DES IMAGES
// ############################################################################################################
let productThumb = document.querySelectorAll('input[type="file"]');

productThumb.forEach((item, index) => {
    item.addEventListener('change', function() {
        let file = item.files[0];
        let reader = new FileReader();

        reader.onload = function() {
            //creates a 765 by 850 size card with canvas
            let canvas = document.createElement('canvas');
            let ctx = canvas.getContext('2d');
            ctx.canvas.width = 765;
            ctx.canvas.height = 850;

            //put the "reader.result" image on it so that it covers the whole surface while keeping the original ratio
            let img = new Image();
            img.src = reader.result;
            img.onload = function() {
                //the shorter side must be full height
                if (img.width < img.height) {
                    let ratio = img.height / img.width;
                    //center the image
                    ctx.drawImage(img, 0, (850 - 765 * ratio) / 2, 765, 765 * ratio);
                }
                //the shorter side must be full width
                else {
                    let ratio = img.width / img.height;
                    //center the image
                    ctx.drawImage(img, (765 - 850 * ratio) / 2, 0, 850 * ratio, 850);
                }

                //get the image data from the canvas
                let data = canvas.toDataURL('image/jpeg', 0.8);
                let imgCard = document.querySelectorAll('.ec-image-preview')[index];
                imgCard.src = data;
            }
        }

        reader.readAsDataURL(file);
    });
});




//############################################################################################################
//                                 ÉVÈNEMENTS LIÉS À LA MODIFICATION D'UN PRODUIT
//############################################################################################################
let productName = document.querySelector('#productName');
// set upper case for first letter
productName.addEventListener('keyup', function() {
    let value = productName.value;
    productName.value = value.charAt(0).toUpperCase() + value.slice(1);
});

let editProductBtn = document.querySelector('.edit-product-btn');
let productWeight = document.querySelector('#productWeight');
let productShortDesc = document.querySelector('#productShortDesc');
let productPrice = document.querySelector('#productPrice');
let productDesc = document.querySelector('#productDesc');
let productTheme = document.querySelector('#productTheme');

let productPersonalizeOption = document.querySelectorAll('input[type="checkbox"]:not([name="package"])');
let personalizeOptionTab = [];


//récupérer tout les thèmes déjà existants
fetch('/api/getthemes', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        let themeList = data.themes
        productTheme.addEventListener('keyup', function() {
            let value = productTheme.value;

            productTheme.value = value.charAt(0).toUpperCase() + value.slice(1);
            //vérifier si le texte entré correspond à une partie d'un thème existant et si oui, le mettre en valeur
            productTheme.parentNode.querySelectorAll('.theme-list').forEach((item, index) => {
                item.remove();
            });
            let nbTheme = 0;
            themeList.forEach((item, index) => {
                if (item.toLowerCase().indexOf(value.toLowerCase()) != -1) {
                    productTheme.parentNode.insertAdjacentHTML('beforeend', `<div class="theme-list" onclick="selectTheme('${item}')" style="background-color: #f5f5f5; border-radius: 5px; padding: 5px; cursor: pointer; position:absolute; width: ${productTheme.offsetWidth}px; z-index: 1; margin-top:${-30+(30*nbTheme)}px;">${item}</div>`);
                    productTheme.focus();
                    nbTheme++;

                } else {
                    productTheme.parentNode.querySelectorAll('.theme-list').forEach((item, index) => {
                        item.remove();
                    });
                }
            });
        });
    })
    .catch(error => console.log(error));

function selectTheme(theme) {
    productTheme.value = theme;
    productTheme.parentNode.querySelectorAll('.theme-list').forEach((item, index) => {
        item.remove();
    });
}

if (productOptionsText != '') {
    let options = productOptionsText.split(',');
    for (let i = 0; i < options.length; i++) {
        let choicesTab = [];
        let optionName = options[i].split('[')[0];
        let choices = options[i].split('[')[1].split(']')[0].split('|');

        for (let j = 0; j < choices.length; j++) {
            let choiceName = choices[j].split(':')[0];
            let choicePrice = choices[j].split(':')[1];
            choicesTab.push({ name: choiceName, price: choicePrice });
        }

        personalizeOptionTab.push({ name: optionName, choices: choicesTab });
    }
}
editProductBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    let personalizeOption = [];
    productPersonalizeOption.forEach((item, index) => {
        if (item.checked) personalizeOption.push(item.value);
    });

    personalizeOptionTab.forEach((item, index) => {
        //store like : {optionName}[optionChoice1:optionPrice1-optionChoice2:optionPrice2],...
        let optionChoices = ''
        item.choices.forEach((choice, index) => {
            optionChoices += `${choice.name}:${choice.price}|`;
        });
        optionChoices = optionChoices.slice(0, -1);
        personalizeOption.push(`${item.name}[${optionChoices}]`);
    });

    let data = {
        id: productID,
        name: productName.value,
        shortDesc: productShortDesc.value,
        price: productPrice.value,
        desc: productDesc.value,
        personalizeOption: personalizeOption.join(','),
        weight: productWeight.value,
        package: document.querySelector('input[name="package"]').checked,
        theme: productTheme.value
    }

    fetch('/api/editproduct', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${document.querySelector('meta[name="token"').content}`
        },
        body: JSON.stringify(data)
    }).then((response) => {
        return response.json();
    }).then((data) => {
        if (data.error) {
            console.log(data.error);
            return;
        }
        //upload thumb
        let formData = new FormData();
        formData.append('id', productID);
        productThumb.forEach((item, index) => {
            if (item.files[0]) {
                //verify if file is image
                if (item.files[0].type.split('/')[0] != 'image') {
                    console.log('not an image');
                    return;
                }
                formData.append('thumb-' + index, item.files[0]);


            }
        });

        fetch('/api/addproductthumb', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${document.querySelector('meta[name="token"').content}`
            },
            body: formData
        }).then((response) => {
            return response.json();
        }).then((data) => {
            if (data.error) {
                console.log(data.error);
                return;
            }
            window.location.href = '/product/' + productID
        });
    });

});


// ############################################################################################################
//                                      GESTION DE L'AJOUT D'UNE OPTION
// ############################################################################################################
let addOptionBtn = document.querySelector('.add-option-btn');
addOptionBtn.addEventListener('click', function(e) {
    let optionName = prompt('Nom de l\'option');
    if (!optionName) return;
    let choices = [];
    let firstChoice = prompt('Choix 1 :');
    if (!firstChoice) return;
    let optionPrice = prompt('Prix de l\'option sous la forme 0.00€ (laisser vide si l\'option est gratuite):');
    choices.push({
        name: firstChoice,
        price: optionPrice ? optionPrice.replace(',', '.') : '0.00'
    });
    let continueChoice = confirm('Ajouter un autre choix (oui/non) ? ("Annuler" pour non et "OK" pour oui)');
    while (continueChoice) {
        let choice = prompt('Choix ' + (choices.length + 1) + ' :');
        if (!choice) return;
        let optionPrice = prompt('Prix de l\'option sous la forme 0.00€ (laisser vide si l\'option est gratuite):');
        choices.push({
            name: choice,
            price: optionPrice ? optionPrice.replace(',', '.') : '0.00'
        });
        continueChoice = confirm('Ajouter un autre choix (oui/non) ? ("Annuler" pour non et "OK" pour oui)');
    }

    let uploadFormContainer = document.querySelector('.ec-vendor-upload-detail').querySelector('form');
    let choiceHTML = '';
    choices.forEach((item, index) => {
        choiceHTML += `
        <div class="form-check form-check-inline">
            <label>${item.name} (+${parseFloat(item.price.replace('€', '').trim()).toFixed(2)}€)</label>
        </div>`;

    });
    uploadFormContainer.querySelector('.price-section').insertAdjacentHTML('afterend', `
    <div class="col-md-6 mb-25">
        <label class="form-label">${optionName}</label>
        <div class="form-checkbox-box">
            ${choiceHTML}
        </div>
    </div>`);
    personalizeOptionTab.push({
        name: optionName,
        choices: choices
    });
});