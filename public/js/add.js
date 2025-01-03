$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const table = urlParams.get('table');
    let primaryKey = '';

    // Fetch and display form for the selected table
    function fetchTableSchema(table) {
        $.get(`/api/schema/${table}`, function(data) {
            console.log(`Fetched schema for ${table}:`, data);
            let form = $('#add-record-form');
            form.empty();
            data.forEach(column => {
                if (column.COLUMN_NAME.toLowerCase() === primaryKey.toLowerCase()) return; // Skip primary key column
                const isDateTime = column.DATA_TYPE.toLowerCase().includes('datetime');
                const value = isDateTime ? new Date().toISOString().slice(0, 19).replace('T', ' ') : '';
                form.append(`
                    <div class="form-group">
                        <label for="${column.COLUMN_NAME}">${column.COLUMN_NAME}</label>
                        <input type="text" class="form-control" id="${column.COLUMN_NAME}" name="${column.COLUMN_NAME}" value="${value}" required>
                    </div>
                `);
            });
            form.append('<button type="submit" class="btn btn-primary">Add Record</button>');
            form.append('<button type="button" id="back-btn" class="btn btn-secondary ml-2">Back</button>');
        }).fail(function(err) {
            console.error(`Error fetching schema for ${table}:`, err);
        });
    }

    // Handle add record
    $('#add-record-form').submit(function(e) {
        e.preventDefault();
        const record = {};
        let valid = true;
        $('#add-record-form').serializeArray().forEach(field => {
            if (!field.value) {
                valid = false;
                alert(`Field ${field.name} cannot be empty`);
                return false;
            }
            record[field.name] = field.value;
        });
        if (!valid) return;
        console.log('Adding record:', record); // Debugging line
        $.ajax({
            url: `/api/${table.toLowerCase()}`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(record),
            success: function(data) {
                alert('Record added successfully');
                window.location.href = '/dashboard';
            },
            error: function(err) {
                console.error(`Error adding record to ${table}:`, err);
            }
        });
    });

    // Handle back button
    $('#add-record-form').on('click', '#back-btn', function() {
        window.location.href = '/dashboard';
    });

    // Initial fetch to populate the form
    $.get(`/api/primary-key/${table}`, function(data) {
        primaryKey = data.primaryKey;
        fetchTableSchema(table);
    }).fail(function(err) {
        console.error(`Error fetching primary key for ${table}:`, err);
    });
});
