let firstnameField = document.querySelector('input[name="firstname"]');
let lastnameField = document.querySelector('input[name="lastname"]');
let emailField = document.querySelector('input[name="email"]');
let passwordField = document.querySelector('input[name="password"]');
let passwordVerifyField = document.querySelector('input[name="passwordVerify"]');
let addressField = document.querySelector('input[name="address"]');
let cityField = document.querySelector('input[name="city"]');
let zipField = document.querySelector('input[name="zip"]');
let submitButton = document.querySelector('button[type="submit"]');
let errorDiv = document.querySelector('.error-msg');
let frontEndError = false;
//verify email format
emailField.addEventListener('focusout', (e) => {
    let email = e.target.value;
    let emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
        errorDiv.innerHTML = 'L\'adresse email n\'est pas valide';
        frontEndError = true;
    } else {
        errorDiv.innerHTML = '';
        frontEndError = false;
    }
});

//verify password format
passwordField.addEventListener('focusout', (e) => {
    let password = e.target.value;
    let passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/;
    if (!passwordRegex.test(password)) {
        errorDiv.innerHTML = 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre';
        frontEndError = true;
    } else {
        errorDiv.innerHTML = '';
        frontEndError = false;
    }
});

//verify password match with passwordVerify
passwordVerifyField.addEventListener('focusout', (e) => {
    let passwordVerify = e.target.value;
    if (passwordVerify !== passwordField.value) {
        errorDiv.innerHTML = 'Les mots de passe ne correspondent pas';
        frontEndError = true;
    } else {
        errorDiv.innerHTML = '';
        frontEndError = false;
    }
});

//add space after 2 characters in zip code field and verify zip code format
zipField.addEventListener('keyup', (e) => {
    //remove non numeric characters
    let zip = e.target.value.replace(/\D/g, '');
    //add space after 2 characters
    zip = zip.replace(/(\d{2})(\d)/, '$1 $2');
    zipField.value = zip;
});


zipField.addEventListener('focusout', (e) => {
    let zip = e.target.value.replace(/\D/g, '').replace(/ /g, '')
    let zipRegex = /^[0-9]{5}$/;
    if (!zipRegex.test(zip)) {
        errorDiv.innerHTML = 'Le code postal n\'est pas valide';
        frontEndError = true;
    } else {
        errorDiv.innerHTML = '';
        frontEndError = false;
    }
});

//verify all fields are filled
submitButton.addEventListener('click', (e) => {
    e.preventDefault();
    if (firstnameField.value === '' || lastnameField.value === '' || emailField.value === '' || passwordField.value === '' || passwordVerifyField.value === '' || addressField.value === '' || cityField.value === '' || zipField.value === '') {
        errorDiv.innerHTML = 'Veuillez remplir tous les champs';
    } else {
        if (!frontEndError) {
            //send data to server
            let data = {
                firstname: firstnameField.value,
                lastname: lastnameField.value,
                email: emailField.value,
                password: passwordField.value,
                address: addressField.value,
                city: cityField.value,
                zip: zipField.value
            };
            let options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            };
            fetch('/api/register', options)
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        errorDiv.innerHTML = data.error;
                    } else {
                        //set token in cookie for 10 years
                        document.cookie = `token=${data.token}; max-age=315360000`;
                        window.location.href = '/';
                    }
                });
        }
    }
});

// add uppercase on first letter of each word in address field
addressField.addEventListener('keyup', (e) => {
    let address = e.target.value;
    address = address.replace(/(^|\s)\S/g, function(t) {
        return t.toUpperCase();
    });
    addressField.value = address;
});

// add uppercase on first letter of each word in city field
cityField.addEventListener('keyup', (e) => {
    let city = e.target.value;
    city = city.replace(/(^|\s)\S/g, function(t) {
        return t.toUpperCase();
    });
    cityField.value = city;
});

// add uppercase on first letter of each word in firstname field
firstnameField.addEventListener('keyup', (e) => {
    let firstname = e.target.value;
    firstname = firstname.replace(/(^|\s)\S/g, function(t) {
        return t.toUpperCase();
    });
    firstnameField.value = firstname;
});

// add uppercase on first letter of each word in lastname field
lastnameField.addEventListener('keyup', (e) => {
    let lastname = e.target.value;
    lastname = lastname.replace(/(^|\s)\S/g, function(t) {
        return t.toUpperCase();
    });
    lastnameField.value = lastname;
});