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

document.querySelector('.cart-btn').remove(); //suppression du bouton panier

let discountListContainer = document.querySelector('.discount-list-container');

fetch('/api/discounts', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    }).then(response => response.json())
    .then(data => {
        if (data.error) {
            console.log(data.error)
            return;
        }
        let discounts = data.discounts;
        if (discounts.length == 0) {
            discountListContainer.innerHTML = '<p class="text-center">Aucun code promo pour le moment</p>';
            return;
        }
        discounts.forEach(discount => {
            discountListContainer.innerHTML += `
            <tr id="discount-${discount.id}">
                <td>${discount.code}</td>
                <td>${discount.discount}</td>
                <td><a class="btn" style="color:red;" onclick="deleteDiscount(${parseInt(discount.id)})">Supprimer</a></td>
            </tr>
            `;
        });
    });

function deleteDiscount(discountID) {
    fetch('/api/discount/' + discountID, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        }).then(response => response.json())
        .then(data => {
            if (data.error) {
                console.log(data.error)
                return;
            }
            document.querySelector('#discount-' + discountID).remove();

        });
}

function addDiscount() {
    let randomCode = '';
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let i = 0; i < 8; i++) {
        randomCode += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    discountListContainer.innerHTML += `
    <tr class="editable-discount">
        <td contenteditable="true">${randomCode}</td>
        <td contenteditable="true">10%</td>
        <td><a class="btn" style="color:green;" onclick="saveDiscount(this)">Enregistrer</a></td>
    </tr>
    `;
}

function saveDiscount(element) {
    let code = element.parentElement.parentNode.querySelector('td:nth-child(1)').innerText;
    let discount = element.parentElement.parentNode.querySelector('td:nth-child(2)').innerText;
    if (code == '' || discount == '') {
        alert('Veuillez remplir tous les champs');
        return;
    }
    if (discount.indexOf('%') == -1 || parseInt(discount.split('%')[0]) > 100 || parseInt(discount.split('%')[0]) < 0) {
        alert('Veuillez indiquer un pourcentage valide');
        return;
    }
    fetch('/api/discount/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                code: code,
                discount: discount
            })

        }).then(response => response.json())
        .then(data => {
            if (data.error) {
                console.log(data.error)
                return;
            }
            element.parentElement.parentElement.remove();
            discountListContainer.innerHTML += `
            <tr id="discount-${data.discount.id}">
                <td>${data.discount.code}</td>
                <td>${data.discount.discount}</td>
                <td><a class="btn" style="color:red;" onclick="deleteDiscount(${parseInt(data.discount.id)})">Supprimer</a></td>
            </tr>
            `;
        });
}






let ordersListContainer = document.querySelector('.orders-list-container');
fetch('/api/pendingsorders', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    }).then(response => response.json())
    .then(data => {
        if (data.error) {
            console.log(data.error)
            return;
        }
        let orders = data.orders;
        if (orders.length == 0) {
            ordersListContainer.innerHTML = '<p class="text-center">Aucune commande pour le moment</p>';
            return;
        }

        orders.forEach(order => {
            let cart = JSON.parse(order.cart);
            //let orderName = '';
            ordersListContainer.innerHTML += `
            <tr id="order-${order.id}">
                <td>${order.ordername}</td>
                <td>
                    <a class="btn" onclick='openOptionModal(\`${JSON.stringify(cart)}\`, \`${order.ordername}\`)'>Options</a>
                </td>
                <td>${order.created_at}</td>
                <td>${order.amount.toFixed(2)}€</td>
                <td>${order.firstname} ${order.lastname}</td>
                <td>${order.address}, ${order.city} ${order.zip}</td>
                <td>${order.email}</td>
                <td><button class="btn btn-primary" onclick="alert(\`${escapeHTML(order.comment)}\`);">Voir</td>
                <td class="text-right">
                    <button class="btn btn-primary" onclick="confirmOrder(${parseInt(order.id)})"><img height="20" width="20" src="/public/img/confirm.svg" alt="checked" class="order-status" ></button>
                </td>
            </tr>
            `;
        });
    });

let historyOrdersListContainer = document.querySelector('.history-orders-list-container');
let historyOrdersInfo = document.querySelector('.dataTables_info');
let historyOrdersPagination = document.querySelector('.pagination-order-history');

fetch('/api/orders', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    }).then(response => response.json())
    .then(data => {
        if (data.error) {
            console.log(data.error)
            return;
        }
        let orders = data.orders;
        if (orders.length == 0) {
            ordersListContainer.innerHTML = '<p class="text-center">Aucune commande pour le moment</p>';
            return;
        }
        //forEach seulement sur les 10 dernières commandes
        orders.filter((order, index) => index < 10).forEach((order, index) => {
            let cart = JSON.parse(order.cart);

            historyOrdersListContainer.innerHTML += `
            <tr class="${index%2==0?'even':'odd'}">
                <td>${order.ordername}</td>
                <td>
                    <a class="btn" onclick='openOptionModal(\`${JSON.stringify(cart)}\`, \`${order.ordername}\`)'>Options</a>
                </td>
                <td>${order.amount.toFixed(2)}€</td>
                <td>${order.firstname} ${order.lastname}</td>
                <td>${order.address}, ${order.city} ${order.zip}</td>
                <td>${order.email}</td>
                <td><button class="btn btn-primary" onclick="alert(\`${escapeHTML(order.comment)}\`);">Voir</td>
                <td>${order.created_at}</td>
            </tr>`;
        });

        historyOrdersInfo.innerHTML = `Affichage de 1 à ${orders.length > 10 ? 10 : orders.length} sur ${orders.length} entrées`;

        let nbPages = Math.ceil(orders.length / 10);
        if (nbPages > 1) {
            for (let i = 1; i <= nbPages; i++) {
                historyOrdersPagination.innerHTML += `<li class="paginate_button paginate-btn-order-history page-item ${i==1?'active':''}"><a aria-controls="responsive-data-table" data-dt-idx="1" tabindex="0" class="page-link">${i}</a></li>`;
            }
            let paginateBtns = document.querySelectorAll('.paginate-btn-order-history');
            paginateBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    let page = parseInt(e.target.innerHTML);
                    historyOrdersListContainer.innerHTML = '';
                    orders.filter((order, index) => index >= (page - 1) * 10 && index < page * 10).forEach((order, index) => {
                        let cart = JSON.parse(order.cart);

                        historyOrdersListContainer.innerHTML += `
                        <tr class="${index%2==0?'even':'odd'}">
                            <td>${order.ordername}</td>
                            <td>
                                <a class="btn" onclick='openOptionModal(\`${JSON.stringify(cart)}\`, \`${order.ordername}\`)'>Options</a>
                            </td>
                            <td>${order.amount.toFixed(2)}€</td>
                            <td>${order.firstname} ${order.lastname}</td>
                            <td>${order.address}, ${order.city} ${order.zip}</td>
                            <td>${order.email}</td>
                            <td><button class="btn btn-primary" onclick="alert(\`${escapeHTML(order.comment)}\`);">Voir</td>
                            <td>${order.created_at}</td>
                        </tr>`;
                    });
                    historyOrdersInfo.innerHTML = `Affichage de ${((page - 1) * 10) + 1} à ${page * 10 > orders.length ? orders.length : page * 10} sur ${orders.length} entrées`;
                    paginateBtns.forEach(btn => {
                        btn.classList.remove('active');
                    });
                    btn.classList.add('active');
                });
            })
        }


        loader.classList.add('hide');
        loaderOverlay.classList.add('hide');
        setTimeout(() => {
            loader.remove();
            loaderOverlay.remove();
        }, 300);

    });



function confirmOrder(orderID) {
    fetch('/api/order/confirm/' + orderID, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        }).then(response => response.json())
        .then(data => {
            if (data.error) {
                console.log(data.error)
                return;
            }
            document.querySelector('#order-' + orderID).remove();

        });
}

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


//############################################################################################################
//                                   CODE SPÉCIFIQUE À LA PAGE ADMIN
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