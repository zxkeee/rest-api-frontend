const ROLES = { admin: 'адміністратор', user: 'користувач' };
let projects = {};

function renderProfile(user) {
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || '-';
    const rows = [['Username', user.username], ['Імʼя', fullName], ['Email', user.email], ['Роль', ROLES[user.role]]];
    $('#profile').empty();
    rows.forEach(([label, value]) => {
        $('#profile').append($('<dt>').text(label), $('<dd>').text(value));
    });
    $('.admin-note').prop('hidden', user.role !== 'admin');
}

function renderIssue(issue, isAdmin) {
    const item = $('<li>').addClass('issue');
    const text = $('<div>');
    text.append($('<p>').addClass('issue-title').text(issue.title));
    text.append($('<p>').addClass('meta').text((projects[issue.project] || '') + ' · ' + issue.difficulty + ' · ' + issue.status));
    item.append(text);
    if (isAdmin) {
        const button = $('<button>').attr('type', 'button').addClass('link-button danger').text('Видалити');
        button.on('click', () => deleteIssue(issue.id));
        item.append(button);
    }
    return item;
}

function loadIssues() {
    const isAdmin = auth.user && auth.user.role === 'admin';
    return api('GET', 'issues/')
        .then(issues => {
            $('#issues-error').text('');
            $('#issues').empty();
            issues.slice(-10).reverse().forEach(issue => $('#issues').append(renderIssue(issue, isAdmin)));
        })
        .catch(xhr => $('#issues-error').text(errorText(xhr)));
}

function deleteIssue(id) {
    api('DELETE', 'issues/' + id + '/')
        .then(loadIssues)
        .catch(xhr => $('#issues-error').text(errorText(xhr)));
}

function loadProjects() {
    return api('GET', 'projects/?ordering=name').then(data => {
        data.forEach(project => {
            projects[project.id] = project.name;
            $('#issue-project').append($('<option>').val(project.id).text(project.name));
        });
    });
}

if (requireAuth()) {
    $(function () {
        loadCurrentUser()
            .then(user => {
                renderProfile(user);
                $('#nav .nav-user').text(user.username);
                return loadProjects();
            })
            .then(loadIssues)
            .catch(xhr => $('#issues-error').text(errorText(xhr)));

        $('#issue-form').on('submit', function (e) {
            e.preventDefault();
            const form = this;
            const data = formData(form);
            data.project = Number(data.project);
            clearFormErrors(form);
            api('POST', 'issues/', data)
                .then(() => {
                    form.reset();
                    return loadIssues();
                })
                .catch(xhr => showFormErrors(form, xhr));
        });
    });
}
