$(document).ready(function() {
    $('#login-form').submit(function(e) {
        e.preventDefault();
        const username = $('#username').val();
        const password = $('#password').val();
        const server = $('#server').val();
        const database = $('#database').val();
        
        $.ajax({
            url: '/api/login',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ username, password, server, database }),
            success: function(response) {
                alert(response.message);
                window.location.href = '/dashboard';
            },
            error: function(err) {
                alert(err.responseJSON.message);
            }
        });
    });
});

function fetchTables() {
    $.ajax({
        url: '/api/tables',
        type: 'GET',
        success: function(response) {
            // Handle the response to update the tables
        },
        error: function(err) {
            alert('Failed to fetch tables');
        }
    });
}