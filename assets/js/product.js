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
let productID = escapeHTML(document.querySelector('meta[name="product_id"]').getAttribute('content')); //récupération de l'id du produit

let cartModule = new CartModule(token); //instanciation de la classe CartModule qui permet de gérer le panier

//############################################################################################################
//                       GESTION DU PANIER (AJOUT ET SUPPRESSION DE PRODUIT)
//###########################################################################################################

let addAndRemoveToCartBtn = document.querySelector('.ec-single-cart'); //récupération des boutons d'ajout et de suppression du panier

addAndRemoveToCartBtn.addEventListener('click', function(e) {
    e.preventDefault();
    //on vérifie si le produit est déjà dans le panier
    let productInCart = cartModule.getCart.find(item => item.productID == productID);
    if (productInCart) {
        //si oui, on supprime le produit du panier
        cartModule.deleteProduct(productID);
        addAndRemoveToCartBtn.querySelector('button').innerHTML = 'Ajouter au panier';
        addAndRemoveToCartBtn.querySelector('button').style.backgroundColor = '#3474d4';
    } else {
        //si non, on ajoute le produit au panier
        let qty = parseInt(document.querySelector('input.qty-input-main').value);
        let options = [];
        cartModule.addProduct(productID, qty, options);
        addAndRemoveToCartBtn.querySelector('button').innerHTML = 'Supprimer du panier';
        addAndRemoveToCartBtn.querySelector('button').style.backgroundColor = '#ff0000';

    }
});


let mainQtyInput = document.querySelector('input.qty-input-main'); //récupération du champ de saisie de la quantité
let mainQtyPlusBtn = document.querySelector('.inc-main'); //récupération du bouton d'incrémentation de la quantité
let mainQtyMinusBtn = document.querySelector('.dec-main'); //récupération du bouton de décrémentation de la quantité

//########################## GESTION DE LA QUANTITÉ DU PRODUIT ##############################
mainQtyPlusBtn.addEventListener('click', function(e) {
    e.preventDefault();
    mainQtyInput.value = parseInt(mainQtyInput.value) + 1;
    //si est dans le panier, on met à jour la quantité
    let productInCart = cartModule.getCart.find(item => item.productID == productID);
    if (productInCart) {
        cartModule.updateQuantity(productID, mainQtyInput.value);
    }
});

mainQtyMinusBtn.addEventListener('click', function(e) {
    e.preventDefault();
    if (mainQtyInput.value > 1) {
        mainQtyInput.value = parseInt(mainQtyInput.value) - 1;
        //si est dans le panier, on met à jour la quantité
        let productInCart = cartModule.getCart.find(item => item.productID == productID);
        if (productInCart) {
            cartModule.updateQuantity(productID, mainQtyInput.value);
        }
    }


});

mainQtyInput.addEventListener('change', function(e) {
    e.preventDefault();
    //si est dans le panier, on met à jour la quantité
    let productInCart = cartModule.getCart.find(item => item.productID == productID);
    if (productInCart) {
        cartModule.updateQuantity(productID, mainQtyInput.value);
    }
});













//############################################################################################################
//                                     RÉCUPÉRATION DES COMMENTAIRES
//############################################################################################################
//############################ APPEL AU SERVEUR POUR RECUPERER LES COMMENTAIRES ##############################
let reviewsContainer = document.querySelector('.ec-t-review-wrapper');
fetch('/api/review/' + productID, {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
    },
}).then((response) => {
    return response.json();
}).then((data) => {
    if (data.error) {
        reviewsContainer.innerHTML = ` < p style = "color:red;" > $ { data.error } < /p>`;
        return;
    }
    let reviews = data.reviews;
    reviews.forEach((item, index) => {
        let avatar = item.avatar ? '/avatar/' + item.avatar : '/public/img/defaultAvatar.svg';
        let roundedCorner = item.avatar ? 'style="border-radius:50%;"' : '';
        reviewsContainer.insertAdjacentHTML('beforeend', `
         <div class="ec-t-review-item">
             <div class="ec-t-review-avtar">
                 <img src="${avatar}" ${roundedCorner} alt="User Avatar">
             </div>
             <div class="ec-t-review-content">
                 <div class="ec-t-review-bottom">
                     <p>${item.content}</p>
                 </div>
             </div>
         </div> `);
    });
    loader.classList.add('hide');
    loaderOverlay.classList.add('hide');
    setTimeout(() => {
        loader.remove();
        loaderOverlay.remove();
    }, 300);
});




//############################################################################################################
//                                     AJOUT D'UN COMMENTAIRE
//############################################################################################################
let commentInput = document.querySelector('textarea[name="your-comment"]');
let commentSubmit = document.querySelector('button[type="submit"].add-comment-btn');

//########################## APPEL AU SERVEUR POUR AJOUTER UN COMMENTAIRE ##############################
commentSubmit.addEventListener('click', function(e) {
    e.preventDefault();
    if (commentInput.value == '') {
        commentInput.style.border = '1px solid red';
    } else {
        commentInput.style.border = '1px solid #e0e0e0';
        //send comment
        fetch('/api/review', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                content: escapeHTML(commentInput.value),
                productID: productID
            })
        }).then((response) => {
            return response.json();
        }).then((data) => {
            if (data.error) {
                commentInput.parentNode.insertAdjacentHTML('afterend', `<p class="info-msg" style="color:red;">${data.error}</p>`);
                return;
            }
            commentInput.parentNode.insertAdjacentHTML('afterend', `<p class="info-msg" style="color:green;">Commentaire envoyé, merci !</p>`);
            let avatar = token ? '/avatar/' + document.querySelectorAll('.ec-user-avatar')[0].src.split('/')[4] : '/public/img/defaultAvatar.svg';
            let roundedCorner = token ? 'style="border-radius:50%;"' : '';
            reviewsContainer.insertAdjacentHTML('afterbegin', `
            <div class="ec-t-review-item">
                <div class="ec-t-review-avtar">
                    <img src="${avatar}" ${roundedCorner} alt="User Avatar">
                </div>
                <div class="ec-t-review-content">
                    <div class="ec-t-review-bottom">
                        <p>${escapeHTML(commentInput.value)}</p>
                    </div>
                </div>
            </div> `);
            commentInput.value = '';

            setTimeout(() => {
                commentInput.parentNode.parentNode.querySelector('.info-msg').remove();
            }, 2000);
        });
    }
});

function pinProduct(id, state) {
    fetch('/api/product/pin/' + id + '/' + state, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    }).then((response) => {
        return response.json();
    }).then((data) => {
        if (data.error) {
            console.log(data.error);
            return;
        }
        if (state == 1) {
            document.querySelector('.ec-pin-product').innerHTML = 'Désépingler';
            document.querySelector('.ec-pin-product').setAttribute('onclick', 'pinProduct(' + id + ', 0)');
        } else {
            document.querySelector('.ec-pin-product').innerHTML = 'Épingler';
            document.querySelector('.ec-pin-product').setAttribute('onclick', 'pinProduct(' + id + ', 1)');
        }
    });
}








//############################################################################################################
//                                   CODE SPÉCIFIQUE À LA PAGE D'ACCUEIL
//############################################################################################################

// ############################### CHANGEMENT D'OPTION ###############################
let singleProVariation = document.querySelectorAll('.single-pro-content .ec-pro-variation .ec-pro-variation-content li');
singleProVariation.forEach((item, index) => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        item.classList.add('active');
        for (var i = 0; i < singleProVariation.length; i++) {
            if (singleProVariation[i] !== item) {
                singleProVariation[i].classList.remove('active');
            }
        }
    });
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



//############################### ZOOM IMAGE ###############################
$('.zoom-image-hover').zoom();



//################################ SLIDER IMAGE #############################
$('.single-product-cover').slick({
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    fade: false,
    asNavFor: '.single-nav-thumb',
});

$('.single-nav-thumb').slick({
    slidesToShow: 4,
    slidesToScroll: 1,
    asNavFor: '.single-product-cover',
    dots: false,
    arrows: true,
    focusOnSelect: true
});



//################################# TABS ##################################
let navItem = document.querySelectorAll('.nav-item');
navItem.forEach((item, index) => {

    item.addEventListener('click', function(e) {
        e.preventDefault();
        navItem.forEach((item, index) => {
            item.firstElementChild.classList.remove('active');
        });
        item.firstElementChild.classList.add('active');

        let tabPane = document.querySelectorAll('.tab-pane');
        tabPane.forEach((item, index) => {
            item.classList.remove('active');
            item.classList.remove('show');

        });
        tabPane[index].classList.add('active');
        tabPane[index].classList.add('show');


    });
});