function escapeHTML(unsafe) {
    return unsafe ? unsafe
        .replace(/&/g, "&")
        .replace(/</g, "<")
        .replace(/>/g, ">")
        .replace(/"/g, '"')
        .replace(/'/g, "'") : '';
}

let token = escapeHTML(document.querySelector('meta[name="token"').content);

//###########################################################################################
//             CETTE FONCTION CRÉER LES BOUTONS PLUS ET MOINS POUR LES QUANTITÉS
//      ET LES AJOUTES DANS LE DOM PUIS CRÉER LES ÉVÉNEMENTS DE MODIFICATION DE QUANTITÉ
//###########################################################################################
function qtyMinusPlusBtn() {
    let QtyPlusMinus = document.querySelectorAll('.qty-plus-minus');
    // let QtyPlus = document.querySelectorAll('.inc');
    // let QtyMinus = document.querySelectorAll('.dec');
    // let QtyInput = document.querySelectorAll('.qty-input');
    QtyPlusMinus.forEach((item, index) => {
        //add minus button
        //check if button already exist
        if (item.querySelector('.dec') || item.querySelector('.inc')) {
            return;
        }
        //###################  CRÉATION DU BOUTON MOINS  ###################
        let minus = document.createElement('div');
        minus.setAttribute('class', 'dec ec_qtybtn');
        minus.setAttribute('onclick', 'qtyMinus(this)');
        minus.innerHTML = '-';
        item.prepend(minus);

        //###################  CRÉATION DU BOUTON PLUS  ###################
        let plus = document.createElement('div');
        plus.setAttribute('class', 'inc ec_qtybtn');
        plus.setAttribute('onclick', 'qtyPlus(this)');
        plus.innerHTML = '+';
        item.append(plus);

        item.querySelector('.qty-input').setAttribute('onchange', 'updateQuantity(this.dataset.productid, Math.max(1, this.value))');

    });

}

function qtyPlus(element) {
    let input = element.parentNode.querySelector('.qty-input');
    let oldValue = input.value;
    let newVal = parseFloat(oldValue) + 1;
    input.value = newVal;
    updateQuantity(input.dataset.productid, newVal);
}

function qtyMinus(element) {
    let input = element.parentNode.querySelector('.qty-input');
    let oldValue = input.value;
    if (oldValue > 1) {
        let newVal = parseFloat(oldValue) - 1;
        input.value = newVal;
        updateQuantity(input.dataset.productid, newVal);
    }
}

//###################  FONCTION DE MISE À JOUR DE LA QUANTITÉ  ###################
function updateQuantity(productId, quantity) {
    let QtyInput = document.querySelectorAll('.qty-input');
    if (token) {
        //update cart
        fetch('/api/cart/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                'productID': productId,
                'what': 'quantity',
                'value': quantity
            }),
        }).then((response) => {
            return response.json();
        }).then((data) => {
            if (data.error) {
                console.log(data.error);
                return;
            }
            //update quantity
            QtyInput.forEach((item, index) => {
                let itemID = item.dataset.productid;
                if (itemID === productId) {
                    QtyInput[index].value = quantity;
                }
            });
            fillCart(data.cart);
        });

    } else {
        //get cart from localstorage
        let cart = localStorage.getItem('cart');
        //check if already exist and update quantity
        let cartArray = cart.split(',');
        cartArray.forEach((item, index) => {
            let itemID = item.split(':')[0];
            if (itemID === productId) {
                //replace only quantity (index 1)
                cartArray[index] = cartArray[index].split(':')[0] + ':' + quantity + ((cartArray[index].split(':').length > 2) ? (':' + cartArray[index].split(':').slice(2).join(':')) : '');

            }
        });
        cart = cartArray.join(',');
        //update localstorage
        localStorage.setItem('cart', cart);
        //update quantity
        QtyInput.forEach((item, index) => {
            let itemID = item.dataset.productid;
            if (itemID === productId) {
                QtyInput[index].value = quantity;
            }
        });
        fillCart(cart);
    }


}

//##############################################################################################################
//                                  FONCTION DE REMPLISSAGE DU PANIER
//##############################################################################################################
function fillCart(cart) {
    let cartContainer = document.querySelector('.eccart-pro-items');
    let subTotalPrice = document.querySelector('.cart-table').querySelectorAll('tr')[0].querySelectorAll('td')[1];
    let TVAPrice = document.querySelector('.cart-table').querySelectorAll('tr')[1].querySelectorAll('td')[1];
    let totalPrice = document.querySelector('.cart-table').querySelectorAll('tr')[2].querySelectorAll('td')[1];
    cartContainer.innerHTML = '';
    let subTotal = 0;
    let TVA = 0;
    let total = 0;

    //cart format: {productID}:{quantity},{productID}:{quantity}
    let cartArray = cart.split(',');
    //vérifier si le panier est vide

    if (cartArray[0] === '') {
        qtyMinusPlusBtn();

        cartContainer.innerHTML = `Votre panier est vide.`;
        subTotalPrice.innerHTML = '0.00 €';
        TVAPrice.innerHTML = '0.00 €';
        totalPrice.innerHTML = '0.00 €';
        return;
    }


    cartArray.forEach((item, index) => {
        let productID = item.split(':')[0];
        let quantity = item.split(':')[1];
        fetch('/api/product/' + productID, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        }).then((response) => {
            return response.json();
        }).then((data) => {
            if (data.error) {
                cartContainer.innerHTML = `<p style="color:red;">${data.error}</p>`;
                return;
            }
            let product = data.product;
            let productPrice = product.price * quantity;
            subTotal += productPrice;

            TVA += productPrice * 0.2;
            total += productPrice;
            cartContainer.insertAdjacentHTML('beforeend', `
            <li>
                <a href="/product/${productID}" class="sidekka_pro_img"><img src="/product/thumb/${productID}-0" alt="product"></a>
                <div class="ec-pro-content">
                    <a href="/product/t-shirt-homme" class="cart_pro_title">${product.name}</a>
                    <span class="cart-price"><span>${product.price.toFixed(2)}€</span> &times; ${quantity}</span>
                    <div class="qty-plus-minus">
                        <input class="qty-input" data-incart="true" data-productid="${productID}" type="text" name="ec_qtybtn" value="${quantity}">
                    </div>
                    <a class="remove" onclick="addToCart('${productID}', 1, [])">&times;</a>
                </div>
            </li>`);

            //if last item
            if (index === cartArray.length - 1) {
                subTotalPrice.innerHTML = subTotal.toFixed(2) + '€';
                TVAPrice.innerHTML = TVA.toFixed(2) + '€';
                totalPrice.innerHTML = total.toFixed(2) + '€';
                qtyMinusPlusBtn();

            }
        });
    })
}



window.addEventListener('load', function() {
    //get user info if logged in
    let userDropdown = document.querySelector('.user-option-dropdown');
    let cartBtn = document.querySelectorAll('.cart-btn');

    if (token) {
        fetch('/api/user', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }).then((response) => {
            return response.json();
        }).then((data) => {

            if (data.error) {
                //if error, remove token
                document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                return;
            }

            let avatar = document.querySelectorAll('.ec-user-avatar');
            let userProfil = document.querySelector('.ec-user-profil');

            avatar.forEach((item, index) => {
                item.style.borderRadius = '50%';
                item.src = '/avatar/' + data.avatar;
                if (index == 1) item.parentNode.removeAttribute('href');
            });


            userProfil.innerHTML += '&nbsp;&nbsp;' + data.firstname + ' ' + data.lastname;
            userDropdown.querySelectorAll('li')[0].remove();
            userDropdown.querySelectorAll('li')[0].remove();

            if (data.admin) {
                document.querySelector('.ec-side-cart').remove();
                document.querySelector('.ec-side-cart-overlay').remove();
                cartBtn.forEach((item, index) => {
                    item.innerHTML = `
                    <div class="header-icon">
                        <img src="/public/img/stats.svg" class="svg_img header_svg" alt="">
                    </div>`;
                    item.addEventListener('click', function() {
                        window.location.href = '/admin';
                    });
                });

                let productAction = document.querySelectorAll('.ec-pro-image');
                productAction.forEach((item, index) => {
                    item.innerHTML += `
                    <div class="ec-pro-actions">
                        <a class="ec-btn-group wishlist" title="Modifier"><img src="/public/img/edit.svg" class="svg_img pro_svg" alt=""></a>
                    </div>`;
                });

                let productsContainer = document.querySelector('.ec-products-container');
                productsContainer.insertAdjacentHTML('afterbegin', `
                <div onclick="window.location='/addproduct'" style="cursor:pointer;" class="col-lg-3 col-md-6 col-sm-6 col-xs-6 mb-6 ec-product-content fadeIn" data-animation="fadeIn" data-animated="true">
                    <div class="ec-product-inner">
                        <div class="ec-pro-image-outer">
                            <div class="ec-pro-image">
                                <a href="/addproduct" class="image">
                                    <img class="main-image" src="/public/img/add-new.svg" alt="Ajouter un produit">
                                    <img class="hover-image" src="/public/img/add-new.svg" alt="Ajouter un produit">
                                </a>
                            </div>
                        </div>
                    </div>
                </div>`);


            } else if (data.cart) {

                let cartContent = data.cart || '';
                fillCart(cartContent);
                cartBtn.forEach((item, index) => {
                    item.innerHTML += `<span class="ec-cart-noti ec-header-count cart-count-lable">${data.cart.split(',').length}</span>`
                });

            } else {
                if (localStorage.getItem('cart')) {
                    //if user has no cart but has a localstorage cart, we update the user cart with the localstorage cart
                    fetch('/api/cart/set', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            cart: escapeHTML(localStorage.getItem('cart'))
                        })
                    }).then((response) => {
                        return response.json();
                    }).then((data) => {
                        if (data.error) {
                            console.log(data.error);
                        }
                    });

                    localStorage.removeItem('cart');

                }
                fillCart(localStorage.getItem('cart') || '');
            }
        });

    } else {
        userDropdown.querySelectorAll('li')[2].remove();
        let cartContent = localStorage.getItem('cart') || '';
        fillCart(cartContent);
        cartBtn.forEach((item, index) => {
            if (cartContent) {
                item.innerHTML += `<span class="ec-cart-noti ec-header-count cart-count-lable">${cartContent.split(',').length}</span>`
            }
        });
    }

});

function addToCart(productId, qty, options) {
    let cartBtn = document.querySelectorAll('.cart-btn');

    if (token) {
        fetch('/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                productId: productId,
                quantity: qty.toString(),
                options: options
            })
        }).then((response) => {
            return response.json();
        }).then((data) => {
            if (data.error) {
                console.log(data.error);
                return;

            }

            cartBtn.forEach((item, index) => {
                //enlever 1 au nombre de produit dans le panier
                if (parseInt(item.querySelector('.cart-count-lable').innerHTML) == 1) item.querySelector('.cart-count-lable').remove();
                else item.querySelector('.cart-count-lable').innerHTML = parseInt(item.querySelector('.cart-count-lable').innerHTML) - 1;
            });

            fillCart(data.cart);
        });
    } else {
        let cartContent = localStorage.getItem('cart');

        //products are stored with this structure {product_id}:{quantity}:{optionName}={optionValue}:{optionName}={optionValue},...
        //options is an array [{name:optionName, value:optionValue}, {name:optionName, value:optionValue}]
        //if the product is already in cart

        if (cartContent) {
            if (cartContent.split(',').find(item => item.split(':')[0] == productId)) {
                //delete the product from cart
                let newCart = cartContent.split(',').filter(item => item.split(':')[0] != productId).join(',');
                localStorage.setItem('cart', newCart);
            } else {
                let newCart = cartContent + ',' + productId + ':' + document.querySelector('.qty-input').value;
                options.forEach((item, index) => {
                    newCart += `:${item.name}=${item.value}`;
                });
                localStorage.setItem('cart', newCart);
            }
        } else {
            let newCart = productId + ':' + document.querySelector('.qty-input').value;
            options.forEach((item, index) => {
                newCart += `:${item.name}=${item.value}`;
            });
            localStorage.setItem('cart', newCart);
        }



        cartBtn.forEach((item, index) => {
            //enlever 1 au nombre de produit dans le panier
            if (parseInt(item.querySelector('.cart-count-lable').innerHTML) == 1) item.querySelector('.cart-count-lable').remove();
            else item.querySelector('.cart-count-lable').innerHTML = parseInt(item.querySelector('.cart-count-lable').innerHTML) - 1;
        });

        fillCart(localStorage.getItem('cart'));
    }
}

document.addEventListener('DOMContentLoaded', function() {


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





    /*----------------------------- Side Cart ---------------------- */
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







    /*----------------------------- Main Slider ---------------------- */
    var EcMainSlider = new Swiper('.ec-slider.swiper-container', {
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
    });






    /*----------------------------- Qty Plus Minus Button  ------------------------------ */
    let QtyPlusMinus = document.querySelectorAll('.qty-plus-minus');
    let QtyPlus = document.querySelectorAll('.inc');
    let QtyMinus = document.querySelectorAll('.dec');
    let QtyInput = document.querySelectorAll('.qty-input');

    QtyPlusMinus.forEach((item, index) => {
        //add minus button
        let minus = document.createElement('div');
        minus.setAttribute('class', 'dec ec_qtybtn');
        minus.innerHTML = '-';
        item.prepend(minus);
        QtyMinus = document.querySelectorAll('.dec');

        //add plus button
        let plus = document.createElement('div');
        plus.setAttribute('class', 'inc ec_qtybtn');
        plus.innerHTML = '+';
        item.append(plus);
        QtyPlus = document.querySelectorAll('.inc');



    });



    QtyPlus.forEach((item, index) => {
        item.addEventListener('click', function(e) {
                e.preventDefault();
                let oldValue = QtyInput[index].value;
                let newVal = parseFloat(oldValue) + 1;
                QtyInput[index].value = newVal;
            }

        )
    });



    QtyMinus.forEach((item, index) => {
        item.addEventListener('click', function(e) {
                e.preventDefault();
                let oldValue = QtyInput[index].value;
                if (oldValue > 1) {
                    let newVal = parseFloat(oldValue) - 1;
                    QtyInput[index].value = newVal;
                }
            }

        )
    });

});