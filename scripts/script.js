const API_URL = 'http://127.0.0.1:8000/api/v1/';

let languages = {};
let organizations = {};

function showError(xhr) {
    if (xhr.status === 0) {
        $('.error').text('Не вдалося підключитися до API. Перевірте, що бекенд запущений на http://127.0.0.1:8000.');
    } else if (xhr.responseJSON && xhr.responseJSON.detail) {
        $('.error').text(xhr.responseJSON.detail);
    } else {
        $('.error').text('Помилка ' + xhr.status + '.');
    }
}

function loadLanguages() {
    return $.get(API_URL + 'languages/', function (data) {
        data.forEach(language => {
            languages[language.id] = language.name;
            $('#language').append($('<option>').val(language.name).text(language.name));
        });
    });
}

function loadOrganizations() {
    return $.get(API_URL + 'organizations/', function (data) {
        data.forEach(organization => {
            organizations[organization.id] = organization.name;
        });
    });
}

function renderProject(project) {
    const item = $('<li>').addClass('project');
    item.append($('<h2>').append($('<a>').attr('href', project.repo_url).attr('target', '_blank').text(project.name)));
    if (project.description) {
        item.append($('<p>').addClass('description').text(project.description));
    }
    const tags = $('<div>');
    tags.append($('<span>').addClass('tag difficulty-' + project.difficulty).text(project.difficulty));
    project.languages.forEach(id => {
        tags.append($('<span>').addClass('tag').text(languages[id]));
    });
    item.append(tags);
    item.append($('<p>').addClass('meta').text('★ ' + project.stars + ' · ' + organizations[project.organization]));
    return item;
}

function loadProjects() {
    const params = {
        search: $('#search').val(),
        language: $('#language').val(),
        difficulty: $('#difficulty').val(),
        ordering: $('#ordering').val(),
    };
    Object.keys(params).forEach(key => {
        if (!params[key]) {
            delete params[key];
        }
    });

    $.get(API_URL + 'projects/', params, function (data) {
        $('.error').text('');
        $('#projects').empty();
        $('.count').text('Знайдено проєктів: ' + data.length);
        data.forEach(project => {
            $('#projects').append(renderProject(project));
        });
    }).fail(showError);
}

$(document).ready(function () {
    $.when(loadLanguages(), loadOrganizations())
        .done(loadProjects)
        .fail(showError);

    $('#filters').on('submit', function (e) {
        e.preventDefault();
        loadProjects();
    });
});
