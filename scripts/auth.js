const API_URL = 'http://127.0.0.1:8000/api/v1/';

const auth = {
    get access() {
        return localStorage.getItem('access');
    },
    get refresh() {
        return localStorage.getItem('refresh');
    },
    get user() {
        return JSON.parse(localStorage.getItem('user') || 'null');
    },
    isLoggedIn() {
        return Boolean(this.refresh);
    },
    saveTokens(tokens) {
        localStorage.setItem('access', tokens.access);
        localStorage.setItem('refresh', tokens.refresh);
    },
    saveUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    },
    clear() {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        localStorage.removeItem('user');
    },
};

function currentPage() {
    return (location.pathname.split('/').pop() || 'index.html') + location.search;
}

function goToLogin() {
    location.replace('login.html?next=' + encodeURIComponent(currentPage()));
}

function requireAuth() {
    if (!auth.isLoggedIn()) {
        goToLogin();
        return false;
    }
    return true;
}

function redirectIfLoggedIn() {
    if (auth.isLoggedIn()) {
        location.replace('profile.html');
        return true;
    }
    return false;
}

function sendJson(method, path, body, headers) {
    return $.ajax({
        url: API_URL + path,
        method: method,
        headers: headers || {},
        contentType: body ? 'application/json' : undefined,
        data: body ? JSON.stringify(body) : undefined,
    });
}

let refreshRequest = null;

// Кілька запитів можуть отримати 401 одночасно, тоді всі чекають один спільний refresh.
function refreshAccessToken() {
    if (!refreshRequest) {
        refreshRequest = sendJson('POST', 'auth/token/refresh/', { refresh: auth.refresh })
            .then(tokens => auth.saveTokens(tokens))
            .always(() => {
                refreshRequest = null;
            });
    }
    return refreshRequest;
}

function api(method, path, body) {
    const send = () => sendJson(method, path, body, auth.access ? { Authorization: 'Bearer ' + auth.access } : {});
    return send().catch(xhr => {
        if (xhr.status !== 401 || !auth.refresh) {
            throw xhr;
        }
        return refreshAccessToken().then(send, () => {
            auth.clear();
            goToLogin();
            throw xhr;
        });
    });
}

function loadCurrentUser() {
    return api('GET', 'auth/me/').then(user => {
        auth.saveUser(user);
        return user;
    });
}

function logout() {
    const refresh = auth.refresh;
    auth.clear();
    const done = () => location.assign('index.html');
    if (!refresh) {
        done();
        return;
    }
    sendJson('POST', 'auth/logout/', { refresh: refresh }).always(done);
}

function errorText(xhr) {
    if (xhr.status === 0) {
        return 'Не вдалося підключитися до API. Перевірте, що бекенд запущений на http://127.0.0.1:8000.';
    }
    if (xhr.responseJSON && xhr.responseJSON.detail) {
        return xhr.responseJSON.detail;
    }
    return 'Помилка ' + xhr.status + '.';
}

function renderNav() {
    const nav = $('#nav');
    const links = $('<div>').addClass('nav-links');
    links.append($('<a>').attr('href', 'index.html').text('Каталог'));
    links.append($('<a>').attr('href', 'profile.html').text('Кабінет'));

    const account = $('<div>').addClass('nav-account');
    if (auth.isLoggedIn()) {
        const user = auth.user;
        account.append($('<span>').addClass('nav-user').text(user ? user.username : ''));
        account.append($('<button>').attr('type', 'button').addClass('link-button').text('Вийти').on('click', logout));
    } else {
        account.append($('<a>').attr('href', 'login.html').text('Увійти'));
        account.append($('<a>').attr('href', 'register.html').text('Реєстрація'));
    }
    nav.empty().append(links, account);

    if (auth.isLoggedIn() && !auth.user) {
        loadCurrentUser()
            .then(user => nav.find('.nav-user').text(user.username))
            .catch(() => {});
    }
}

$(renderNav);

function formData(form) {
    const data = {};
    $(form).serializeArray().forEach(field => {
        data[field.name] = field.value;
    });
    return data;
}

function showFormErrors(form, xhr) {
    const errors = (xhr.responseJSON && xhr.responseJSON.errors) || {};
    Object.keys(errors).forEach(name => {
        $(form).find('.field-error[data-field="' + name + '"]').text([].concat(errors[name]).join(' '));
    });
    $(form).find('.error').text(errorText(xhr));
}

function clearFormErrors(form) {
    $(form).find('.field-error, .error').text('');
}
