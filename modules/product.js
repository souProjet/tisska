let Product = class Product {
    constructor(db, fs, createImage, loadImage) {
        this.db = db;
        this.fs = fs;
        this.createImage = createImage;
        this.loadImage = loadImage;
        this.HOME = process.argv[2] == '--dev' ? __dirname : '/home/tisska';
    }
    addProduct(data) {
        return new Promise((resolve, reject) => {
            //created is a date in format 13/12/2022
            //weight is a float
            data.weight = parseFloat(data.weight);
            //package is a boolean
            data.package = data.package ? 1 : 0;
            this.db.query(`INSERT INTO products (name, description, price, detail, options, created, weight, package, theme) VALUES ('${data.name}', '${data.shortDesc}', '${data.price}', '${data.desc}', '${data.personalizeOption}','${new Date().toLocaleDateString()}','${data.weight}','${data.package}', '${data.theme}')`, (err, result) => {
                if (err) reject(err);
                //return id of product
                resolve(result.insertId);
            });

        });
    }
    deleteProduct(id) {
        return new Promise((resolve, reject) => {
            this.db.query(`DELETE FROM products WHERE id = ${id}`, (err, result) => {
                if (err) reject(err);
                resolve({ success: true });
            });
            this.fs.rm(this.HOME == __dirname ? this.HOME + '/../products-thumbs/' + id : this.HOME + '/products-thumbs/' + id, { recursive: true, force: true }, (err) => {
                if (err) reject(err);
            });
            this.db.query(`DELETE FROM reviews WHERE product_id = ${id}`, (err, result) => {
                if (err) reject(err);
                resolve({ success: true });
            });
        });
    }
    editProduct(data) {
        return new Promise((resolve, reject) => {
            //created is a date in format 13/12/2022
            //weight is a float
            data.weight = parseFloat(data.weight);
            //package is a boolean
            data.package = data.package ? 1 : 0;
            this.db.query(`UPDATE products SET name = '${data.name}', description = '${data.shortDesc}', price = '${data.price}', detail = '${data.desc}', options = '${data.personalizeOption}', weight = '${data.weight}', package = '${data.package}', theme = '${data.theme}' WHERE id = ${data.id}`, (err, result) => {
                if (err) reject(err);
                resolve({ success: true });
            });
        });
    }
    addProductThumb(thumbs, id, removedThumbList) {
        return new Promise((resolve, reject) => {
            let sortThumbDisplay = [2, 3, 4, 5, 6, 1];
            //upload thumbs in folder ./products-thumbs/ with id as name
            //check if folder with id exists
            if (!this.fs.existsSync(this.HOME == __dirname ? this.HOME + '/../products-thumbs/' + id : this.HOME + '/products-thumbs/' + id)) {
                this.fs.mkdirSync(this.HOME == __dirname ? this.HOME + '/../products-thumbs/' + id : this.HOME + '/products-thumbs/' + id);
            }
            // let thumbs = {
            //     'thumb-0':{},
            //     'thumb-5':{},
            // }
            //remove thumbs in folder ./products-thumbs/ in removedThumbList
            //removedThumbList is an array of int ex: [1, 5]
            removedThumbList.forEach((item, index) => {
                //checked if file exists
                //check each file in folder ./products-thumbs/ with id as name
                this.fs.readdirSync(this.HOME == __dirname ? this.HOME + '/../products-thumbs/' + id : this.HOME + '/products-thumbs/' + id).forEach((file, index) => {
                    if (parseInt(file.split('-')[1].split('.')[0]) == parseInt(item)) {
                        //remove file
                        this.fs.unlinkSync(this.HOME == __dirname ? this.HOME + '/../products-thumbs/' + id + '/' + file : this.HOME + '/products-thumbs/' + id + '/' + file);
                    }
                });
            });
            if (thumbs) {
                Object.keys(thumbs).forEach((item, index) => {
                    let buffer = thumbs[item].data;
                    let thumbNum = parseInt(item.split('-')[1]) ? sortThumbDisplay[parseInt(item.split('-')[1]) - 1] : 0;
                    let name = id + '-' + thumbNum + '.' + thumbs[item].mimetype.split('/')[1];
                    this.fs.writeFileSync(this.HOME == __dirname ? this.HOME + '/../products-thumbs/' + id + '/' + name : this.HOME + '/products-thumbs/' + id + '/' + name, buffer, (err) => {
                        if (err) reject(err);
                    });

                });
            }

            resolve({ success: true });

        });
    }
    getProducts() {
        return new Promise((resolve, reject) => {
            this.db.query(`SELECT * FROM products WHERE pinned = 1 UNION SELECT * FROM products WHERE pinned = 0`, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });
    }
    getProductsByTheme(theme) {
        return new Promise((resolve, reject) => {
            this.db.query(`SELECT * FROM products WHERE theme = '${theme}' AND pinned = 1 UNION SELECT * FROM products WHERE theme = '${theme}' AND pinned = 0`, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });
    }

    formatPrice(price) {
        //price is a float ex: 34.5
        //return a string with 2 decimals ex: 34.50 ???
        //replace . by ,
        return price.toFixed(2).replace('.', ',') + ' ???';
    }

    formatProductsHTML(data) {
        return new Promise((resolve, reject) => {
            let html = '';
            data.forEach((item, index) => {
                //item.created at format 13/12/2022
                let timeSinceCreation = Math.floor((new Date() - new Date(item.created)) / (1000 * 60 * 60 * 24));
                //if timeSinceCreation < 7 days, add new flag
                let newFlag = timeSinceCreation < 7 ? `<span class="flags"><span class="new">New</span></span>` : '';
                html += `<div class="col-lg-3 col-md-6 col-sm-6 col-xs-6 mb-6 ec-product-content fadeIn" data-animation="fadeIn" data-animated="true">
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
                            <!--<span class="old-price">0???</span>-->
                            <span class="new-price">${this.formatPrice(item.price)}</span>
                        </span>
                    </div>
                </div>
            </div>`;
            });
            resolve(html);
        });
    }
    getProduct(id) {
        return new Promise((resolve, reject) => {

            this.db.query(`SELECT * FROM products WHERE id=${id}`, (err, result) => {
                if (err) reject(err);
                if (result.length == 0) resolve({ error: 'Product not found' });
                resolve(result[0]);
            });
        });
    }

    addReview(product_id, content, token) {
        return new Promise(async(resolve, reject) => {
            //get private key from token
            if (token) {
                //get private key from token in db
                this.db.query(`SELECT private_key FROM users WHERE token='${token}'`, (err, result) => {
                    if (err) reject(err);
                    let private_key = result[0].private_key;
                    this.db.query(`INSERT INTO reviews (content, private_key, created, product_id) VALUES ('${content}', '${private_key}', '${new Date().toLocaleDateString()}', '${product_id}')`, (err, result) => {
                        if (err) reject(err);
                        resolve(result);
                    });
                });
            } else {
                let private_key = null;

                this.db.query(`INSERT INTO reviews (content, private_key, created, product_id) VALUES ('${content}', '${private_key}', '${new Date().toLocaleDateString()}', '${product_id}')`, (err, result) => {
                    if (err) reject(err);
                    resolve(result);
                });
            }
        });
    }

    getReviews(product_id) {
        return new Promise((resolve, reject) => {
            //return all reviews for a product and JOIN with users table to get avatar
            this.db.query(`SELECT reviews.content, reviews.created, users.avatar FROM reviews LEFT JOIN users ON reviews.private_key=users.private_key WHERE product_id=${product_id} ORDER BY id DESC`, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });
    }

    addToCart(token, product_id, quantity, options) {
        return new Promise((resolve, reject) => {
            //check if product exists
            this.db.query(`SELECT * FROM products WHERE id=${product_id}`, (err, result) => {
                if (err) reject(err);
                if (result.length > 0) {
                    //products are stored in users table with this structure {product_id}:{quantity}:{optionName}={optionValue}:{optionName}={optionValue},...
                    //options is an array [{name:optionName, value:optionValue}, {name:optionName, value:optionValue}]
                    //check if cart exists
                    this.db.query(`SELECT cart FROM users WHERE token='${token}'`, (err, result) => {
                        if (err) reject(err);
                        if (result[0].cart) {
                            //cart exists
                            let cart = result[0].cart;
                            //check if product is already in cart
                            let cartArray = cart.split(',');
                            let productInCart = false;
                            cartArray.forEach((item, index) => {
                                let itemArray = item.split(':');
                                if (itemArray[0] == product_id) {
                                    //product is already in cart
                                    productInCart = true;
                                }
                            });
                            if (!productInCart) {
                                //add product to cart
                                let newCart = cart + `,${product_id}:${quantity}`;
                                options.forEach((item, index) => {
                                    newCart += `:${item.name}=${item.value}`;
                                });
                                this.db.query(`UPDATE users SET cart='${newCart}' WHERE token='${token}'`, (err, result) => {
                                    if (err) reject(err);
                                    //return cart content
                                    if (result.affectedRows == 1) {

                                        this.db.query(`SELECT cart FROM users WHERE token='${token}'`, (err, result) => {
                                            if (err) reject(err);
                                            resolve({
                                                cart: result[0].cart,
                                                success: true
                                            });
                                        });
                                    }
                                });


                            } else {
                                //delete product from cart
                                let newCart = '';
                                cartArray.forEach((item, index) => {
                                    let itemArray = item.split(':');
                                    if (parseInt(itemArray[0]) != product_id) {
                                        newCart += item + ',';
                                    }
                                });
                                newCart = newCart.substring(0, newCart.length - 1);
                                this.db.query(`UPDATE users SET cart='${newCart}' WHERE token='${token}'`, (err, result) => {
                                    if (err) reject(err);
                                    //return cart content
                                    if (result.affectedRows == 1) {
                                        this.db.query(`SELECT cart FROM users WHERE token='${token}'`, (err, result) => {
                                            if (err) reject(err);
                                            resolve({
                                                cart: result[0].cart,
                                                success: true
                                            });
                                        });
                                    }
                                });
                            }

                        } else {
                            //cart does not exist
                            let cart = `${product_id}:${quantity}`;
                            options.forEach((item, index) => {
                                cart += `:${item.name}=${item.value}`;
                            });
                            this.db.query(`UPDATE users SET cart='${cart}' WHERE token='${token}'`, (err, result) => {
                                if (err) reject(err);
                                //return cart content
                                if (result.affectedRows == 1) {

                                    this.db.query(`SELECT cart FROM users WHERE token='${token}'`, (err, result) => {
                                        if (err) reject(err);
                                        resolve({
                                            cart: result[0].cart,
                                            success: true
                                        });
                                    });
                                }
                            });
                        }
                    });
                } else {
                    reject('Product does not exist');
                }
            });
        });
    }
    updateCart(token, newCart) {
        return new Promise((resolve, reject) => {
            //check if each product in cart exists
            //newCart : 
            /*[{
                productID: 6,
                quantity: 3,
                options: [{
                    "name":"Jean", //case ?? cocher
                    "couleur":"bleu", //personnalis??
                },{},{}]
            }]*/
            if (newCart.length == 0) {
                this.db.query(`UPDATE users SET cart='' WHERE token='${token}'`, (err, result) => {
                    if (err) reject(err);
                    resolve([]);
                });
            } else {
                let productsIDs = [];
                newCart.forEach((item, index) => {
                    productsIDs.push(item.productID);
                });
                this.db.query(`SELECT id FROM products WHERE id IN (${productsIDs})`, (err, result) => {
                    if (err) reject(err);
                    if (result.length == productsIDs.length) {
                        //update cart
                        this.db.query(`UPDATE users SET cart='${JSON.stringify(newCart)}' WHERE token='${token}'`, (err, result) => {
                            if (err) reject(err);
                            //return cart content
                            this.db.query(`SELECT cart FROM users WHERE token='${token}'`, (err, result) => {
                                if (err) reject(err);
                                resolve(result[0].cart);
                            });
                        });

                    } else {
                        reject('Product does not exist');
                    }
                });
            }
        });
    }
    setCart(token, cart) {
        return new Promise((resolve, reject) => {
            //check if each product in cart exists
            let cartArray = cart.split(',');
            let productsIDs = [];
            cartArray.forEach((item, index) => {
                let itemArray = item.split(':');
                productsIDs.push(itemArray[0]);
            });
            this.db.query(`SELECT id FROM products WHERE id IN (${productsIDs})`, (err, result) => {
                if (err) reject(err);
                if (result.length == productsIDs.length) {
                    this.db.query(`UPDATE users SET cart='${cart}' WHERE token='${token}'`, (err, result) => {
                        if (err) reject(err);
                        //return cart content
                        this.db.query(`SELECT cart FROM users WHERE token='${token}'`, (err, result) => {
                            if (err) reject(err);
                            resolve(result[0].cart);
                        });
                    });
                } else {
                    reject('Invalid cart');
                }
            });
        });
    }

    getCoupan(coupan) {
        return new Promise((resolve, reject) => {
            this.db.query(`SELECT * FROM discounts WHERE code='${coupan}'`, (err, result) => {
                if (err) reject(err);
                if (result.length == 1) {
                    resolve(result[0].discount);
                } else {
                    resolve(false);
                }
            });
        });
    }
    addPendingOrder(cart, firstname, lastname, address, city, postalCode, email, amount, comment, token, orderName) {
        return new Promise((resolve, reject) => {
            if (token) {
                this.db.query(`SELECT private_key FROM users WHERE token='${token}'`, (err, result) => {
                    if (err) reject(err);
                    if (result.length == 1) {
                        this.db.query(`INSERT INTO orders (firstname, lastname, email, address, city, zip, cart, amount, comment, created_at, private_key, ordername) VALUES ('${firstname}', '${lastname}', '${email}', '${address}', '${city}', '${postalCode}', '${cart}', '${amount}','${comment}', '${new Date().toLocaleDateString()}', '${result[0].private_key}', '${orderName}')`, (err, result) => {
                            if (err) reject(err);
                            resolve(result.insertId);
                        });
                    }
                });
            } else {
                this.db.query(`INSERT INTO orders (firstname, lastname, email, address, city, zip, cart, amount, comment, created_at, ordername) VALUES ('${firstname}', '${lastname}', '${email}', '${address}', '${city}', '${postalCode}', '${cart}', '${amount}','${comment}', '${new Date().toLocaleDateString()}', '${orderName}')`, (err, result) => {
                    if (err) reject(err);
                    resolve(result.insertId);
                });
            }
        });
    }

    getPendingsOrders() {
        return new Promise((resolve, reject) => {
            this.db.query(`SELECT * FROM orders WHERE completed=0 ORDER BY id`, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });
    }

    getOrders() {
        return new Promise((resolve, reject) => {
            this.db.query(`SELECT * FROM orders WHERE completed=1 ORDER BY id`, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });
    }
    confirmOrder(id) {
        return new Promise((resolve, reject) => {
            this.db.query(`UPDATE orders SET completed=1 WHERE id=${id}`, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });
    }

    checkPrice(cart, amount, collect) {
        return new Promise((resolve, reject) => {
            cart = JSON.parse(cart);

            let cartSubTotal = 0;
            let cartShipping = 0;
            let cartTotal = 0;
            let cartTotalWeight = 0;
            let havePackage = false;

            if (cart.length == 0) {
                resolve(false)
            } else {
                cart.forEach((item, index) => {
                    // fetch('/api/product/' + item.productID, {
                    //         method: 'GET',
                    //         headers: {
                    //             'Content-Type': 'application/json',
                    //         }
                    //     }).then(response => response.json())
                    //     .then(data => {
                    this.db.query(`SELECT * FROM products WHERE id=${item.productID}`, (err, result) => {
                        if (err) reject(err);
                        if (result.length == 1) {
                            let product = result[0];

                            cartSubTotal += product.price * item.quantity;

                            //si item.options est un tableau vide
                            let optionPrice = 0;
                            if (product.options != null && product.options != '') {
                                if (item.options.length != 0) {
                                    let options = item.options;
                                    options.forEach(option => {
                                        //pour chaque cl?? de l'objet option, on ajout de le prix de l'option associ?? dans product.options
                                        for (const key in option) {
                                            //product.options exemple : 'name,couleur[vert:0.00???-rouge:1.00???-bleu:1.00???-jaune:1.00???-bleu fonc??:1.00???]'
                                            //example : si option = {couleur: 'rouge'} alors optionPrice = 1.00???
                                            if (key != 'name') {
                                                optionPrice += parseFloat(product.options.split(',').find(op => op.includes(key)).split('[')[1].split(']')[0].split('|').find(op => op.indexOf(option[key]) > -1).split(':')[1].replace('???', ''));
                                            }
                                        }
                                    });
                                    cartSubTotal += optionPrice;
                                }
                            }
                            cartTotalWeight += parseInt(product.weight) * item.quantity;
                            if (JSON.parse(product.package)) {
                                havePackage = true;
                            }

                            if (index == cart.length - 1) {
                                cartShipping = this.shippingCost(havePackage, cartTotalWeight)
                                cartTotal = cartShipping + cartSubTotal
                                if (collect) {
                                    cartTotal = cartTotal - cartShipping;
                                }
                                if (cartTotal == amount) {
                                    resolve(true);
                                }

                            }
                        }
                    });


                });


            }
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
                return 2.90;
            } else if (weight > 100 && weight <= 250) {
                return 4.90;
            } else if (weight > 250 && weight <= 500) {
                return 6.10;
            } else {
                return 7.50;
            }
        }
    }

}

module.exports = Product;