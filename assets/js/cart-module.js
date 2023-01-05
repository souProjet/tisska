let CartModule = class CartModule {
    constructor(token) {
        this.token = token;
        this.loggedIn = this.token != null;
        //tableau qui contiendra les produits du panier sous la forme :
        /*[{
            productID: 6,
            quantity: 3,
            options: [{
                "name":"Jean", //case à cocher
                "couleur":"bleu", //personnalisé
            },{},{}]
        }]*/
        this.cart = [];
        this.summary = {
            subtotal: 0,
            total: 0,
            shipping: 0,
            discount: 0
        }
        this.addAndRemoveToCartBtn = document.querySelector('.ec-single-cart');
        this.cartBtn = document.querySelectorAll('.cart-btn');
        this.mainQtyInput = document.querySelector('.qty-input-main');
        let self = this;
        this.cartBtn.forEach(btn => {
            btn.addEventListener('click', e => {
                e.preventDefault();
                self.fillCart(); //remplissage du panier
            });
        });


        //get user infos
        if (this.loggedIn) {
            fetch('/api/user', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + this.token
                    }

                }).then(response => response.json())
                .then(data => {
                    if (!data.error) {
                        this.cart = JSON.parse(data.cart || '[]');

                        if (localStorage.getItem('cart') && localStorage.getItem('cart') != '[]') {

                            if (this.cart.length == 0) {
                                //si le panier de l'utilisateur est vide, on le remplit avec le panier local
                                this.cart = JSON.parse(localStorage.getItem('cart') || '[]');
                                this.updateCart(this.cart);
                            }



                        }

                    } else {
                        this.loggedIn = false;
                        this.cart = JSON.parse(localStorage.getItem('cart') || '[]');
                    }
                    //si productID est défini
                    if (productID) {
                        //on vérifie si le produit est déjà dans le panier
                        let productInCart = this.cart.find(item => item.productID == productID);
                        if (productInCart) {
                            this.addAndRemoveToCartBtn.querySelector('button').innerHTML = 'Supprimer du panier';
                            this.addAndRemoveToCartBtn.querySelector('button').style.backgroundColor = '#ff0000';
                            this.mainQtyInput.value = productInCart.quantity;
                        }
                    }
                    if (this.cart.length > 0) {
                        this.cartBtn.forEach(btn => {
                            btn.innerHTML += '<span class="ec-cart-noti ec-header-count cart-count-lable">' + this.cart.length + '</span>';
                        });
                    } else {
                        //si on est sur la page checkout
                        if (window.location.pathname == '/checkout') {
                            window.location.href = '/';
                        }


                    }
                });
        }

        this.cartContainer = document.querySelector('.cart-container');
        this.cartSubTotal = document.querySelector('.cart-subtotal');
        this.cartShipping = document.querySelector('.cart-shipping');
        this.cartDiscount = document.querySelector('.cart-discount');
        this.cartTotal = document.querySelector('.cart-total');


        this.addCoupanBtn = document.querySelector('.ec-checkout-coupan');
        this.addCoupanContainer = document.querySelector('.ec-checkout-coupan-content');
        this.addCoupanBtn.addEventListener('click', function() {
            if (!self.addCoupanContainer.classList.contains('show')) {
                self.addCoupanContainer.classList.add('show');
            }
        });

        this.addCoupanContainer.querySelector('button').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            self.addCoupan(self.addCoupanContainer.querySelector('input').value);
        });

        this.addCoupanContainer.querySelector('input').addEventListener('keyup', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (e.key == 'Enter') self.addCoupan(e.target.value);
        });
    }

    addCoupan(coupan) {
        let self = this;
        fetch('/api/coupan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    coupan: coupan,
                })
            }).then(response => response.json())
            .then(data => {
                if (data.error) {
                    self.addCoupanBtn.innerHTML = data.error;
                } else {
                    self.addCoupanContainer.classList.remove('show')
                    self.cartDiscount.innerHTML = data.discount;
                    localStorage.setItem('discountCode', coupan);
                    let inPercent = data.discount.indexOf('%') > -1;
                    let discount = parseFloat(data.discount.replace('%', ''));
                    let actualSubTotal = parseFloat(self.cartSubTotal.innerHTML.replace('€', '').trim());
                    let newTotal = actualSubTotal - (inPercent ? (actualSubTotal * discount / 100) : discount) + parseFloat(self.cartShipping.innerHTML.replace('€', '').trim());
                    self.cartTotal.innerHTML = newTotal.toFixed(2) + ' €';
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            });


    }
    shippingCost(isPackage, weight) {
        if (isPackage) {
            if (weight > 0 && weight <= 250) {
                return 5.10;
            } else if (weight > 250 && weight <= 500) {
                return 6.90;
            } else if (weight > 500 && weight <= 700) {
                return 7.90;
            } else if (weight > 700 && weight <= 1000) {
                return 8.50;
            } else {
                return 9.90;
            }
        } else {
            if (weight > 0 && weight <= 20) {
                return 1.90;
            } else if (weight > 20 && weight <= 100) {
                return 3.50;
            } else if (weight > 100 && weight <= 250) {
                return 4.90;
            } else if (weight > 250 && weight <= 500) {
                return 6.10;
            } else {
                return 7.50;
            }
        }
    }

    fillCart() {
        this.cartContainer.innerHTML = '';
        this.cartSubTotal.innerHTML = '0.00 €';
        this.cartShipping.innerHTML = '0.00 €';
        this.cartTotal.innerHTML = '0.00 €';

        let cartSubTotal = 0;
        let cartShipping = 0;
        let cartTotal = 0;
        let cartTotalWeight = 0;
        let havePackage = false;

        if (this.cart.length == 0) {
            this.cartContainer.innerHTML = 'Votre panier est vide.';
        } else {
            this.cart.forEach((item, index) => {
                fetch('/api/product/' + item.productID, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    }).then(response => response.json())
                    .then(data => {
                        if (!data.error) {
                            let product = data.product;
                            cartSubTotal += product.price * item.quantity;

                            let optionsBtn = '';
                            //si item.options est un tableau vide
                            let optionPrice = 0;

                            if (item.options.length == 0) {
                                optionsBtn = `<button class="btn" style="margin-left:-26px;" onclick="cartModule.showOptionModal(${item.productID}, '${product.options}')">Ajouter des options</button>`;
                            } else {
                                let options = item.options;
                                options.forEach(option => {
                                    //pour chaque clé de l'objet option, on ajout de le prix de l'option associé dans product.options
                                    for (const key in option) {
                                        //product.options exemple : 'name,couleur[vert:0.00€-rouge:1.00€-bleu:1.00€-jaune:1.00€-bleu foncé:1.00€]'
                                        //example : si option = {couleur: 'rouge'} alors optionPrice = 1.00€
                                        if (key != 'name') {
                                            optionPrice += parseFloat(product.options.split(',').find(op => op.includes(key)).split('[')[1].split(']')[0].split('|').find(op => op.indexOf(option[key]) > -1).split(':')[1].replace('€', ''));
                                        }
                                    }
                                });
                                cartSubTotal += optionPrice;

                                optionsBtn = `<button class="btn" style="margin-left:-26px;" onclick="cartModule.showOptionModal(${item.productID}, '${product.options}')">Modifier les options</button>`;

                            }
                            cartTotalWeight += parseInt(product.weight) * item.quantity;
                            if (JSON.parse(product.package)) {
                                havePackage = true;
                            }

                            let optionPriceText = optionPrice > 0 ? `(+${optionPrice.toFixed(2)}€ d'options)` : '';
                            this.cartContainer.insertAdjacentHTML('beforeend', `
                            <li>
                                <a href="/product/${item.productID}" class="sidekka_pro_img"><img src="/product/thumb/${item.productID}-0" alt="product"></a>
                                <div class="ec-pro-content">
                                    <a href="/product/${item.productID}" class="cart_pro_title">${product.name}</a>
                                    <span class="cart-price"><span>${product.price.toFixed(2)}€</span> &times; ${item.quantity} ${optionPriceText}</span>
                                    <div class="qty-plus-minus">
                                        <div class="dec ec_qtybtn" onclick="cartModule.qtyDec(this)">-</div>
                                        <input class="qty-input" data-incart="true" data-productid="${item.productID}" type="text" name="ec_qtybtn" value="${item.quantity}">
                                        <div class="inc ec_qtybtn" onclick="cartModule.qtyInc(this)">+</div>
                                    </div>
                                    <a class="remove" onclick="cartModule.deleteProduct(${item.productID})">&times;</a>
                                    ${optionsBtn}

                                </div>
                            </li>`);

                            if (index == this.cart.length - 1) {
                                cartShipping = this.shippingCost(havePackage, cartTotalWeight)
                                cartTotal = cartShipping + cartSubTotal
                                this.cartSubTotal.innerHTML = cartSubTotal.toFixed(2) + ' €';
                                this.cartShipping.innerHTML = cartShipping.toFixed(2) + ' €';
                                this.cartTotal.innerHTML = cartTotal.toFixed(2) + ' €';

                            }
                        }
                    });


            });


        }

    }
    qtyDec(btn) {
        let input = btn.nextElementSibling;
        let product_id = input.dataset.productid;
        let productInCart = this.cart.find(item => item.productID == product_id);
        if (productInCart.quantity > 1) {
            productInCart.quantity--;
            input.value = productInCart.quantity;
            if (product_id == productID) {
                this.mainQtyInput.value = productInCart.quantity;
            }
            input.setAttribute('disabled', 'disabled')

            this.updateQuantity(product_id, productInCart.quantity);
            setTimeout(() => {
                input.removeAttribute('disabled')
            }, 200);
        }
    }
    qtyInc(btn) {
        let input = btn.previousElementSibling;
        let product_id = input.dataset.productid;
        let productInCart = this.cart.find(item => item.productID == product_id);
        productInCart.quantity++;
        input.value = productInCart.quantity;
        if (product_id == productID) {
            this.mainQtyInput.value = productInCart.quantity;
        }
        input.setAttribute('disabled', 'disabled')
        this.updateQuantity(product_id, productInCart.quantity);
        setTimeout(() => {
            input.removeAttribute('disabled')
        }, 200);
    }


    deleteProduct(product_id) {
        this.cart = this.cart.filter(item => item.productID != product_id);
        this.updateCart(this.cart);
        this.cartBtn.forEach(btn => {
            if (this.cart.length == 0) {
                btn.querySelector('span').remove();
            } else {
                btn.querySelector('span').innerHTML = this.cart.length;
            }
        });
        if (productID) {
            if (productID == product_id) {
                this.addAndRemoveToCartBtn.querySelector('button').innerHTML = 'Ajouter au panier';
                this.addAndRemoveToCartBtn.querySelector('button').style.backgroundColor = '#3474d4';
            }
        }
    }
    addProduct(product_id, quantity, options) {
        let productInCart = this.cart.find(item => item.productID == product_id);
        if (!productInCart) {
            this.cart.push({
                productID: product_id,
                quantity: quantity,
                options: options
            });
        }

        this.updateCart(this.cart, true);
        this.cartBtn.forEach(btn => {
            if (btn.querySelector('span')) {
                btn.querySelector('span').innerHTML = this.cart.length;
            } else {
                btn.innerHTML += '<span class="ec-cart-noti ec-header-count cart-count-lable">' + this.cart.length + '</span>';
            }
        });
        this.cartBtn[0].click();
    }
    updateQuantity(product_id, quantity) {

        this.cart = this.cart.map(item => {
            if (item.productID == product_id) {
                item.quantity = quantity;
            }
            return item;
        });
        this.updateCart(this.cart, true);
    }
    updateCart(newCart, notReload = false) {
        if (this.loggedIn) {
            fetch('/api/cart/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + this.token
                    },
                    body: JSON.stringify({
                        cart: newCart
                    })
                }).then(response => response.json())
                .then(data => {
                    if (data.error) {
                        console.log(data.error);
                    }
                    if (!notReload) this.fillCart();
                });
        } else {
            localStorage.setItem('cart', JSON.stringify(newCart));
            if (!notReload) this.fillCart();
        }
    }


    get getCart() {
        return this.cart;
    }

    showOptionModal(product_id, options) {
        //fermer le modal si il est ouvert
        if (document.querySelector('.ec-modal-window')) {
            document.querySelector('.ec-modal-window').remove();
        }

        //options exemple : 'name,couleur[vert:0.00€-rouge:1.00€-bleu:1.00€-jaune:1.00€-bleu foncé:1.00€]'
        let productInCart = this.getCart.find(item => item.productID == product_id);
        let actualOptions = productInCart.options;
        //actualOptions example :
        /*[{
            productID: 6,
            quantity: 3,
            options: [{
                "name":"Jean", //case à cocher
                "couleur":"bleu", //personnalisé
            },{},{}]
        }]*/
        let modalTitle = actualOptions.length > 0 ? 'Modifier les options' : 'Ajouter des options';
        let inputName = options.split(',').find(item => item.includes('name')) ? true : false;
        let quantity = productInCart.quantity;
        let selectInput = '';
        if (quantity > 1) {
            //créer un label et un select pour choisir la quantité
            selectInput = '<label>Examplaire n°</label><br>';
            selectInput += '<select class="ec-modal-select" name="quantity">';
            for (let i = 1; i <= quantity; i++) {
                selectInput += `<option value="${i}">${i}</option>`;
            }
            selectInput += '</select><br><hr><br>';
        }
        let optionContentHTML = '';
        for (let i = 0; i < quantity; i++) {
            optionContentHTML += '<div class="ec-modal-option-content" data-index="' + i + '" style="display:' + (i == 0 ? 'block' : 'none') + '">';
            if (inputName) {
                optionContentHTML += '<input type="text" class="ec-modal-option-name-input" placeholder="Prénom" value="' + (actualOptions[i] && actualOptions[i].name ? actualOptions[i].name : '') + '" style="width:100%;margin-bottom:10px; padding:10px; border:1px solid #ccc; border-radius:5px;">';
            }
            let optionsArray = options.split(',').filter(item => !item.includes('name'));
            optionsArray.forEach((item, index) => {
                let optionName = item.split('[')[0];
                let optionValues = item.split('[')[1].split(']')[0].split('|');

                //crée un container pour chaque option
                optionContentHTML += '<div class="ec-modal-option-container">';
                //ajouter un label pour chaque option
                optionContentHTML += '<label class="ec-modal-option-label" for="' + optionName + '">' + optionName + ' : </label>';

                //crée un élement select pour chaque option
                optionContentHTML += '<select class="ec-modal-select ec-modal-option-select" name="' + optionName + '">';
                optionValues.forEach((item, index) => {
                    let optionValue = item.split(':')[0];
                    let optionPrice = item.split(':')[1];
                    optionContentHTML += '<option value="' + optionValue + '" data-price="' + optionPrice + '" ' + (actualOptions[i] && actualOptions[i][optionName] == optionValue ? 'selected' : '') + '>' + optionValue + ' (+' + optionPrice + '€)</option>';
                });
                optionContentHTML += '</select>';
                optionContentHTML += '</div>';
            });

            optionContentHTML += '</div>';


        }
        //crée un simple modal responsive en HTML
        let modal = document.createElement('div');
        modal.classList.add('ec-modal-window');
        modal.innerHTML = `
        <div class="ec-modal-header">
            <h2>${modalTitle}</h2>
            <a class="ec-modal-close" onclick="cartModule.closeModal(this)">&times;</a>
        </div>
        <div class="ec-modal-body">
            ${selectInput}
            ${optionContentHTML}
        </div>
        <div class="ec-modal-footer">
            <button class="ec-btn-cancel" onclick="cartModule.closeModal(this)">Annuler</button>
            <button class="ec-btn-validate">Valider</button>
        </div>`;
        document.body.appendChild(modal);
        setTimeout(() => {
            modal.classList.add('active');

            selectInput = document.querySelector('.ec-modal-select:not(.ec-modal-option-select)');
            if (selectInput) {
                selectInput.addEventListener('change', function() {
                    //afficher seulement la box de l'index correspondant à l'options sélectionnée
                    let optionContent = document.querySelectorAll('.ec-modal-option-content');
                    optionContent.forEach(item => {
                        if (item.dataset.index == this.value - 1) {
                            item.style.display = 'block';
                        } else {
                            item.style.display = 'none';
                        }
                    });
                });
            }
            let validateBtn = document.querySelector('.ec-btn-validate');
            let self = this;
            validateBtn.addEventListener('click', function() {
                let optionContent = document.querySelectorAll('.ec-modal-option-content');
                let newOptions = [];
                optionContent.forEach((item, index) => {
                    let optionSelect = item.querySelectorAll('.ec-modal-option-select');
                    let optionNameInput = item.querySelector('.ec-modal-option-name-input');
                    let optionName = optionNameInput ? optionNameInput.value : '';
                    let option = {
                        name: optionName
                    };
                    optionSelect.forEach(item => {
                        option[item.name] = item.value;
                    });
                    newOptions.push(option);
                });
                self.cart.forEach(item => {
                    if (item.productID == product_id) {
                        item.options = newOptions;
                    }
                });


                self.updateCart(self.cart);
                self.closeModal(this);

            });
        }, 100);


    }
    closeModal(btn) {
        let modal = btn.parentNode.parentNode;
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }

    checkout() {
        //vérifie si le panier est vide
        if (this.cart.length == 0) {
            alert('Votre panier est vide');
            return false;
        }
        //vérifie si les options sont complètes
        let optionsComplete = true;
        this.cart.forEach(item => {
            if (item.options.length != item.quantity) {
                optionsComplete = false;
            }
            item.options.forEach(option => {
                if (option.name == '') {
                    optionsComplete = false;
                }
            });
        });

        if (!optionsComplete) {
            alert('Veuillez remplir toutes les options');
            return false;
        }

        window.location.href = '/checkout';
    }

    getSummary(container) {
        return new Promise((resolve, reject) => {
            let cart = this.cart;
            let totalWeight = 0;
            let orderName = 'Commande : ';
            let havePackage = false;
            cart.forEach((item, index) => {
                fetch('/api/product/' + item.productID)
                    .then(response => response.json())
                    .then(data => {
                        let product = data.product;
                        this.summary.subtotal += product.price * item.quantity;
                        if (product.package) {
                            havePackage = true;
                        }
                        let optionPrice = 0;

                        item.options.forEach(option => {
                            //pour chaque clé de l'objet option, on ajout de le prix de l'option associé dans product.options
                            for (const key in option) {
                                //product.options exemple : 'name,couleur[vert:0.00€-rouge:1.00€-bleu:1.00€-jaune:1.00€-bleu foncé:1.00€]'
                                //example : si option = {couleur: 'rouge'} alors optionPrice = 1.00€
                                if (key != 'name') {
                                    optionPrice += parseFloat(product.options.split(',').find(op => op.includes(key)).split('[')[1].split(']')[0].split('|').find(op => op.indexOf(option[key]) > -1).split(':')[1].replace('€', ''));
                                }
                            }
                        });
                        this.summary.subtotal += optionPrice;
                        totalWeight += parseInt(product.weight) * item.quantity;
                        let optionPriceText = optionPrice > 0 ? ' (+ ' + optionPrice.toFixed(2) + '€)' : '';
                        orderName += product.name + ' x ' + item.quantity + optionPriceText + ' - ';
                        container.innerHTML += `
                        <div class="col-sm-12 mb-0">
                            <div class="ec-product-inner">
                                <div class="ec-pro-image-outer">
                                    <div class="ec-pro-image">
                                        <a class="image">
                                            <img class="main-image" src="/product/thumb/${item.productID}-0" alt="Produit" />
                                            <img class="hover-image" src="/product/thumb/${item.productID}-0" alt="Produit" />
                                        </a>
                                    </div>
                                </div>
                                <div class="ec-pro-content">
                                    <h5 class="ec-pro-title"><a>${product.name}</a></h5>
                                    <span class="ec-price">
                                        <span class="new-price">${product.price.toFixed(2)}€ x ${item.quantity} ${optionPriceText}</span>
                                    </span>
                                </div>
                            </div>
                        </div>`;
                        if (index == cart.length - 1) {
                            let self = this;

                            this.summary.shipping = this.shippingCost(havePackage, totalWeight);
                            this.summary.total = this.summary.subtotal + this.summary.shipping;
                            let haveDiscountCode = localStorage.getItem('discountCode') ? localStorage.getItem('discountCode') : false;
                            if (haveDiscountCode) {
                                fetch('/api/coupan', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            coupan: haveDiscountCode,
                                        })
                                    }).then(response => response.json())
                                    .then(data => {
                                        if (!data.error) {
                                            self.summary.discount = data.discount;
                                            let isPercent = data.discount.toString().indexOf('%') > -1 ? true : false;
                                            let discount = isPercent ? self.summary.subtotal * (parseFloat(data.discount.replace('%', '')) / 100) : parseFloat(data.discount);
                                            self.summary.total -= discount;
                                            self.payment(orderName, cart);
                                            resolve(this.summary);

                                        }
                                    });
                            } else {
                                this.payment(orderName, cart);
                                resolve(this.summary);

                            }

                        }
                    });
            });
        });
    }

    payment(orderName, cart) {
        let self = this;
        fetch('/api/paymentIntent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: this.totalPrice,
                    description: orderName.substring(0, orderName.length - 3)
                })
            }).then(response => response.json())
            .then(data => {
                const stripe = Stripe(data.publishableKey);
                const elements = stripe.elements();
                const card = elements.create('card');
                let displayError = document.getElementById('card-errors');
                let displaySuccess = document.getElementById('card-success');

                card.mount('#card-element');

                card.addEventListener('change', function(event) {
                    if (event.error) {
                        displayError.textContent = event.error.message;
                    } else {
                        displayError.textContent = '';
                    }
                });
                let emailInput = document.querySelector('input[name="email"]');
                let firstnameInput = document.querySelector('input[name="firstname"]');
                let lastnameInput = document.querySelector('input[name="lastname"]');
                let addressInput = document.querySelector('input[name="address"]');
                let cityInput = document.querySelector('input[name="city"]');
                let postalCodeInput = document.querySelector('input[name="postalcode"]');
                let commentInput = document.querySelector('textarea[name="comment"]');

                let payBtnStripe = document.querySelector('.pay-btn-stripe');
                payBtnStripe.addEventListener('click', function(e) {
                    e.preventDefault();
                    if (emailInput.value != '' && firstnameInput.value != '' && lastnameInput.value != '' && addressInput.value != '' && cityInput.value != '' && postalCodeInput.value != '' && emailInput.value.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/) && postalCodeInput.value.length == 6 && postalCodeInput.value.match(/^[0-9 ]+$/)) {

                        if (payBtnStripe.disabled) return;
                        payBtnStripe.innerHTML = 'Paiement en cours...';
                        payBtnStripe.disabled = true;
                        const result = stripe.confirmCardPayment(data.clientSecret, {
                            payment_method: {
                                card: card,
                                billing_details: {
                                    name: escapeHTML(firstnameInput.value) + ' ' + escapeHTML(lastnameInput.value),
                                },
                            }
                        }).then(function(result) {
                            if (result.error) {
                                displayError.textContent = result.error.message;
                                payBtnStripe.innerHTML = 'Payer';
                                payBtnStripe.disabled = false;
                            } else {
                                // The payment has been processed!
                                if (result.paymentIntent.status === 'succeeded') {
                                    fetch('/api/order', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify({
                                                firstname: firstnameInput.value,
                                                lastname: lastnameInput.value,
                                                address: addressInput.value,
                                                city: cityInput.value,
                                                postalcode: postalCodeInput.value,
                                                email: emailInput.value,
                                                amount: self.totalPrice,
                                                comment: commentInput.value,
                                                cart: cart
                                            })
                                        }).then(response => response.json())
                                        .then(data => {
                                            if (data.error) {
                                                displayError.textContent = data.error;
                                                payBtnStripe.innerHTML = 'Payer';
                                                payBtnStripe.disabled = false;
                                            } else {
                                                displaySuccess.textContent = 'Paiement réussi !';
                                                self.cart = [];
                                                self.updateCart(self.cart);
                                                self.summary = {
                                                    subtotal: 0,
                                                    shipping: 0,
                                                    discount: 0,
                                                    total: 0
                                                };
                                                localStorage.setItem('discountCode', '');
                                                window.location.href = '/checkout/success';
                                            }
                                        })
                                }
                            }
                        });
                    } else {
                        displayError.textContent = 'Veuillez remplir tous les champs';
                    }

                });

            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }

    get totalPrice() {
        return this.summary.total;
    }
}