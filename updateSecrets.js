let agrs = process.argv.slice(2);
let password = agrs[0];
let stripe = agrs[1];

const fs = require('fs');

let data = {
    "PORT": "3000",
    "APP_NAME": "[E-Commerce | Tiss'Ka]",
    "host": "localhost",
    "user": "tisska",
    "password": password,
    "database": "tisska",
    "STRIPE_SECRET_KEY": stripe,
    "STRIPE_PUBLISHABLE_KEY": "pk_live_51HiGoQJqkELSvnH0SZyPH1vQrCb2hIwRHKlmJcgvIxSItL0RWqPFLP0aWr8eSA0BDiQjMBTrGbZ1xmnyVIDUcVnQ00x5SCVpsV"
}


fs.writeFileSync('config.json', JSON.stringify(data));
