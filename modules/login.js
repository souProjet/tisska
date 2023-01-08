let Login = class Login {
    constructor(db, bcrypt, fs, createCanvas, loadImage) {
        this.db = db;
        this.bcrypt = bcrypt;
        this.fs = fs;
        this.createCanvas = createCanvas;
        this.loadImage = loadImage;
        this.HOME = process.argv[2] == '--dev' ? __dirname : '/home/tisska';

    }
    generateToken(length = 32) {
        let result = '';
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    tokenIsValid(token) {
        return new Promise((resolve, reject) => {
            this.db.query(`SELECT * FROM users WHERE token = '${token}'`, (err, result) => {
                if (err) reject(err);
                if (result.length > 0) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        });
    }
    register(firstname, lastname, email, password, address, city, zip) {
        return new Promise((resolve, reject) => {
            this.db.query(`SELECT * FROM users WHERE email = '${email}'`, (err, result) => {
                if (err) reject(err);
                if (result.length > 0) {
                    resolve({ error: 'Cet email est déjà utilisé.' });
                } else {
                    let token = this.generateToken();
                    let privateKey = this.generateToken(64);
                    let hash = this.bcrypt.hashSync(password, 10);
                    let avatarID = this.generateToken(20);
                    this.db.query(`INSERT INTO users (private_key, token, email, address, city, zip, password, firstname, lastname, avatar) VALUES ('${privateKey}', '${token}','${email}', '${address}', '${city}', '${zip}', '${hash}', '${firstname}', '${lastname}', '${avatarID}')`, (err, result) => {
                        if (err) reject(err);
                        // create avatar image (initials) and save it

                        //random colors 
                        let colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548', '#9e9e9e', '#607d8b'];
                        let color = colors[Math.floor(Math.random() * colors.length)];
                        let canvas = this.createCanvas(100, 100);
                        let ctx = canvas.getContext('2d');
                        ctx.fillStyle = color;
                        ctx.fillRect(0, 0, 100, 100);
                        ctx.font = 'bold 50px Arial';
                        ctx.fillStyle = '#fff';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(firstname[0].toUpperCase() + lastname[0].toUpperCase(), 50, 50);
                        let buffer = canvas.toBuffer('image/png');

                        // save image in ./avatars folder
                        this.fs.writeFileSync(this.HOME == __dirname ? `${this.HOME}/../avatars/${avatarID}.png` : `${this.HOME}/avatars/${avatarID}.png`, buffer, (err) => {
                            if (err) reject(err);
                        });
                        resolve({ token: token, error: false });
                    });

                }
            });
        });
    }
    login(email, password) {
        return new Promise((resolve, reject) => {
            // verify if user exists
            this.db.query(`SELECT * FROM users WHERE email = '${email}'`, (err, result) => {
                if (err) reject(err);
                if (result.length > 0) {
                    // verify if password is correct
                    if (this.bcrypt.compareSync(password, result[0].password)) {
                        // return token
                        let token = result[0].token;
                        resolve({ token: token, error: false });

                    } else {
                        resolve({ error: 'Mot de passe incorrect.' });
                    }

                } else {
                    resolve({ error: 'Cet utilisateur n\'existe pas.' });
                }
            });
        });
    }
    getUser(token) {
        return new Promise((resolve, reject) => {

            this.db.query(`SELECT private_key,cart,firstname,lastname,admin,avatar,address,city,zip,email FROM users WHERE token = '${token}'`, (err, result) => {
                if (err) reject(err);
                if (result.length > 0) {
                    if (!result[0].admin) {
                        delete result[0].admin;
                    }
                    resolve(result[0]);
                } else {
                    resolve(false);
                }
            });
        });
    }

    isAdmin(token) {
        return new Promise((resolve, reject) => {
            this.db.query(`SELECT admin FROM users WHERE token = '${token}'`, (err, result) => {
                if (err) reject(err);
                if (result.length > 0) {
                    resolve(result[0].admin);
                } else {
                    resolve(false);
                }
            });
        });
    }

    updateProfile(token, firstname, lastname, address, city, postalCode, email) {
        return new Promise((resolve, reject) => {
            this.db.query(`UPDATE users SET firstname = '${firstname}', lastname = '${lastname}', address = '${address}', city = '${city}', zip = '${postalCode}', email = '${email}' WHERE token = '${token}'`, (err, result) => {
                if (err) reject(err);
                resolve(true);
            });
        });
    }

}

module.exports = Login;