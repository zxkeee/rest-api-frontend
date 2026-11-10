if (!redirectIfLoggedIn()) {
    $(function () {
        $('#register-form').on('submit', function (e) {
            e.preventDefault();
            const form = this;
            const data = formData(form);
            clearFormErrors(form);
            sendJson('POST', 'auth/register/', data)
                .then(() => sendJson('POST', 'auth/login/', { username: data.username, password: data.password }))
                .then(tokens => {
                    auth.saveTokens(tokens);
                    return loadCurrentUser();
                })
                .then(() => location.replace('profile.html'))
                .catch(xhr => showFormErrors(form, xhr));
        });
    });
}
