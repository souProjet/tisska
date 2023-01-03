let email = document.querySelector('input[name="email"]');
let password = document.querySelector('input[name="password"]');
let errorDiv = document.querySelector('.error-msg');
let submitButton = document.querySelector('button[type="submit"]');
let frontEndError = false;

//verify email format
email.addEventListener('focusout', (e) => {
    let emailValue = e.target.value;
    let emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(emailValue)) {
        errorDiv.innerHTML = 'L\'adresse email n\'est pas valide';
        frontEndError = true;
    } else {
        errorDiv.innerHTML = '';
        frontEndError = false;
    }
});

// login
submitButton.addEventListener('click', (e) => {
    e.preventDefault();
    if (email.value === '' || password.value === '') {
        errorDiv.innerHTML = 'Veuillez remplir tous les champs';
    } else {
        if (!frontEndError) {

            let data = {
                email: email.value,
                password: password.value
            }
            let options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            };
            fetch('/api/login', options)
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        errorDiv.innerHTML = data.error;
                    } else {
                        //set cookie for 10 years
                        document.cookie = `token=${data.token}; max-age=315360000`;
                        window.location.href = '/';
                    }
                });

        }
    }
});