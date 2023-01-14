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

let subtotal = document.querySelector('.subtotal');
let total = document.querySelector('.total');
let shipping = document.querySelector('.shipping');
let discount = document.querySelector('.discount');

document.querySelector('.cart-btn').remove(); //suppression du bouton panier


window.addEventListener('load', function() {
    setTimeout(async function() {
        let summary = await cartModule.getSummary(document.querySelector('.ec-checkout-pro'));
        subtotal.innerHTML = summary.subtotal.toFixed(2) + ' €';
        total.innerHTML = summary.total.toFixed(2) + ' €';
        shipping.innerHTML = summary.shipping.toFixed(2) + ' €';
        discount.innerHTML = summary.discount;
        loader.classList.add('hide');
        loaderOverlay.classList.add('hide');
        setTimeout(() => {
            loader.remove();
            loaderOverlay.remove();
        }, 300);
    }, 1000);

});

let emailInput = document.querySelector('input[name="email"]');
let firstnameInput = document.querySelector('input[name="firstname"]');
let lastnameInput = document.querySelector('input[name="lastname"]');
let addressInput = document.querySelector('input[name="address"]');
let cityInput = document.querySelector('input[name="city"]');
let postalCodeInput = document.querySelector('input[name="postalcode"]');
let commentInput = document.querySelector('textarea[name="comment"]');

let displayError = document.getElementById('card-errors');

//vérifier le format de l'email et afficher un message d'erreur si besoin
emailInput.addEventListener('keyup', function() {
    if (emailInput.value.length > 3) {
        if (!emailInput.value.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)) {
            displayError.innerHTML = 'Veuillez entrer une adresse email valide';
        } else {
            displayError.innerHTML = '';
        }
    }
});


//mettre automatiquement la première lettre en majuscule
firstnameInput.addEventListener('keyup', function() {
    firstnameInput.value = firstnameInput.value.charAt(0).toUpperCase() + firstnameInput.value.slice(1);
    if (firstnameInput.value.length > 20) {
        firstnameInput.value = firstnameInput.value.slice(0, 20);
    }
});

lastnameInput.addEventListener('keyup', function() {
    lastnameInput.value = lastnameInput.value.charAt(0).toUpperCase() + lastnameInput.value.slice(1);
});

//mettre automatiquement la première lettre de chaque mot en majuscule
addressInput.addEventListener('keyup', function() {
    addressInput.value = addressInput.value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
});

cityInput.addEventListener('keyup', function() {
    cityInput.value = cityInput.value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
});

//formater le code postal
postalCodeInput.addEventListener('keyup', function() {
    postalCodeInput.value = postalCodeInput.value.replace(/[^0-9]/g, '').replace(/(\d{2})(\d{3})/, '$1 $2');
    //vérifier que le code postal est bien composé de 5 chiffres
    if (postalCodeInput.value.length > 6) {
        postalCodeInput.value = postalCodeInput.value.slice(0, 6);
    }
});

if (token) {
    //récupération des données de l'utilisateur
    fetch('/api/user', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        }).then(response => response.json())
        .then(data => {
            if (data.error) {
                console.log(data.error);
                return;
            }
            emailInput.value = data.email;
            firstnameInput.value = data.firstname;
            lastnameInput.value = data.lastname;
            addressInput.value = data.address;
            cityInput.value = data.city;
            postalCodeInput.value = data.zip.replace(/(\d{2})(\d{3})/, '$1 $2');

        });
}



//############################################################################################################
//                                   CODE SPÉCIFIQUE À LA PAGE D'ACCUEIL
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