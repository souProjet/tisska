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
            this.db.query(`INSERT INTO products (name, description, price, detail, options, created, weight, package) VALUES ('${data.name}', '${data.shortDesc}', '${data.price}', '${data.desc}', '${data.personalizeOption}','${new Date().toLocaleDateString()}','${data.weight}','${data.package}')`, (err, result) => {
                if (err) reject(err);
                //return id of product
                resolve(result.insertId);
            });

        });
    }
    addProductThumb(thumbs, id) {
        return new Promise((resolve, reject) => {

            //upload thumbs in folder ./products-thumbs/ with id as name
            //check if folder with id exists
            if (!this.fs.existsSync(this.HOME == __dirname ? this.HOME + '/../products-thumbs/' + id : this.HOME + '/products-thumbs/' + id)) {
                this.fs.mkdirSync(this.HOME == __dirname ? this.HOME + '/../products-thumbs/' + id : this.HOME + '/products-thumbs/' + id);
            }
            // let thumbs = {
            //     'thumb-0':{},
            //     'thumb-5':{},
            // }
            Object.keys(thumbs).forEach((item, index) => {
                let buffer = thumbs[item].data;

                let name = id + '-' + index + '.' + thumbs[item].mimetype.split('/')[1];
                this.fs.writeFileSync(this.HOME == __dirname ? this.HOME + '/../products-thumbs/' + id + '/' + name : this.HOME + '/products-thumbs/' + id + '/' + name, buffer, (err) => {
                    if (err) reject(err);
                });

            });
            resolve({ success: true });

        });
    }
    getProducts() {
        return new Promise((resolve, reject) => {

            this.db.query(`SELECT * FROM products`, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });
    }
    formatPrice(price) {
        //price is a float ex: 34.5
        //return a string with 2 decimals ex: 34.50 €
        //replace . by ,
        return price.toFixed(2).replace('.', ',') + ' €';
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
                            <!--<span class="old-price">0€</span>-->
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
                if (result.length == 0) resolve({ error: 'product not found' });
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
                    "name":"Jean", //case à cocher
                    "couleur":"bleu", //personnalisé
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
    addPendingOrder(cart, firstname, lastname, address, city, postalCode, email, amount) {
        return new Promise((resolve, reject) => {
            this.db.query(`INSERT INTO orders (firstname, lastname, email, address, city, zip, cart, amount, created_at) VALUES ('${firstname}', '${lastname}', '${email}', '${address}', '${city}', '${postalCode}', '${cart}', '${amount}', '${new Date().toLocaleDateString()}')`, (err, result) => {
                if (err) reject(err);
                resolve(result.insertId);
            });
        });
    }

    getOrders() {
        return new Promise((resolve, reject) => {
            this.db.query(`SELECT * FROM orders`, (err, result) => {
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

}

module.exports = Product;