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
<<<<<<< HEAD
=======
});

// ############################### SLIDER ###############################
let EcMainSlider = new Swiper('.ec-slider.swiper-container', {
    loop: true,
    speed: 2000,
    effect: "slide",
    autoplay: {
        delay: 7000,
        disableOnInteraction: false,
    },
    pagination: {
        el: '.swiper-pagination',
        clickable: true,
    },

    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    }
>>>>>>> main
});