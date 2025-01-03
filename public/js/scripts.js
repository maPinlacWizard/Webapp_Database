$(document).ready(function() {
    // Fetch and display tables
    function fetchTables() {
        $.get('/api/tables', function(data) {
            console.log('Fetched tables:', data);
            let tableSelect = $('#table-select');
            tableSelect.empty();
            tableSelect.append('<option value="">--Select a table--</option>');
            data.forEach(table => {
                tableSelect.append(`<option value="${table.TABLE_NAME}">${table.TABLE_NAME}</option>`);
            });
        }).fail(function(err) {
            console.error('Error fetching tables:', err);
        });
    }

    // Fetch and display data from the selected table
    function fetchTableData(table) {
        $.get(`/api/${table.toLowerCase()}`, function(data) {
            console.log(`Fetched data from ${table}:`, data);
            let tableData = $('#table-data');
            tableData.empty();
            if (data.length > 0) {
                let tableHtml = '<table class="table table-bordered"><thead><tr>';
                for (let key in data[0]) {
                    tableHtml += `<th>${key}</th>`;
                }
                tableHtml += '<th class="actions-header">Actions</th></tr></thead><tbody>';
                data.forEach(row => {
                    tableHtml += '<tr>';
                    for (let key in row) {
                        tableHtml += `<td>${row[key]}</td>`;
                    }
                    tableHtml += `
                        <td class="table-actions">
                            <button class="btn btn-sm btn-warning edit-btn me-2" data-id="${row[Object.keys(row)[0]]}" data-table="${table}">Edit</button>
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${row[Object.keys(row)[0]]}" data-table="${table}">Delete</button>
                        </td>
                    `;
                    tableHtml += '</tr>';
                });
                tableHtml += '</tbody></table>';
                tableData.append(tableHtml);
                console.log('Table HTML:', tableHtml); // Log the generated HTML
            } else {
                tableData.append('<p>No data available</p>');
            }
        }).fail(function(err) {
            console.error(`Error fetching data from ${table}:`, err);
            $('#table-data').append('<p>Error fetching data</p>'); // Display error message
        });
    }

    // Fetch and display form for the selected table
    function fetchTableSchema(table) {
        $.get(`/api/schema/${table}`, function(data) {
            console.log(`Fetched schema for ${table}:`, data);
            let form = $('#add-record-form');
            form.empty();
            data.forEach(column => {
                if (column.COLUMN_NAME.toLowerCase().includes('id')) return; // Skip ID columns
                form.append(`
                    <div class="form-group">
                        <label for="${column.COLUMN_NAME}">${column.COLUMN_NAME}</label>
                        <input type="text" class="form-control" id="${column.COLUMN_NAME}" name="${column.COLUMN_NAME}">
                    </div>
                `);
            });
            form.append('<button type="submit" class="btn btn-primary">Add Record</button>');
            fetchTableData(table); // Ensure data is fetched and displayed after schema
        }).fail(function(err) {
            console.error(`Error fetching schema for ${table}:`, err);
        });
    }

    // Handle table selection
    $('#table-select').change(function() {
        const selectedTable = $(this).val();
        console.log(`Selected table: ${selectedTable}`); // Log the selected table
        $('#table-data').empty(); // Clear previous data
        $('#add-record-form').empty(); // Clear previous form
        if (selectedTable) {
            $('#add-record-btn').show();
            fetchTableSchema(selectedTable);
        } else {
            $('#add-record-btn').hide();
        }
    });

    // Handle add record button click
    $('#add-record-btn').click(function() {
        const selectedTable = $('#table-select').val();
        if (selectedTable) {
            window.location.href = `/add.html?table=${selectedTable}`;
        }
    });

    // Handle add record form submission
    $('#add-record-form').submit(function(e) {
        e.preventDefault();
        const table = $('#table-select').val();
        const record = {};
        $('#add-record-form').serializeArray().forEach(field => {
            record[field.name] = field.value;
        });
        console.log('Adding record:', record); // Debugging line
        $.post(`/api/${table.toLowerCase()}`, record, function(data) {
            alert('Record added successfully');
            fetchTableData(table);
            $('#add-record-form-container').hide();
        }).fail(function(err) {
            console.error(`Error adding record to ${table}:`, err);
        });
    });

    // Handle edit record button click
    $('#table-data').on('click', '.edit-btn', function() {
        const id = $(this).data('id');
        const table = $(this).data('table');
        console.log(`Edit button clicked for table: ${table}, ID: ${id}`); // Log the table and ID
        window.location.href = `/edit.html?table=${table}&id=${id}`;
    });

    // Handle delete record button click
    $('#table-data').on('click', '.delete-btn', function() {
        const id = $(this).data('id');
        const table = $(this).data('table');
        if (confirm('Are you sure you want to delete this record?')) {
            $.ajax({
                url: `/api/${table.toLowerCase()}/${id}`,
                type: 'DELETE',
                success: function(data) {
                    alert('Record deleted successfully');
                    fetchTableData(table);
                },
                error: function(err) {
                    console.error(`Error deleting record from ${table}:`, err);
                    if (err.responseText.includes('REFERENCE constraint')) {
                        alert('This record cannot be deleted because it is referenced in another table.');
                    } else {
                        alert('Failed to delete the record.');
                    }
                }
            });
        }
    });

    // Handle logout button click
    $('#logout-btn').click(function() {
        $.get('/logout', function() {
            window.location.href = '/login';
        });
    });

    // Initial fetch to populate the dropdown
    fetchTables();

    // Fetch tables again after logging in
    $(document).on('login', function() {
        fetchTables();
    });
});
