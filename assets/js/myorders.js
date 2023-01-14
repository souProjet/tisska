let loader = document.querySelector('.ec-loader');
let loaderOverlay = document.querySelector('.ec-loader-overlay');
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
let productID = undefined;
let cartModule = new CartModule(token); //instanciation de la classe CartModule qui permet de gérer le panier

//############################################################################################################
//                       AFFICHAGE DU PANIER ET CRÉATION DES ÉVÉNEMENTS LIÉS À CELUI-CI
//############################################################################################################
cartModule.fillCart(); //remplissage du panier



//############################################################################################################
//                                   CODE SPÉCIFIQUE À LA PAGE MES COMMANDES
//############################################################################################################


// ############################### MENU DÉROULANT ###############################
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

// ############################### OVERLAY DU PANIER ###############################
let cartBtn = document.querySelectorAll('.ec-side-toggle');
let sideCart = document.querySelector('.ec-side-cart');
let sideCartOverlay = document.querySelector('.ec-side-cart-overlay');
let closeBtn = document.querySelector('.ec-close');

cartBtn.forEach((item, index) => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        sideCart.classList.add('ec-open');
        sideCartOverlay.style.display = 'block';
    });
});


sideCartOverlay.addEventListener('click', function(e) {
    sideCartOverlay.style.display = 'none';
    sideCart.classList.remove('ec-open');
});

closeBtn.addEventListener('click', function(e) {
    e.preventDefault();
    sideCartOverlay.style.display = 'none';
    sideCart.classList.remove('ec-open');
});

function closeModal(btn) {
    let modal = btn.parentNode.parentNode;
    modal.classList.remove('active');
    setTimeout(() => {
        modal.remove();
    }, 300);
}

function openOptionModal(cart, orderName) {
    if (document.querySelector('.ec-modal-window')) {
        document.querySelector('.ec-modal-window').remove();
    }
    cart = JSON.parse(cart);
    let selectElements = '<select class="ec-modal-select" name="element">';
    cart.forEach((item, index) => {
        selectElements += `<option value="${index}">${orderName.split('-')[index]}</option>`;
    });
    selectElements += '</select><br><hr><br>';

    let elementContainer = '';
    cart.forEach((item, index) => {
        elementContainer += `<div class="ec-modal-option-content element-container" data-index="${index}" style="display: ${index == 0 ? 'block' : 'none'}">`;
        elementContainer += '<label>Exemplaire n°</label>';
        elementContainer += '<select class="ec-modal-select" name="quantity">';
        for (let i = 1; i <= item.quantity; i++) {
            elementContainer += `<option value="${i}">${i}</option>`;
        }
        elementContainer += '</select><br><hr><br>';

        //si l'élément à l'option name : 0:{name:"luc", couleur:"rouge"}
        let haveName = item.options[0].name ? true : false;

        let options = item.options;
        options.forEach((option, index) => {
            elementContainer += '<div class="ec-modal-option-content option-container" data-index="' + index + '" style="display: ' + (index == 0 ? 'block' : 'none') + '">';
            if (haveName) {
                elementContainer += '<p style="font-size: 25px; font-weight:bold;">Prénom : ' + option.name + '</p>';
            }

            //bouler sur chaque clef de option sauf name
            Object.keys(option).forEach((key, index) => {
                if (key != 'name') {
                    elementContainer += '<p style="font-size: 25px;">' + key + ' : ' + option[key] + '</p>';
                }
            });



            elementContainer += '</div>';
        });


        elementContainer += '</div>';

    });





    //crée un simple modal responsive en HTML
    let modal = document.createElement('div');
    modal.classList.add('ec-modal-window');
    modal.innerHTML = `
    <div class="ec-modal-header">
        <h2>Options choisies par le client</h2>
        <a class="ec-modal-close" onclick="closeModal(this)">&times;</a>
    </div>
    <div class="ec-modal-body">
        ${selectElements}
        ${elementContainer}
    </div>
    <div class="ec-modal-footer">
        <button class="ec-btn-cancel" onclick="closeModal(this)">Fermer</button>
    </div>`;
    document.body.appendChild(modal);
    setTimeout(() => {
        modal.classList.add('active');

        selectInput = document.querySelector('.ec-modal-select[name="element"]');
        if (selectInput) {
            selectInput.addEventListener('change', function() {
                //afficher seulement la box de l'index correspondant à l'options sélectionnée
                let optionContent = document.querySelectorAll('.ec-modal-option-content.element-container');
                optionContent.forEach(item => {
                    if (item.dataset.index == this.value) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        }

        selectInput2 = document.querySelectorAll('.ec-modal-select[name="quantity"]');
        if (selectInput2) {
            selectInput2.forEach(item => {
                item.addEventListener('change', function() {
                    //afficher seulement la box de l'index correspondant à l'options sélectionnée
                    let optionContent = item.parentNode.querySelectorAll('.ec-modal-option-content.option-container');
                    optionContent.forEach(item => {
                        if (item.dataset.index == this.value - 1) {
                            item.style.display = 'block';
                        } else {
                            item.style.display = 'none';
                        }
                    });

                });
            });
        }


    }, 100);

}

window.addEventListener('load', function() {
    loader.classList.add('hide');
    loaderOverlay.classList.add('hide');
    setTimeout(() => {
        loader.remove();
        loaderOverlay.remove();
    }, 300);
});