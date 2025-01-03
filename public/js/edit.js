$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const table = urlParams.get('table');
    const id = urlParams.get('id');
    let primaryKey = '';

    // Fetch and display form for the selected table
    function fetchTableSchema(table, data) {
        $.get(`/api/schema/${table}`, function(schema) {
            console.log(`Fetched schema for ${table}:`, schema);
            let form = $('#edit-record-form');
            form.empty();
            schema.forEach(column => {
                const isPrimaryKey = column.COLUMN_NAME.toLowerCase() === primaryKey.toLowerCase();
                form.append(`
                    <div class="form-group">
                        <label for="${column.COLUMN_NAME}">${column.COLUMN_NAME}</label>
                        <input type="text" class="form-control" id="${column.COLUMN_NAME}" name="${column.COLUMN_NAME}" value="${data[column.COLUMN_NAME] || ''}" ${isPrimaryKey ? 'readonly' : 'required'}>
                    </div>
                `);
            });
            form.append('<button type="submit" class="btn btn-primary">Update Record</button>');
            form.append('<button type="button" id="back-btn" class="btn btn-secondary ml-2">Back</button>');
            console.log('Form fields populated with data:', data); // Log the data used to populate the form
        }).fail(function(err) {
            console.error(`Error fetching schema for ${table}:`, err);
        });
    }

    // Fetch and populate form with existing data
    function fetchRecordData(table, id) {
        $.get(`/api/${table.toLowerCase()}/${id}`, function(data) {
            console.log(`Fetched data for ${table} with ID ${id}:`, data);
            fetchTableSchema(table, data); // Fetch schema after fetching current data
        }).fail(function(err) {
            console.error(`Error fetching data for ${table} with ID ${id}:`, err);
        });
    }

    // Handle update record
    $('#edit-record-form').submit(function(e) {
        e.preventDefault();
        const record = {};
        $('#edit-record-form').serializeArray().forEach(field => {
            record[field.name] = field.value;
        });
        $.ajax({
            url: `/api/${table.toLowerCase()}/${id}`,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(record),
            success: function(data) {
                console.log('Record updated successfully:', data); // Log the response data
                alert('Record updated successfully');
                window.location.href = '/dashboard';
            },
            error: function(err) {
                console.error(`Error updating record in ${table}:`, err);
            }
        });
    });

    // Handle back button
    $('#edit-record-form').on('click', '#back-btn', function() {
        window.location.href = '/dashboard';
    });

    // Initial fetch to populate the form
    $.get(`/api/primary-key/${table}`, function(data) {
        primaryKey = data.primaryKey;
        console.log(`Primary key for table ${table}: ${primaryKey}`); // Log the primary key
        fetchRecordData(table, id);
    }).fail(function(err) {
        console.error(`Error fetching primary key for ${table}:`, err);
    });
});
