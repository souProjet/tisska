//#############################################################################################################################
//                                                  IMPORTS MODULES
//#############################################################################################################################
const express = require('express'); // express module
const fileupload = require('express-fileupload'); // file upload module
const app = express();
const bodyParser = require('body-parser'); // body parser module for json
const cookieParser = require('cookie-parser'); // cookie parser module for cookies
const mysql = require('mysql'); // mysql module for database 
const bcrypt = require('bcrypt'); // bcrypt module for password encryption
const config = require('./config'); // config file
const fs = require('fs'); // file system module
const { createCanvas, loadImage } = require('canvas'); // canvas module for image manipulation
const stripe = require('stripe')(config.STRIPE_SECRET_KEY); // stripe module for payment
const paypal = require('paypal-rest-sdk'); // paypal module for payment
const HOME = process.argv[2] == '--dev' ? __dirname : '/home/tisska'; //if arg --dev -> HOME = __dirname  else HOME = /home/tisska

//#############################################################################################################################
//                                                  CONSTANTS
//#############################################################################################################################
const PORT = config.PORT;
const APP_NAME = config.APP_NAME;

//#############################################################################################################################
//                                                  CONFIGURATION
//#############################################################################################################################
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cookieParser()); // for parsing cookies
app.use(fileupload()); // for parsing files
app.use('/public', express.static(__dirname + '/assets')); // for parsing static files (css, js, images, etc...)


//#############################################################################################################################
//                                               CONNEXION A LA BASE DE DONNEES
//#############################################################################################################################
const db = mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
});
db.connect(function(err) {
    if (err) throw err;
    console.log(`${APP_NAME} Connexion à la base de données mysql réussie`);
});

//#############################################################################################################################
//                                                  FUNCTIONS
//#############################################################################################################################
function escapeHTML(text) {
    return text ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;') : '';
}

//#############################################################################################################################
//                                                  MODULES
//#############################################################################################################################
const Login = require('./modules/login');
const login = new Login(db, bcrypt, fs, createCanvas, loadImage);
const Product = require('./modules/product');
const product = new Product(db, fs, createCanvas, loadImage);


//#############################################################################################################################
//                                                  ROUTES
//#############################################################################################################################
app.get('/', (req, res) => {
    //check if user is logged in
    let token = escapeHTML(req.cookies.token);
    login.tokenIsValid(token).then((result) => {
        login.getUser(token).then((user) => {
            login.isAdmin(token).then((isAdmin) => {
                //ajouter le token dans une balise html pour le récupérer dans le js
                let html = fs.readFileSync(__dirname + '/template/home.html', 'utf8');
                html = html.replace(/{{header}}/g, fs.readFileSync(__dirname + '/template/header.html', 'utf8'));
                html = html.replace(/{{footer}}/g, fs.readFileSync(__dirname + '/template/footer.html', 'utf8'));


                if (result && user) {
                    //get user info
                    html = html.replace(/{{token}}/gm, token);

                    html = html.replace(/{{username}}/gm, '&nbsp;&nbsp;&nbsp;' + user.firstname + ' ' + user.lastname);
                    html = html.replace(/{{avatarURL}}/gm, '/avatar/' + user.avatar);
                    html = html.replace(/{{dropdownItems}}/gm, `<li><a class="dropdown-item" href="/profile">Mes informations</a></li><li><a class="dropdown-item" href="/logout">Se déconnecter</a></li>`);
                    html = html.replace(/{{adminBtn}}/gm, isAdmin ? `
                    <a class="ec-header-btn" onclick="window.location='/admin'">
                        <div class="header-icon">
                            <img src="/public/img/stats.svg" class="svg_img header_svg" alt="">
                        </div>
                    </a>` : '');
                    html = html.replace(/{{adminBtnMobile}}/gm, isAdmin ? `
                    <div class="ec-nav-panel-icons">
                        <a class="toggle-cart ec-header-btn" onclick="window.location='/admin'">
                            <img src="/public/img/stats.svg" class="svg_img header_svg" alt="icon">
                        </a>
                    </div>` : '');
                    html = html.replace(/{{avatarLink}}/gm, '/profile');

                    html = html.replace(/{{mobileLogoutBtn}}/gm, `
                    <div class="ec-nav-panel-icons">
                        <a class="toggle-cart ec-header-btn" onclick="window.location='/logout'">
                            <img src="/public/img/logout.svg" class="svg_img header_svg" alt="icon">
                        </a>
                    </div>`);
                } else {
                    html = html.replace(/{{token}}/gm, '');
                    html = html.replace(/{{username}}/gm, '');
                    html = html.replace(/{{avatarURL}}/gm, '/public/img/defaultAvatar.svg');
                    html = html.replace(/{{dropdownItems}}/gm, `<li><a class="dropdown-item" href="/login">Se connecter</a></li><li><a class="dropdown-item" href="/register">S'inscrire</a></li>`);
                    html = html.replace(/{{adminBtn}}/gm, '');
                    html = html.replace(/{{avatarLink}}/gm, '/login');
                    html = html.replace(/{{mobileLogoutBtn}}/gm, '');
                    html = html.replace(/{{adminBtnMobile}}/gm, '');
                }

                product.getProducts().then((products) => {
                    product.formatProductsHTML(products).then((productsHTML) => {
                        if (isAdmin) {
                            productsHTML = `
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
                            </div>` + productsHTML;
                        }
                        html = html.replace('{{products}}', productsHTML);


                        res.send(html);
                    });
                });
            });
        });
    });

});

app.get('/login', (req, res) => {
    let token = escapeHTML(req.cookies.token);
    login.tokenIsValid(token).then((result) => {
        if (result) {
            res.redirect('/');
        } else {
            let html = fs.readFileSync(__dirname + '/template/login.html', 'utf8');
            html = html.replace('{{footer}}', fs.readFileSync(__dirname + '/template/footer.html', 'utf8'));
            res.send(html);
        }
    });
});

app.get('/register', (req, res) => {
    let token = escapeHTML(req.cookies.token);
    login.tokenIsValid(token).then((result) => {
        if (result) {
            res.redirect('/');
        } else {
            let html = fs.readFileSync(__dirname + '/template/register.html', 'utf8');
            html = html.replace('{{footer}}', fs.readFileSync(__dirname + '/template/footer.html', 'utf8'));
            res.send(html);
        }
    });
});

app.get('/logout', (req, res) => {
    let token = escapeHTML(req.cookies.token);
    login.tokenIsValid(token).then((result) => {
        if (result) {
            //delete cookie token
            res.clearCookie('token');
            res.redirect('/');
        } else {
            res.redirect('/');
        }
    });
});

app.get('/addproduct', (req, res) => {
    let token = escapeHTML(req.cookies.token);
    login.tokenIsValid(token).then((result) => {
        if (result) {
            //verify if user is admin
            login.isAdmin(token).then((isAdmin) => {
                if (isAdmin) {
                    login.getUser(token).then((user) => {
                        if (user) {
                            let html = fs.readFileSync(__dirname + '/template/addproduct.html', 'utf8');
                            html = html.replace(/{{token}}/gm, token);
                            html = html.replace(/{{header}}/g, fs.readFileSync(__dirname + '/template/header.html', 'utf8'));
                            html = html.replace(/{{footer}}/g, fs.readFileSync(__dirname + '/template/footer.html', 'utf8'));
                            html = html.replace(/{{avatarURL}}/gm, '/avatar/' + user.avatar);
                            html = html.replace(/{{dropdownItems}}/gm, `<li><a class="dropdown-item" href="/profile">Mes informations</a></li><li><a class="dropdown-item" href="/logout">Se déconnecter</a></li>`);
                            html = html.replace(/{{adminBtn}}/gm, isAdmin ? `
                            <a class="ec-header-btn" onclick="window.location='/admin'">
                                <div class="header-icon">
                                    <img src="/public/img/stats.svg" class="svg_img header_svg" alt="">
                                </div>
                            </a>` : '');
                            html = html.replace(/{{adminBtnMobile}}/gm, isAdmin ? `
                            <div class="ec-nav-panel-icons">
                                <a class="toggle-cart ec-header-btn" onclick="window.location='/admin'">
                                    <img src="/public/img/stats.svg" class="svg_img header_svg" alt="icon">
                                </a>
                            </div>` : '');
                            html = html.replace(/{{avatarLink}}/gm, '/profile');
                            html = html.replace(/{{mobileLogoutBtn}}/gm, `
                            <div class="ec-nav-panel-icons">
                                <a class="toggle-cart ec-header-btn" onclick="window.location='/logout'">
                                    <img src="/public/img/logout.svg" class="svg_img header_svg" alt="icon">
                                </a>
                            </div>`);



                            html = html.replace('{{username}}', '&nbsp;&nbsp;&nbsp;' + user.firstname + ' ' + user.lastname);



                            res.send(html);
                        } else {
                            res.status(404).sendFile(__dirname + '/template/404.html');
                        }

                    });

                } else {
                    res.status(404).sendFile(__dirname + '/template/404.html');
                }
            });
        } else {
            res.status(404).sendFile(__dirname + '/template/404.html');
        }
    });
});

app.get('/editproduct/:id', (req, res) => {
    let id = escapeHTML(req.params.id);
    let token = escapeHTML(req.cookies.token);
    login.tokenIsValid(token).then((result) => {
        if (result) {
            //verify if user is admin
            login.isAdmin(token).then((isAdmin) => {
                if (isAdmin) {
                    login.getUser(token).then((user) => {
                        if (user) {
                            product.getProduct(id).then((product) => {
                                if (!product.error) {
                                    let html = fs.readFileSync(__dirname + '/template/editproduct.html', 'utf8');
                                    html = html.replace(/{{token}}/gm, token);
                                    html = html.replace(/{{header}}/g, fs.readFileSync(__dirname + '/template/header.html', 'utf8'));
                                    html = html.replace(/{{footer}}/g, fs.readFileSync(__dirname + '/template/footer.html', 'utf8'));
                                    html = html.replace(/{{avatarURL}}/gm, '/avatar/' + user.avatar);
                                    html = html.replace(/{{dropdownItems}}/gm, `<li><a class="dropdown-item" href="/profile">Mes informations</a></li><li><a class="dropdown-item" href="/logout">Se déconnecter</a></li>`);
                                    html = html.replace(/{{adminBtn}}/gm, isAdmin ? `
                                    <a class="ec-header-btn" onclick="window.location='/admin'">
                                        <div class="header-icon">
                                            <img src="/public/img/stats.svg" class="svg_img header_svg" alt="">
                                        </div>
                                    </a>` : '');
                                    html = html.replace(/{{adminBtnMobile}}/gm, isAdmin ? `
                                    <div class="ec-nav-panel-icons">
                                        <a class="toggle-cart ec-header-btn" onclick="window.location='/admin'">
                                            <img src="/public/img/stats.svg" class="svg_img header_svg" alt="icon">
                                        </a>
                                    </div>` : '');
                                    html = html.replace(/{{avatarLink}}/gm, '/profile');
                                    html = html.replace(/{{mobileLogoutBtn}}/gm, `
                                    <div class="ec-nav-panel-icons">
                                        <a class="toggle-cart ec-header-btn" onclick="window.location='/logout'">
                                            <img src="/public/img/logout.svg" class="svg_img header_svg" alt="icon">
                                        </a>
                                    </div>`);
                                    html = html.replace('{{username}}', '&nbsp;&nbsp;&nbsp;' + user.firstname + ' ' + user.lastname);
                                    html = html.replace('{{productID}}', product.id);
                                    html = html.replace('{{productName}}', product.name);
                                    html = html.replace('{{productPrice}}', product.price);
                                    html = html.replace('{{productDescription}}', product.description);
                                    html = html.replace('{{productDetails}}', product.detail);
                                    html = html.replace('{{productWeight}}', product.weight);
                                    html = html.replace('{{packageChecked}}', JSON.parse(product.package) ? 'checked' : '');

                                    html = html.replace('{{productFirstMinia}}', '/product/thumb/' + product.id + '-0');

                                    let productThumbsHTML = '';
                                    let thumbs = fs.readdirSync(HOME + '/products-thumbs/' + id);
                                    for (let i = 1; i < thumbs.length; i++) {
                                        productThumbsHTML += `
                                        <div class="thumb-upload">
                                            <div class="thumb-edit">
                                                <input type='file' id="thumbUpload01" class="ec-image-upload" accept=".png, .jpg, .jpeg" />
                                                <label for="imageUpload"><img src="/public/img/edit.svg"
                                                        class="svg_img header_svg" alt="edit" /></label>
                                            </div>
                                            <div class="thumb-preview ec-preview">
                                                <div class="image-thumb-preview">
                                                    <img class="image-thumb-preview ec-image-preview" src="/product/thumb/${product.id}-${i}" alt="preview">
                                                </div>
                                            </div>
                                        </div>
                                        `;
                                    }
                                    for (let i = thumbs.length; i < 7; i++) {
                                        productThumbsHTML = `
                                        <div class="thumb-upload">
                                                    <div class="thumb-edit">
                                                        <input type='file' id="thumbUpload01" class="ec-image-upload" accept=".png, .jpg, .jpeg" />
                                                        <label for="imageUpload"><img src="/public/img/edit.svg"
                                                                class="svg_img header_svg" alt="edit" /></label>
                                                    </div>
                                                    <div class="thumb-preview ec-preview">
                                                        <div class="image-thumb-preview">
                                                            <img class="image-thumb-preview ec-image-preview" src="/public/img/vender-upload-thumb-preview.jpg" alt="edit" />
                                                        </div>
                                                    </div>
                                                </div>
                                        ` + productThumbsHTML;
                                    }

                                    html = html.replace('{{productThumbs}}', productThumbsHTML);

                                    html = html.replace('{{nameChecked}}', product.options.split(',').includes('name') ? 'checked' : '');

                                    let productOptionsHTML = '';
                                    if (product.options !== '') {
                                        if (product.options.split(',').filter(o => o !== 'name').length > 0) {

                                            let options = product.options.split(',').filter(o => o !== 'name');
                                            for (let i = 0; i < options.length; i++) {
                                                let choiceHTML = '';
                                                let optionName = options[i].split('[')[0];
                                                let choices = options[i].split('[')[1].split(']')[0].split('-');
                                                for (let j = 0; j < choices.length; j++) {
                                                    choiceHTML += `
                                            <div class="form-check form-check-inline">
                                                <label>${choices[j].split(':')[0]} (+${parseFloat(choices[j].split(':')[1].replace('€', '').trim()).toFixed(2)}€)</label>
                                            </div>`;

                                                }
                                                productOptionsHTML += `
                                        <div class="col-md-6 mb-25">
                                            <label class="form-label">${optionName}</label>
                                            <div class="form-checkbox-box">
                                                ${choiceHTML}
                                            </div>
                                        </div> `;
                                            }
                                        }
                                    }

                                    html = html.replace('{{productOptions}}', productOptionsHTML);
                                    html = html.replace('{{productOptionsText}}', product.options.split(',').filter(o => o !== 'name').join(', '));

                                    res.send(html);
                                } else {
                                    res.status(404).sendFile(__dirname + '/template/404.html');
                                }
                            });
                        } else {
                            res.status(404).sendFile(__dirname + '/template/404.html');
                        }
                    });
                } else {
                    res.status(404).sendFile(__dirname + '/template/404.html');
                }
            });
        } else {
            res.status(404).sendFile(__dirname + '/template/404.html');
        }
    });
});



app.get('/product/:id', (req, res) => {
    let id = escapeHTML(req.params.id);
    let token = escapeHTML(req.cookies.token);
    login.tokenIsValid(token).then((result) => {
        login.getUser(token).then((user) => {
            login.isAdmin(token).then((isAdmin) => {
                product.getProduct(id).then((product) => {
                    if (!product.error) {
                        let html = fs.readFileSync(__dirname + '/template/product.html', 'utf8');
                        html = html.replace('{{header}}', fs.readFileSync(__dirname + '/template/header.html', 'utf8'));
                        html = html.replace('{{footer}}', fs.readFileSync(__dirname + '/template/footer.html', 'utf8'));
                        if (result && user) {
                            //get user info
                            html = html.replace(/{{token}}/gm, token);

                            html = html.replace(/{{username}}/gm, '&nbsp;&nbsp;&nbsp;' + user.firstname + ' ' + user.lastname);
                            html = html.replace(/{{avatarURL}}/gm, '/avatar/' + user.avatar);
                            html = html.replace(/{{dropdownItems}}/gm, `<li><a class="dropdown-item" href="/profile">Mes informations</a></li><li><a class="dropdown-item" href="/logout">Se déconnecter</a></li>`);
                            html = html.replace(/{{adminBtn}}/gm, isAdmin ? `
                            <a class="ec-header-btn" onclick="window.location='/admin'">
                                <div class="header-icon">
                                    <img src="/public/img/stats.svg" class="svg_img header_svg" alt="">
                                </div>
                            </a>` : '');
                            html = html.replace(/{{adminBtnMobile}}/gm, isAdmin ? `
                            <div class="ec-nav-panel-icons">
                                <a class="toggle-cart ec-header-btn" onclick="window.location='/admin'">
                                    <img src="/public/img/stats.svg" class="svg_img header_svg" alt="icon">
                                </a>
                            </div>` : '');
                            html = html.replace(/{{avatarLink}}/gm, '/profile');

                            html = html.replace(/{{mobileLogoutBtn}}/gm, `
                            <div class="ec-nav-panel-icons">
                                <a class="toggle-cart ec-header-btn" onclick="window.location='/logout'">
                                    <img src="/public/img/logout.svg" class="svg_img header_svg" alt="icon">
                                </a>
                            </div>`);
                            html = html.replace(/{{editBtn}}/gm, isAdmin ? `<button onclick="window.location='/editproduct/${product.id}'" class="btn btn-secondary">Modifier</button>` : '');

                        } else {
                            html = html.replace(/{{token}}/gm, '');
                            html = html.replace(/{{username}}/gm, '');
                            html = html.replace(/{{avatarURL}}/gm, '/public/img/defaultAvatar.svg');
                            html = html.replace(/{{dropdownItems}}/gm, `<li><a class="dropdown-item" href="/login">Se connecter</a></li><li><a class="dropdown-item" href="/register">S'inscrire</a></li>`);
                            html = html.replace(/{{adminBtn}}/gm, '');
                            html = html.replace(/{{avatarLink}}/gm, '/login');
                            html = html.replace(/{{adminBtnMobile}}/gm, '');
                            html = html.replace(/{{mobileLogoutBtn}}/gm, '');
                            html = html.replace(/{{editBtn}}/gm, '');
                        }
                        html = html.replace(/{{productId}}/gm, product.id);

                        html = html.replace(/{{productName}}/gm, product.name);
                        html = html.replace(/{{productDescription}}/gm, product.description);
                        html = html.replace(/{{productPrice}}/gm, product.price.toFixed(2).replace('.', ',') + '€');

                        //get all thumbs of the product with fs and the id when replace {{productCover}} and {{productThumbs}}
                        let thumbs = fs.readdirSync(HOME + '/products-thumbs/' + id);
                        let productCoverHTML = '';
                        let productThumbsHTML = '';
                        for (let i = 0; i < thumbs.length; i++) {
                            productCoverHTML += `
                            <div class="single-slide zoom-image-hover">
                                <img class="img-responsive" src="/product/thumb/${id}-${i}" alt="">
                            </div>`;
                            productThumbsHTML += `
                            <div class="single-slide">
                                <img class="img-responsive" src="/product/thumb/${id}-${i}" alt="">
                            </div>`;
                        }
                        html = html.replace('{{productCover}}', productCoverHTML);
                        html = html.replace('{{productThumbs}}', productThumbsHTML);

                        html = html.replace('{{productDetails}}', product.detail);

                        res.send(html);
                    } else {
                        res.redirect('/');
                    }
                });
            });
        });
    });
});

app.get('/checkout', (req, res) => {
    let token = escapeHTML(req.cookies.token);
    login.tokenIsValid(token).then((result) => {
        login.getUser(token).then((user) => {
            login.isAdmin(token).then((isAdmin) => {

                let html = fs.readFileSync(__dirname + '/template/checkout.html', 'utf8');
                html = html.replace(/{{header}}/g, fs.readFileSync(__dirname + '/template/header.html', 'utf8'));
                html = html.replace(/{{footer}}/g, fs.readFileSync(__dirname + '/template/footer.html', 'utf8'));

                if (result && user) {
                    //if cart is empty
                    if (user.cart.length == 0) {
                        res.redirect('/');
                    } else {
                        //get user info
                        html = html.replace(/{{token}}/gm, token);

                        html = html.replace(/{{username}}/gm, '&nbsp;&nbsp;&nbsp;' + user.firstname + ' ' + user.lastname);
                        html = html.replace(/{{avatarURL}}/gm, '/avatar/' + user.avatar);
                        html = html.replace(/{{dropdownItems}}/gm, `<li><a class="dropdown-item" href="/profile">Mes informations</a></li><li><a class="dropdown-item" href="/logout">Se déconnecter</a></li>`);

                        if (isAdmin) {
                            html = html.replace(/{{adminBtn}}/gm, `
                            <a class="ec-nav-link" href="/admin">
                                <div class="ec-nav-icon">
                                    <img src="/public/img/stats.svg" class="svg_img header_svg" alt="">
                                </div>
                            </a>`);
                        } else {
                            html = html.replace(/{{adminBtn}}/gm, '');
                        }
                    }
                } else {
                    html = html.replace(/{{token}}/gm, '');
                    html = html.replace(/{{username}}/gm, '');
                    html = html.replace(/{{avatarURL}}/gm, '/public/img/defaultAvatar.svg');
                    html = html.replace(/{{dropdownItems}}/gm, `<li><a class="dropdown-item" href="/login">Se connecter</a></li><li><a class="dropdown-item" href="/register">S'inscrire</a></li>`);
                    html = html.replace(/{{adminBtn}}/gm, '');
                }
                res.send(html);
            });
        });
    });
});

app.get('/checkout/success', (req, res) => {
    res.sendFile(__dirname + '/template/thankyou.html');
});

app.get('/profile', (req, res) => {
    let token = escapeHTML(req.cookies.token);
    login.tokenIsValid(token).then((result) => {
        login.getUser(token).then((user) => {
            login.isAdmin(token).then((isAdmin) => {
                if (result && user) {
                    let html = fs.readFileSync(__dirname + '/template/profile.html', 'utf8');
                    html = html.replace(/{{header}}/g, fs.readFileSync(__dirname + '/template/header.html', 'utf8'));
                    html = html.replace(/{{footer}}/g, fs.readFileSync(__dirname + '/template/footer.html', 'utf8'));

                    html = html.replace(/{{token}}/gm, token);

                    html = html.replace(/{{username}}/gm, '&nbsp;&nbsp;&nbsp;' + user.firstname + ' ' + user.lastname);
                    html = html.replace(/{{avatarURL}}/gm, '/avatar/' + user.avatar);

                    html = html.replace(/{{dropdownItems}}/gm, `<li><a class="dropdown-item" href="/profile">Mes informations</a></li><li><a class="dropdown-item" href="/logout">Se déconnecter</a></li>`);
                    html = html.replace(/{{adminBtn}}/gm, isAdmin ? `
                    <a class="ec-header-btn" onclick="window.location='/admin'">
                        <div class="header-icon">
                            <img src="/public/img/stats.svg" class="svg_img header_svg" alt="">
                        </div>
                    </a>` : '');

                    html = html.replace(/{{adminBtnMobile}}/gm, isAdmin ? `
                    <div class="ec-nav-panel-icons">
                        <a class="toggle-cart ec-header-btn" onclick="window.location='/admin'">
                            <img src="/public/img/stats.svg" class="svg_img header_svg" alt="icon">
                        </a>
                    </div>` : '');

                    html = html.replace(/{{avatarLink}}/gm, '/profile');

                    html = html.replace(/{{mobileLogoutBtn}}/gm, `
                    <div class="ec-nav-panel-icons">
                        <a class="toggle-cart ec-header-btn" onclick="window.location='/logout'">
                            <img src="/public/img/logout.svg" class="svg_img header_svg" alt="icon">
                        </a>
                    </div>`);




                    html = html.replace(/{{firstname}}/gm, user.firstname);
                    html = html.replace(/{{lastname}}/gm, user.lastname);
                    html = html.replace(/{{email}}/gm, user.email);
                    html = html.replace(/{{address}}/gm, user.address);
                    html = html.replace(/{{city}}/gm, user.city);
                    html = html.replace(/{{zip}}/gm, user.zip);

                    res.send(html);
                } else {
                    res.redirect('/login');
                }
            });
        });
    });
});



app.get('/admin', (req, res) => {
    let token = escapeHTML(req.cookies.token);
    login.tokenIsValid(token).then((result) => {
        login.getUser(token).then((user) => {
            login.isAdmin(token).then((isAdmin) => {
                if (result && user && isAdmin) {
                    let html = fs.readFileSync(__dirname + '/template/admin.html', 'utf8');
                    html = html.replace(/{{header}}/g, fs.readFileSync(__dirname + '/template/header.html', 'utf8'));
                    html = html.replace(/{{footer}}/g, fs.readFileSync(__dirname + '/template/footer.html', 'utf8'));

                    html = html.replace(/{{token}}/gm, token);

                    html = html.replace(/{{username}}/gm, '&nbsp;&nbsp;&nbsp;' + user.firstname + ' ' + user.lastname);
                    html = html.replace(/{{avatarURL}}/gm, '/avatar/' + user.avatar);
                    html = html.replace(/{{dropdownItems}}/gm, `<li><a class="dropdown-item" href="/profile">Mes informations</a></li><li><a class="dropdown-item" href="/logout">Se déconnecter</a></li>`);
                    html = html.replace(/{{adminBtn}}/gm, isAdmin ? `
                    <a class="ec-header-btn" onclick="window.location='/admin'">
                        <div class="header-icon">
                            <img src="/public/img/stats.svg" class="svg_img header_svg" alt="">
                        </div>
                    </a>` : '');
                    html = html.replace(/{{avatarLink}}/gm, '/');


                    //number of users
                    db.query('SELECT COUNT(*) AS count FROM users', (err, result) => {
                        if (err) throw err;
                        result[0].count = result[0].count || 0;
                        html = html.replace(/{{nbUsers}}/gm, result[0].count);

                        //number of products
                        db.query('SELECT COUNT(*) AS count FROM products', (err, result) => {
                            if (err) throw err;
                            result[0].count = result[0].count || 0;
                            html = html.replace(/{{nbProducts}}/gm, result[0].count);

                            //number of orders this month (created_at is VARCHAR in format dd/mm/yyyy)
                            let date = new Date();
                            let month = date.getMonth() + 1;
                            let year = date.getFullYear();
                            db.query('SELECT COUNT(*) AS count FROM orders', (err, result) => {
                                if (err) throw err;
                                result[0].count = result[0].count || 0;
                                html = html.replace(/{{nbOrders}}/gm, result[0].count);

                                //revenue this month (amount is DOUBLE)
                                db.query('SELECT SUM(amount) AS sum FROM orders', (err, result) => {
                                    if (err) throw err;
                                    result[0].sum = result[0].sum || 0;
                                    html = html.replace(/{{revenue}}/gm, result[0].sum.toFixed(2));

                                    res.send(html);
                                });
                            });

                        });

                    });
                } else {
                    res.redirect('/');
                }
            });
        });
    });
});

//#############################################################################################################################
//                                                  SEMI-STATIC ROUTES
//#############################################################################################################################
app.get('/avatar/:avatarID', (req, res) => {
    let avatarID = escapeHTML(req.params.avatarID);
    res.sendFile(HOME + '/avatars/' + avatarID + '.png');
});
//product thumb /productthumb/{id}-{number}
app.get('/product/thumb/:id-:number', (req, res) => {
    let id = escapeHTML(req.params.id);
    let number = escapeHTML(req.params.number);
    //send product thumb, path = /products-thumbs/${id}/{id}-{number}.${i dont know}
    //find the file extension
    let extension = '';
    let files = fs.readdirSync(HOME + '/products-thumbs/' + id);
    files.forEach((file) => {
        if (file.includes(number)) {
            extension = file.split('.')[1];
        }
    });
    res.sendFile(HOME + '/products-thumbs/' + id + '/' + id + '-' + number + '.' + extension);

});



//#############################################################################################################################
//                                                  API
//#############################################################################################################################
app.post('/api/register', (req, res) => {
    let firstname = escapeHTML(req.body.firstname);
    let lastname = escapeHTML(req.body.lastname);
    let email = escapeHTML(req.body.email);
    let password = escapeHTML(req.body.password);
    let address = escapeHTML(req.body.address);
    let city = escapeHTML(req.body.city);
    let zip = escapeHTML(req.body.zip).replace(/ /g, '')
        // verify if all fields are filled
    if (!firstname || !lastname || !email || !password || !address || !city || !zip) {
        res.json({
            error: 'Veuillez remplir tous les champs.'
        });
        return;
    }
    // verify if email is valid
    if (!email.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)) {
        res.json({
            error: 'Veuillez entrer une adresse email valide.'
        });
        return;
    }
    // verify if password is valid
    if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/)) {
        res.json({
            error: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.'
        });
        return;
    }
    // verify if zip is valid
    if (!zip.match(/^[0-9]{5}$/)) {
        res.json({
            error: 'Veuillez entrer un code postal valide.'
        });
        return;
    }
    // register
    login.register(firstname, lastname, email, password, address, city, zip).then((result) => {
        res.json(result);
    });

});

app.post('/api/login', (req, res) => {
    let email = escapeHTML(req.body.email);
    let password = escapeHTML(req.body.password);
    // verify if all fields are filled
    if (!email || !password) {
        res.json({
            error: 'Veuillez remplir tous les champs.'
        });
        return;
    }
    // verify if email is valid
    if (!email.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)) {
        res.json({
            error: 'Veuillez entrer une adresse email valide.'
        });
        return;
    }

    // login
    login.login(email, password).then((result) => {
        res.json(result);
    });
});

app.get('/api/user', (req, res) => {
    let token = escapeHTML(req.headers.authorization.replace('Bearer ', ''));
    login.tokenIsValid(token).then((result) => {
        if (result) {
            login.getUser(token).then((result) => {
                res.json(result);
            });
        } else {
            res.json({
                error: 'Token invalide.'
            });
        }
    });
});

app.post('/api/addproduct', (req, res) => {
    let token = escapeHTML(req.headers.authorization.replace('Bearer ', ''));
    login.tokenIsValid(token).then((result) => {
        if (result) {
            //verify if user is admin
            login.isAdmin(token).then((result) => {
                if (result) {
                    let data = req.body;
                    //escape all fields except personalizeOption

                    //verify if all fields are filled
                    if (!data.name || !data.weight || !data.shortDesc || !data.price || !data.desc) {
                        res.json({
                            error: 'Veuillez remplir tous les champs.'
                        });
                        return;
                    }
                    //verify if price is valid
                    if (!data.price.match(/^[0-9]+(\.[0-9]{1,2})?$/)) {
                        res.json({
                            error: 'Veuillez entrer un prix valide.'
                        });
                        return;
                    }
                    //add product
                    //escape all fields except package
                    for (let key in data) {
                        if (key != 'package') {
                            data[key] = escapeHTML(data[key]);
                        }
                    }


                    product.addProduct(data).then((result) => {
                        if (result) {

                            res.json({
                                error: false,
                                success: 'Produit ajouté avec succès.',
                                id: result
                            });
                        }
                    });
                } else {
                    res.json({
                        error: 'Vous n\'êtes pas administrateur.'
                    });
                }
            });
        } else {
            res.json({
                error: 'Token invalide.'
            });
        }
    });
});

app.post('/api/editproduct', (req, res) => {
    let token = escapeHTML(req.headers.authorization.replace('Bearer ', ''));
    login.tokenIsValid(token).then((result) => {
        if (result) {
            //verify if user is admin
            login.isAdmin(token).then((result) => {
                if (result) {
                    let data = req.body;
                    //escape all fields except personalizeOption

                    //verify if all fields are filled
                    if (!data.name || !data.weight || !data.shortDesc || !data.price || !data.desc) {
                        res.json({
                            error: 'Veuillez remplir tous les champs.'
                        });
                        return;
                    }
                    //verify if price is valid
                    if (!data.price.match(/^[0-9]+(\.[0-9]{1,2})?$/)) {
                        res.json({
                            error: 'Veuillez entrer un prix valide.'
                        });
                        return;
                    }
                    //add product
                    //escape all fields except package
                    for (let key in data) {
                        if (key != 'package') {
                            data[key] = escapeHTML(data[key]);
                        }
                    }

                    product.editProduct(data).then((result) => {
                        if (result) {
                            res.json({
                                error: false,
                                success: 'Produit modifié avec succès.'
                            });
                        }
                    });
                } else {
                    res.json({
                        error: 'Vous n\'êtes pas administrateur.'
                    });
                }
            });
        } else {
            res.json({
                error: 'Token invalide.'
            });
        }
    });
});




app.post('/api/addproductthumb', (req, res) => {
    let token = escapeHTML(req.headers.authorization.replace('Bearer ', ''));
    login.tokenIsValid(token).then((result) => {
        if (result) {
            //verify if user is admin
            login.isAdmin(token).then((result) => {
                if (result) {
                    // formData contains the file and the product id
                    let formData = req.files;
                    let id = escapeHTML(req.body.id);
                    if (!formData) {
                        res.json({
                            error: false,
                            success: 'Aucune image sélectionnée.',
                            id: id
                        });
                        return;
                    }
                    //verify if all fields are filled
                    if (!id) {
                        res.json({
                            error: 'Veuillez remplir tous les champs.'
                        });
                        return;
                    }
                    //verify if id is valid
                    if (!id.match(/^[0-9]+$/)) {
                        res.json({
                            error: 'Veuillez entrer un id valide.'
                        });
                        return;
                    }
                    //add product thumb
                    product.addProductThumb(formData, id).then((result) => {
                        if (result) {
                            res.json({
                                error: false,
                                success: 'Image ajoutée avec succès.',
                                id: id
                            });
                        }
                    });
                } else {
                    res.json({
                        error: 'Vous n\'êtes pas administrateur.'
                    });
                }
            });
        } else {
            res.json({
                error: 'Token invalide.'
            });
        }
    });
});


app.post('/api/review', (req, res) => {
    let token = escapeHTML(req.headers.authorization.replace('Bearer', ''));
    let productId = parseInt(escapeHTML(req.body.productID));
    let content = escapeHTML(req.body.content);
    if (!productId || !content) {
        res.json({
            error: 'Veuillez remplir tous les champs.'
        });
        return;
    }
    token = token.trim();
    if (token !== '') {
        login.tokenIsValid(token).then((result) => {
            if (!result) {
                res.json({
                    error: 'Token invalide.'
                });
                return;
            }
        });
    }
    product.addReview(productId, content, token).then((result) => {
        if (result) {
            res.json({
                error: false,
                success: 'Commentaire ajouté avec succès.'
            });
        }
    });
});

app.get('/api/review/:productId', (req, res) => {
    let productId = parseInt(escapeHTML(req.params.productId));
    if (!productId) {
        res.json({
            error: 'Erreur.'
        });
        return;
    }
    product.getReviews(productId).then((result) => {
        if (result) {
            res.json({
                error: false,
                reviews: result
            });
        }
    });
});


app.get('/api/product/:productId', (req, res) => {
    let productId = parseInt(escapeHTML(req.params.productId));

    if (!productId) {
        res.json({
            error: 'Erreur.'
        });
        return;
    }
    product.getProduct(productId).then((result) => {
        if (result) {
            res.json({
                error: false,
                product: result
            });
        }
    });
});

app.delete('/api/product/:productId', (req, res) => {
    let token = escapeHTML(req.headers.authorization.replace('Bearer ', ''));
    let productId = parseInt(escapeHTML(req.params.productId));
    if (!productId) {
        res.json({
            error: 'Erreur.'
        });
        return;
    }
    login.tokenIsValid(token).then((result) => {
        if (result) {
            //verify if user is admin
            login.isAdmin(token).then((result) => {
                if (result) {
                    product.deleteProduct(productId).then((result) => {
                        if (result) {
                            res.json({
                                error: false,
                                success: 'Produit supprimé avec succès.'
                            });
                        }
                    });
                } else {
                    res.json({
                        error: 'Vous n\'êtes pas administrateur.'
                    });
                }
            });
        } else {
            res.json({
                error: 'Token invalide.'
            });
        }
    });
});


app.post('/api/cart/update', (req, res) => {
    let token = escapeHTML(req.headers.authorization.replace('Bearer ', ''));
    let newCart = req.body.cart;
    if (!newCart) {
        res.json({
            error: 'Erreur.'
        });
        return;
    }
    login.tokenIsValid(token).then((result) => {
        if (result) {
            product.updateCart(token, newCart).then((result) => {
                if (result) {
                    res.json({
                        error: false,
                        success: 'Panier mis à jour avec succès.',
                        cart: result
                    });
                }
            });
        } else {
            res.json({
                error: 'Token invalide.'
            });
        }
    });

});

app.post('/api/coupan', (req, res) => {
    let code = escapeHTML(req.body.coupan);
    if (!code) {
        res.json({
            error: 'Veuillez entrer un code.'
        });
        return;
    }
    product.getCoupan(code).then((result) => {
        if (result) {
            res.json({
                error: false,
                discount: result
            });
        } else {
            res.json({
                error: 'Code invalide.'
            });
        }
    });
});


app.post('/api/paymentIntent', async(req, res) => {
    const paymentIntent = await stripe.paymentIntents.create({
        amount: parseFloat(req.body.amount) * 100,
        currency: 'eur',
        description: escapeHTML(req.body.description),
        statement_descriptor: escapeHTML(req.body.description).substring(0, 22),
    });
    res.json({
        clientSecret: paymentIntent.client_secret,
        publishableKey: config.STRIPE_PUBLISHABLE_KEY
    });
});

app.post('/api/order', (req, res) => {
    let cart = JSON.stringify(req.body.cart);
    let firstname = escapeHTML(req.body.firstname);
    let lastname = escapeHTML(req.body.lastname);
    let address = escapeHTML(req.body.address);
    let city = escapeHTML(req.body.city);
    let postalCode = escapeHTML(req.body.postalcode);
    let email = escapeHTML(req.body.email);
    let amount = parseFloat(req.body.amount);
    let comment = escapeHTML(req.body.comment);

    if (!cart || !firstname || !lastname || !address || !city || !postalCode || !email) {
        res.json({
            error: true
        });
        return;
    }

    //insert pending order in database
    product.addPendingOrder(cart, firstname, lastname, address, city, postalCode, email, amount, comment).then((result) => {
        if (result) {
            res.json({
                error: false,
                success: 'Commande effectuée avec succès.'
            });
        }
    });

});

app.post('/profile/update', (req, res) => {
    let token = escapeHTML(req.headers.authorization.replace('Bearer ', ''));
    let firstname = escapeHTML(req.body.firstname);
    let lastname = escapeHTML(req.body.lastname);
    let address = escapeHTML(req.body.address);
    let city = escapeHTML(req.body.city);
    let postalCode = escapeHTML(req.body.zip).replace(' ', '');
    let email = escapeHTML(req.body.email);

    if (!firstname || !lastname || !address || !city || !postalCode || !email) {
        res.json({
            error: 'Veuillez remplir tous les champs.'
        });
        return;
    }

    //check email format
    if (!email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
        res.json({
            error: 'Veuillez entrer une adresse email valide.'
        });
        return;
    }

    //check postal code format
    if (!postalCode.match(/^[0-9]{5}$/)) {
        res.json({
            error: 'Veuillez entrer un code postal valide.'
        });
        return;
    }

    login.tokenIsValid(token).then((result) => {
        if (result) {
            login.updateProfile(token, firstname, lastname, address, city, postalCode, email).then((result) => {
                if (result) {
                    res.json({
                        error: false,
                        success: 'Profil mis à jour avec succès.'
                    });
                }
            });
        } else {
            res.json({
                error: 'Token invalide.'
            });
        }
    });
});

app.get('/api/orders', (req, res) => {
    let token = escapeHTML(req.headers.authorization.replace('Bearer ', ''));
    login.tokenIsValid(token).then((result) => {
        login.isAdmin(token).then((isAdmin) => {
            if (result && isAdmin) {
                product.getOrders().then((result) => {
                    if (result) {
                        res.json({
                            error: false,
                            orders: result
                        });
                    }
                });
            } else {
                res.json({
                    error: 'Token invalide.'
                });
            }
        });
    });
});

app.put('/api/order/confirm/:id', (req, res) => {
    let token = escapeHTML(req.headers.authorization.replace('Bearer ', ''));
    let id = parseInt(escapeHTML(req.params.id));
    login.tokenIsValid(token).then((result) => {
        login.isAdmin(token).then((isAdmin) => {
            if (result && isAdmin) {
                product.confirmOrder(id).then((result) => {
                    if (result) {
                        res.json({
                            error: false,
                            success: 'Commande confirmée avec succès.'
                        });
                    }
                });
            } else {
                res.json({
                    error: 'Token invalide.'
                });
            }
        });
    });
});

app.get('/api/discounts', (req, res) => {
    let token = escapeHTML(req.headers.authorization.replace('Bearer ', ''));
    login.tokenIsValid(token).then((result) => {
        login.isAdmin(token).then((isAdmin) => {
            if (result && isAdmin) {
                db.query('SELECT * FROM discounts', (err, result) => {
                    if (err) {
                        res.json({
                            error: 'Une erreur est survenue.'
                        });
                    } else {
                        res.json({
                            error: false,
                            discounts: result
                        });
                    }
                });
            } else {
                res.json({
                    error: 'Token invalide.'
                });
            }
        });
    });
});

app.delete('/api/discount/:id', (req, res) => {
    let token = escapeHTML(req.headers.authorization.replace('Bearer ', ''));
    let id = parseInt(escapeHTML(req.params.id));
    login.tokenIsValid(token).then((result) => {
        login.isAdmin(token).then((isAdmin) => {
            if (result && isAdmin) {
                db.query('DELETE FROM discounts WHERE id = ?', [id], (err, result) => {
                    if (err) {
                        res.json({
                            error: 'Une erreur est survenue.'
                        });
                    } else {
                        res.json({
                            error: false,
                            success: 'Code promo supprimé avec succès.'
                        });
                    }
                });
            } else {
                res.json({
                    error: 'Token invalide.'
                });
            }
        });
    });
});

app.post('/api/discount/add', (req, res) => {
    let token = escapeHTML(req.headers.authorization.replace('Bearer ', ''));
    let code = escapeHTML(req.body.code);
    let discount = escapeHTML(req.body.discount);
    login.tokenIsValid(token).then((result) => {
        login.isAdmin(token).then((isAdmin) => {
            if (result && isAdmin) {
                db.query('INSERT INTO discounts (code, discount) VALUES (?, ?)', [code, discount], (err, result) => {
                    if (err) {
                        res.json({
                            error: 'Une erreur est survenue.'
                        });
                    } else {
                        //return new discount
                        db.query('SELECT * FROM discounts WHERE id = ?', [result.insertId], (err, result) => {
                            if (err) {
                                res.json({
                                    error: 'Une erreur est survenue.'
                                });
                            } else {
                                res.json({
                                    error: false,
                                    success: 'Code promo ajouté avec succès.',
                                    discount: result[0]
                                });
                            }
                        });
                    }
                });
            } else {
                res.json({
                    error: 'Token invalide.'
                });
            }
        });
    });
});






// 404 - Page not found
app.use((req, res) => {
    res.status(404).sendFile(__dirname + '/template/404.html');
});



//#############################################################################################################################
//                                                  START SERVER
//#############################################################################################################################
app.listen(PORT, () => {
    console.log(`${APP_NAME} Server is running on port ${PORT}.`);
});