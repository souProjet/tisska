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
//                                   CODE SPÉCIFIQUE À LA PAGE PROFILE
//############################################################################################################
let editableInfos = document.querySelectorAll('.editable-info');
let errorField = document.querySelector('.error-field');
let saveBtn = document.querySelector('#save-infos');

editableInfos[0].addEventListener('keyup', function(e) {
    //mettre une majuscule à la première lettre
    editableInfos[0].innerText = editableInfos[0].innerText.charAt(0).toUpperCase() + editableInfos[0].innerText.slice(1);
});

editableInfos[1].addEventListener('keyup', function(e) {
    //mettre une majuscule à la première lettre
    editableInfos[1].innerText = editableInfos[1].innerText.charAt(0).toUpperCase() + editableInfos[1].innerText.slice(1);
});

editableInfos[2].addEventListener('keyup', function(e) {
    //vérifier que l'adresse mail est valide
    if (editableInfos[2].innerText.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]{2,}\.[a-z]{2,4}$/)) {
        errorField.innerHTML = '';
    } else {
        errorField.innerHTML = 'Adresse mail invalide';
    }
});

editableInfos[3].addEventListener('keyup', function(e) {
    //mettre une majuscule à chaque mot
    editableInfos[3].innerText = editableInfos[3].innerText.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
});

editableInfos[4].addEventListener('keyup', function(e) {
    //mettre une majuscule à chaque mot
    editableInfos[4].innerText = editableInfos[4].innerText.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
});

editableInfos[5].addEventListener('keyup', function(e) {
    //format zipcode : 5 chiffres 
    //espace après les 2 premiers chiffres
    editableInfos[5].innerText = editableInfos[5].innerText.replace(/(\d{2})(\d{3})/, '$1 $2');

});

saveBtn.addEventListener('click', function(e) {
    e.preventDefault();
    editableInfos.forEach((item, index) => {
        if (item.innerText == '') {
            errorField.innerHTML = 'Veuillez remplir tous les champs';
            return;
        }
    });

    if (errorField.innerHTML == '') {
        let data = {
            firstname: editableInfos[0].innerText,
            lastname: editableInfos[1].innerText,
            email: editableInfos[2].innerText,
            address: editableInfos[3].innerText,
            city: editableInfos[4].innerText,
            zip: editableInfos[5].innerText
        };

        fetch('/profile/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    errorField.innerHTML = data.error;
                } else {
                    errorField.style.color = 'green';
                    errorField.innerHTML = 'Informations mises à jour';
                    window.location.href = '/';
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }
});





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

window.addEventListener('load', function() {
    loader.classList.add('hide');
    loaderOverlay.classList.add('hide');
    setTimeout(() => {
        loader.remove();
        loaderOverlay.remove();
    }, 300);
});