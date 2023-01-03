function escapeHTML(unsafe) {
    return unsafe ? unsafe
        .replace(/&/g, "&")
        .replace(/</g, "<")
        .replace(/>/g, ">")
        .replace(/"/g, '"')
        .replace(/'/g, "'") : '';
}
let token = escapeHTML(document.querySelector('meta[name="token"').content);
let productID = escapeHTML(document.querySelector('meta[name="product_id"').content);

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

        item.querySelector('.qty-input').setAttribute('onchange', 'updateQuantity(this.dataset.productid, Math.max(1, this.value), this)');

    });

}

function qtyPlus(element) {
    let input = element.parentNode.querySelector('.qty-input');
    let oldValue = input.value;
    let newVal = parseFloat(oldValue) + 1;
    input.value = newVal;
    updateQuantity(input.dataset.productid, newVal, input);
}

function qtyMinus(element) {
    let input = element.parentNode.querySelector('.qty-input');
    let oldValue = input.value;
    if (oldValue > 1) {
        let newVal = parseFloat(oldValue) - 1;
        input.value = newVal;
        updateQuantity(input.dataset.productid, newVal, input);
    }
}

//###################  FONCTION DE MISE À JOUR DE LA QUANTITÉ  ###################
function updateQuantity(productId, quantity, input) {
    let QtyInput = document.querySelectorAll('.qty-input');

    if (parseInt(productID) == parseInt(productId)) {
        if (quantity > 1) {

            if (!document.querySelector('.ec-pro-variation').querySelector('p')) {
                Array.from(document.querySelector('.ec-pro-variation').children).forEach((item, index) => {
                    item.style.display = 'none';
                });

                document.querySelector('.ec-pro-variation').insertAdjacentHTML('afterbegin', `<p>Aller au panier pour gérer toutes les options de personnalisation</p>`);
            }
        } else {
            Array.from(document.querySelector('.ec-pro-variation').children).forEach((item, index) => {
                item.style.display = 'flex';
            });
            document.querySelector('.ec-pro-variation').querySelector('p') ? document.querySelector('.ec-pro-variation').querySelector('p').remove() : null;

        }
    }
    if (JSON.parse(input.dataset.incart)) {
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
        let productId = item.split(':')[0];
        let quantity = item.split(':')[1];
        fetch('/api/product/' + productId, {
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
                <a href="/product/${productId}" class="sidekka_pro_img"><img src="/product/thumb/${productId}-0" alt="product"></a>
                <div class="ec-pro-content">
                    <a href="/product/${productId}" class="cart_pro_title">${product.name}</a>
                    <span class="cart-price"><span>${product.price.toFixed(2)}€</span> &times; ${quantity}</span>
                    <div class="qty-plus-minus">
                        <input class="qty-input" data-incart="true" data-productid="${productId}" type="text" name="ec_qtybtn" value="${quantity}">
                    </div>
                    <a class="remove" onclick="addToCart('${productId}', 1, [])">&times;</a>
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

function updateOption(optionName, optionValue) {
    if (document.querySelector('.ec-single-cart').querySelector('button').innerHTML === 'Supprimer du panier') {
        if (optionName && optionValue) {
            if (token) {
                fetch('/api/cart/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({
                        'productID': productID,
                        'what': optionName,
                        'value': optionValue
                    })
                }).then((response) => {
                    return response.json();
                }).then((data) => {
                    if (data.error) {
                        console.log(data.error);
                    }

                });
            } else {
                let cart = localStorage.getItem('cart');
                let cartArray = cart.split(',');
                cartArray.forEach((item, index) => {
                    let productId = item.split(':')[0];
                    if (productId === productID) {
                        //replace only option ({productID}:{quantity}:{optionName}={optionValue}:{optionName}={optionValue}:...)
                        cartArray[index] = cartArray[index].replace(new RegExp(optionName + '=[^:]*'), optionName + '=' + optionValue);
                    }
                });
                cart = cartArray.join(',');
                //update localstorage
                localStorage.setItem('cart', cart);
            }
        }
    }
}

window.addEventListener('load', function() {
    //get user info if logged in
    let userDropdown = document.querySelector('.user-option-dropdown');
    let cartBtn = document.querySelectorAll('.cart-btn');

    //########################## APPEL AU SERVEUR POUR RECUPERER LES COMMENTAIRES ##############################
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
    });


    let commentInput = document.querySelector('textarea[name="your-comment"]');
    let commentSubmit = document.querySelector('button[type="submit"]');

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
                    commentInput.parentNode.querySelector('.info-msg').remove();
                }, 2000);
            });
        }
    });

    let singleProVariation = document.querySelectorAll('.single-pro-content .ec-pro-variation .ec-pro-variation-content li');
    singleProVariation.forEach((item, index) => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            item.classList.add('active');
            updateOption(item.parentNode.parentNode.parentNode.querySelector('span').innerHTML, item.querySelector('span').innerHTML.split('(')[0].trim());
            for (var i = 0; i < singleProVariation.length; i++) {
                if (singleProVariation[i] !== item) {
                    singleProVariation[i].classList.remove('active');
                }
            }
        });
    });
    if (document.querySelector('.input-name-personnalize')) {
        document.querySelector('.input-name-personnalize').addEventListener('focusout', function(e) {
            if (this.value != '' && this.value.length > 2 && this.value.length < 20) {

                updateOption('name', escapeHTML(this.value));
            } else {
                alert('Le prénom doit contenir entre 3 et 20 caractères');
                return;
            }
        });

    }
    if (token) {
        //########################## APPEL AU SERVEUR POUR RECUPERER LES INFOS DE L'UTILISATEUR ##############################
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


            } else if (data.cart) {
                let cartContent = data.cart || '';
                fillCart(cartContent);
                cartBtn.forEach((item, index) => {
                    item.innerHTML += `<span class="ec-cart-noti ec-header-count cart-count-lable">${data.cart.split(',').length}</span>`
                });

                //check if this product is in cart (data.cart format: {productID}:{quantity},{productID}:{quantity})
                if (cartContent.split(',').find(item => item.split(':')[0] == productID)) {
                    let qty = parseInt(cartContent.split(',').find(item => item.split(':')[0] == productID).split(':')[1]);
                    document.querySelector('.qty-input').value = qty;
                    if (qty > 1) {
                        Array.from(document.querySelector('.ec-pro-variation').children).forEach((item, index) => {
                            item.style.display = 'none';
                        });

                        document.querySelector('.ec-pro-variation').insertAdjacentHTML('afterbegin', `<p>Aller au panier pour gérer toutes les options de personnalisation</p>`);
                    } else {
                        let cartFiltered = cartContent.split(',').find(item => item.split(':')[0] == productID); //9:1:name=John:couleur=bleu
                        //if name is in options
                        if (cartFiltered.split(':').find(item => item.includes('name'))) {
                            document.querySelector('.input-name-personnalize').value = cartFiltered.split(':').find(item => item.includes('name')).split('=')[1];
                        }

                        let variationsItem = document.querySelectorAll('.ec-pro-variation-item');
                        if (variationsItem.length > 0) {
                            variationsItem.forEach((item, index) => {
                                let variationName = escapeHTML(item.querySelector('span').innerHTML);
                                let variationValue = cartFiltered.split(':').find(item => item.includes(variationName)).split('=')[1];
                                item.querySelector('li.active').classList.remove('active');
                                item.querySelectorAll('li').forEach((item, index) => {
                                    if (item.querySelector('span').innerHTML.split('(')[0].trim() == variationValue) {
                                        item.classList.add('active');
                                    }
                                });
                            });
                        }
                    }
                    //data-incart is used to check if the product is in cart
                    document.querySelector('.qty-input').dataset.incart = true;
                    document.querySelector('.ec-single-cart').querySelector('button').innerHTML = 'Supprimer du panier';
                    document.querySelector('.ec-single-cart').querySelector('button').style.backgroundColor = '#ff0000';
                }
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

        if (cartContent.split(',').find(item => item.split(':')[0] == productID)) {

            let qty = parseInt(cartContent.split(',').find(item => item.split(':')[0] == productID).split(':')[1]);
            document.querySelector('.qty-input').value = qty;
            if (qty > 1) {
                Array.from(document.querySelector('.ec-pro-variation').children).forEach((item, index) => {
                    item.style.display = 'none';
                });

                document.querySelector('.ec-pro-variation').insertAdjacentHTML('afterbegin', `<p>Aller au panier pour gérer toutes les options de personnalisation</p>`);
            } else {
                let cartFiltered = cartContent.split(',').find(item => item.split(':')[0] == productID); //9:1:name=John:couleur=bleu

                //if name is in options
                if (cartFiltered.split(':').find(item => item.includes('name'))) {
                    document.querySelector('.input-name-personnalize').value = cartFiltered.split(':').find(item => item.includes('name')).split('=')[1];
                }

                let variationsItem = document.querySelectorAll('.ec-pro-variation-item');
                if (variationsItem.length > 0) {
                    variationsItem.forEach((item, index) => {
                        let variationName = escapeHTML(item.querySelector('span').innerHTML);
                        let variationValue = cartFiltered.split(':').find(item => item.includes(variationName)).split('=')[1];
                        item.querySelector('li.active').classList.remove('active');
                        item.querySelectorAll('li').forEach((item, index) => {
                            if (item.querySelector('span').innerHTML.split('(')[0].trim() == variationValue) {
                                item.classList.add('active');
                            }
                        });
                    });
                }

            }
            //data-incart is used to check if the product is in cart
            document.querySelector('.qty-input').dataset.incart = true;
            document.querySelector('.ec-single-cart').querySelector('button').innerHTML = 'Supprimer du panier';
            document.querySelector('.ec-single-cart').querySelector('button').style.backgroundColor = '#ff0000';
        }
    }

    let addToCartBtn = document.querySelector('.ec-single-cart').querySelector('button');
    //####################### ÉVÉNEMENTS POUR L'AJOUT AU PANIER #######################
    addToCartBtn.addEventListener('click', function() {

        let qty = Array.from(document.querySelectorAll('.qty-input')).find(item => parseInt(item.dataset.productid) == parseInt(productID)).value;

        let options = [];

        if (qty == 1) {
            if (document.querySelector('.input-name-personnalize')) {
                let name = document.querySelector('.input-name-personnalize').value;
                if (name && name != '' && name.length > 2 && name.length < 20) {
                    options.push({ name: 'name', value: name });
                }
            }

            let variationsItem = document.querySelectorAll('.ec-pro-variation-item');
            if (variationsItem.length > 0) {
                variationsItem.forEach((item, index) => {
                    let variationName = escapeHTML(item.querySelector('span').innerHTML);
                    let variationValue = escapeHTML(item.querySelector('li.active').querySelector('span').innerHTML.split('(')[0].trim());
                    options.push({ name: variationName, value: variationValue });
                });
            }
        }

        addToCart(productID, qty, options);

    });

});

function addToCart(productId, qty, options) {
    let addToCartBtn = document.querySelector('.ec-single-cart').querySelector('button');
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

            //edit data incart attribute 
            document.querySelectorAll('.qty-input').forEach((item, index) => {
                if (parseInt(item.dataset.productid) == parseInt(productId)) {
                    item.dataset.incart = !JSON.parse(item.dataset.incart);
                }
            });

            if (addToCartBtn.innerHTML == 'Ajouter au panier') {
                cartBtn.forEach((item, index) => {
                    if (item.querySelector('.cart-count-lable')) item.querySelector('.cart-count-lable').innerHTML = parseInt(item.querySelector('.cart-count-lable').innerHTML) + 1;
                    else item.innerHTML += `<span class="ec-cart-noti ec-header-count cart-count-lable">1</span>`
                });
                addToCartBtn.innerHTML = 'Supprimer du panier';
                addToCartBtn.style.backgroundColor = '#ff0000';
                document.querySelector('.cart-btn').click();
            } else {
                cartBtn.forEach((item, index) => {
                    //enlever 1 au nombre de produit dans le panier
                    if (parseInt(item.querySelector('.cart-count-lable').innerHTML) == 1) item.querySelector('.cart-count-lable').remove();
                    else item.querySelector('.cart-count-lable').innerHTML = parseInt(item.querySelector('.cart-count-lable').innerHTML) - 1;
                });
                addToCartBtn.innerHTML = 'Ajouter au panier';
                addToCartBtn.style.backgroundColor = '#3474d4';
            }

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

        //edit data incart attribute 
        document.querySelectorAll('.qty-input').forEach((item, index) => {
            if (parseInt(item.dataset.productid) == parseInt(productId)) {
                item.dataset.incart = !JSON.parse(item.dataset.incart);
            }
        });

        if (addToCartBtn.innerHTML == 'Ajouter au panier') {
            cartBtn.forEach((item, index) => {
                if (item.querySelector('.cart-count-lable')) item.querySelector('.cart-count-lable').innerHTML = parseInt(item.querySelector('.cart-count-lable').innerHTML) + 1;
                else item.innerHTML += `<span class="ec-cart-noti ec-header-count cart-count-lable">1</span>`
            });
            addToCartBtn.innerHTML = 'Supprimer du panier';
            addToCartBtn.style.backgroundColor = '#ff0000';
            document.querySelector('.cart-btn').click();
        } else {
            cartBtn.forEach((item, index) => {
                //enlever 1 au nombre de produit dans le panier
                if (parseInt(item.querySelector('.cart-count-lable').innerHTML) == 1) item.querySelector('.cart-count-lable').remove();
                else item.querySelector('.cart-count-lable').innerHTML = parseInt(item.querySelector('.cart-count-lable').innerHTML) - 1;
            });
            addToCartBtn.innerHTML = 'Ajouter au panier';
            addToCartBtn.style.backgroundColor = '#3474d4';
        }

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











    /*----------------------------- Product Image Zoom --------------------------------*/
    $('.zoom-image-hover').zoom();





    /*----------------------------- single product Slider  ------------------------------ */
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



    //.nav-item
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

});