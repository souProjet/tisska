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

function formatPrice(price) {
    return price.toFixed(2).replace('.', ',') + ' €';
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
});

//gestion du changement de thème
let themeSelect = document.querySelector('.theme-select');
let productsContainer = document.querySelector('.ec-products-container');

themeSelect.addEventListener('change', function(e) {
    let theme = escapeHTML(e.target.value);
    fetch('/api/products/theme/' + (theme == '0' ? '' : theme), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(response => response.json())
        .then(data => {
            productsContainer.querySelectorAll('.ec-product-content:not(.add-product-btn)').forEach((item, index) => {
                item.remove();
            });
            let products = data.products;
            let productsHTML = '';
            products.forEach((item, index) => {
                let timeSinceCreation = Math.floor((new Date() - new Date(item.created)) / (1000 * 60 * 60 * 24));
                //if timeSinceCreation < 7 days, add new flag
                let newFlag = timeSinceCreation < 7 ? `<span class="flags"><span class="new">New</span></span>` : '';
                productsHTML += `<div class="col-lg-3 col-md-6 col-sm-6 col-xs-6 mb-6 ec-product-content fadeIn" data-animation="fadeIn" data-animated="true">
                <div class="ec-product-inner">
                    <div class="ec-pro-image-outer">
                        <div class="ec-pro-image" onclick="window.location='/product/${item.id}'">
                            <a href="product-left-sidebar.html" class="image">
                                <img style="border-radius:20px;" class="main-image" src="/product/thumb/${item.id}-0" alt="Image du produit">
                                <img style="border-radius:20px;" class="hover-image" src="/product/thumb/${item.id}-0" alt="Image du produit">
                            </a>
                            ${newFlag}
                            <div class="ec-pro-loader"></div>
                        </div>
                    </div>
                    <div class="ec-pro-content">
                        <h5 class="ec-pro-title"><a href="/product/${item.id}">${item.name}</a></h5>

                        <span class="ec-price">
                            <!--<span class="old-price">0€</span>-->
                            <span class="new-price">${formatPrice(item.price)}</span>
                        </span>
                    </div>
                </div>
            </div>`;
            });
            productsContainer.innerHTML += productsHTML;
        });

});