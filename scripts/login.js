function nextPage() {
    const next = new URLSearchParams(location.search).get('next');
    if (next && /^[\w-]+\.html(\?[^#]*)?$/.test(next)) {
        return next;
    }
    return 'profile.html';
}

if (!redirectIfLoggedIn()) {
    $(function () {
        $('#login-form').on('submit', function (e) {
            e.preventDefault();
            const form = this;
            clearFormErrors(form);
            sendJson('POST', 'auth/login/', formData(form))
                .then(tokens => {
                    auth.saveTokens(tokens);
                    return loadCurrentUser();
                })
                .then(() => location.replace(nextPage()))
                .catch(xhr => showFormErrors(form, xhr));
        });
    });
}
