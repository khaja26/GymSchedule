let db;

// Initialize SQLite database
async function initDatabase() {
  const SQL = await initSqlJs({
    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`,
  });

  // Check if a saved database exists in localStorage
  const savedDB = localStorage.getItem('sqlite-db');
  if (savedDB) {
    db = new SQL.Database(new Uint8Array(JSON.parse(savedDB)));
    console.log('Database loaded from localStorage.');
  } else {
    db = new SQL.Database();
db.run(`
  CREATE TABLE IF NOT EXISTS gtb (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    Date TEXT,
    Day TEXT,
    Activity TEXT,
    Hours INTEGER,
    Minutes INTEGER,
     
  );
`);

    console.log('New database and table created.');
  }

  displayData(); // Display existing data on initialization
}

// Save data to SQLite
function saveData({ date, day, activity, hours, minutes }) {
  const insertQuery = `
    INSERT INTO gtb (Date, Day, Activity, Hours, Minutes)
    VALUES (?, ?, ?, ?, ?);
  `;
  db.run(insertQuery, [date, day, activity, hours, minutes]);
  alert('Data saved successfully!');
  saveDatabase(); // Save database to localStorage
  displayData(); // Refresh data after saving
}

// Update data in SQLite
function updateData({ id, date, day, activity, hours, minutes }) {
  const updateQuery = `
    UPDATE gtb
    SET Date = ?, Day = ?, Activity = ?, Hours = ?, Minutes = ?
    WHERE id = ?;
  `;
  db.run(updateQuery, [date, day, activity, hours, minutes, id]);
  alert('Data updated successfully!');
  saveDatabase(); // Save database to localStorage
  displayData(); // Refresh data after updating
}

// Save the database to localStorage
function saveDatabase() {
  const data = db.export();
  const dataStr = JSON.stringify(Array.from(data));
  localStorage.setItem('sqlite-db', dataStr);
}

// Fetch and display data from SQLite
function displayData() {
  const selectQuery = `SELECT id, Date, Day, Activity, Hours, Minutes FROM gtb;`;
  const results = db.exec(selectQuery);

  const dataTableBody = document.querySelector('#dataTable tbody');
  dataTableBody.innerHTML = '';

  if (results.length > 0) {
    const rows = results[0].values;
    rows.forEach(row => {
      const tr = document.createElement('tr');
      tr.dataset.rowId = row[0]; // Primary key stored but not shown

      row.slice(1).forEach(cell => {
        const td = document.createElement('td');
        td.textContent = cell;
        tr.appendChild(td);
      });

      tr.addEventListener('click', () => activateRow(tr, row));
      dataTableBody.appendChild(tr);
    });
  }

  document.getElementById('dataDisplay').classList.remove('hidden');
}

let selectedRowData = null; // To store the selected row's data

// Highlight row on click
function activateRow(rowElement, rowData) {
  document.querySelectorAll('#dataTable tbody tr').forEach(row => row.classList.remove('highlighted'));
  rowElement.classList.add('highlighted');
  selectedRowData = rowData;
}

// Reset form fields
function resetForm(formId, dayDisplayId) {
  document.getElementById(formId).reset();
  document.getElementById(dayDisplayId).textContent = '';
  selectedRowData = null;
}

// Hide popup
function hidePopup(popupId) {
  document.getElementById(popupId).classList.add('hidden');
}

// Show popup for Add or Edit Activity
function showPopup(popupId, isEdit = false) {
  if (isEdit && selectedRowData) {
    const [, date, day, activity, hours, minutes] = selectedRowData;
    document.getElementById('editActivityDate').value = date;
    document.getElementById('editDayDisplay').textContent = `Day: ${day}`;
    document.getElementById('editActivityText').value = activity;
    document.getElementById('editActivityHours').value = hours;
    document.getElementById('editActivityMinutes').value = minutes;
  } else if (!isEdit) {
    resetForm('addActivityForm', 'addDayDisplay');
  } else {
    alert('Please select a row to edit.');
    return;
  }
  document.getElementById(popupId).classList.remove('hidden');
}

// Handle Add Form Submission
document.getElementById('addSubmitButton').addEventListener('click', () => {
  const date = document.getElementById('addActivityDate').value;
  const day = document.getElementById('addDayDisplay').textContent.replace('Day: ', '').trim();
  const activity = document.getElementById('addActivityText').value;
  const hours = parseInt(document.getElementById('addActivityHours').value, 10) || 0;
  const minutes = parseInt(document.getElementById('addActivityMinutes').value, 10) || 0;

  if (!date || !activity || (hours === 0 && minutes === 0)) {
    alert('Please fill in all required fields!');
    return;
  }

  saveData({ date, day, activity, hours, minutes });
  hidePopup('addActivityPopup');
});

// Handle Edit Form Submission
document.getElementById('editSubmitButton').addEventListener('click', () => {
  if (!selectedRowData) {
    alert('No activity selected for editing!');
    return;
  }

  const id = selectedRowData[0];
  const date = document.getElementById('editActivityDate').value;
  const day = document.getElementById('editDayDisplay').textContent.replace('Day: ', '').trim();
  const activity = document.getElementById('editActivityText').value;
  const hours = parseInt(document.getElementById('editActivityHours').value, 10) || 0;
  const minutes = parseInt(document.getElementById('editActivityMinutes').value, 10) || 0;

  if (!date || !activity || (hours === 0 && minutes === 0)) {
    alert('Please fill in all required fields!');
    return;
  }

  updateData({ id, date, day, activity, hours, minutes });
  hidePopup('editActivityPopup');
});

// Delete selected row
document.getElementById('deleteButton').addEventListener('click', () => {
  if (!selectedRowData) {
    alert('Please select a row to delete.');
    return;
  }

  if (confirm('Are you sure you want to delete this entry?')) {
    const id = selectedRowData[0];
    const deleteQuery = `DELETE FROM gtb WHERE id = ?;`;
    db.run(deleteQuery, [id]);
    alert('Data deleted successfully!');
    saveDatabase();
    displayData();
  }
});

// Set up date change event
document.querySelectorAll('[id$="ActivityDate"]').forEach(input => {
  input.addEventListener('change', (event) => {
    const date = new Date(event.target.value);
    const dayId = event.target.id.includes('add') ? 'addDayDisplay' : 'editDayDisplay';
    document.getElementById(dayId).textContent = `Day: ${date.toLocaleDateString('en-US', { weekday: 'long' })}`;
  });
});

// Initialize database and set up event listeners
document.addEventListener('DOMContentLoaded', () => {
  initDatabase();

  document.getElementById('addButton').addEventListener('click', () => showPopup('addActivityPopup'));
  document.getElementById('editButton').addEventListener('click', () => showPopup('editActivityPopup', true));
  document.getElementById('addCancelButton').addEventListener('click', () => hidePopup('addActivityPopup'));
  document.getElementById('editCancelButton').addEventListener('click', () => hidePopup('editActivityPopup'));
});

// Share selected row
document.getElementById('shareButton').addEventListener('click', () => {
  if (!selectedRowData) {
    alert('Please select a row to share.');
    return;
  }

  const [, date, day, activity, hours, minutes] = selectedRowData;
  const shareData = {
    title: 'Activity Data',
    text: `Activity Details:\nDate: ${date}\nDay: ${day}\nActivity: ${activity}\nHours: ${hours}\nMinutes: ${minutes}`,
  };

  if (navigator.share) {
    navigator.share(shareData)
      .then(() => console.log('Data shared successfully!'))
      .catch((error) => console.error('Error sharing data:', error));
  } else {
    alert('Share feature is not supported in this browser.');
  }
});

// Date filter setup
document.addEventListener('DOMContentLoaded', () => {
  const showButton = document.getElementById('showButton');
  const dateFilter = document.getElementById('dateFilter');
  const showDataButton = document.getElementById('showDataButton');
  const cancelButton = document.getElementById('cancelButton');
  const dataTableBody = document.querySelector('#dataTable tbody');

  // Show the date filter popup
  showButton.addEventListener('click', () => {
    dateFilter.classList.remove('hidden');
  });

  // Hide the date filter popup
  cancelButton.addEventListener('click', () => {
    dateFilter.classList.add('hidden');
    document.getElementById('fromDate').value = '';
    document.getElementById('toDate').value = '';
  });

  // Show data within the selected date range
  showDataButton.addEventListener('click', () => {
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;

    if (!fromDate || !toDate) {
      alert('Please select both From and To dates.');
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      alert('"From" date cannot be after "To" date.');
      return;
    }

    const query = `
      SELECT Date, Day, Activity, Hours, Minutes
      FROM gtb
      WHERE Date BETWEEN ? AND ?;
    `;
    const results = db.exec(query, [fromDate, toDate]);

    dataTableBody.innerHTML = '';
    if (results.length > 0) {
      const rows = results[0].values;
      rows.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(value => {
          const td = document.createElement('td');
          td.textContent = value;
          tr.appendChild(td);
        });
        dataTableBody.appendChild(tr);
      });
    } else {
      alert('No data found within the selected date range.');
    }

    dateFilter.classList.add('hidden');
  });
});

// Handle row click to select entire row
function activateRow(rowElement, rowData) {
  // Deselect any previously selected rows
  document.querySelectorAll('#dataTable tbody tr').forEach(row => row.classList.remove('highlighted'));
  
  // Highlight the clicked row
  rowElement.classList.add('highlighted');
  
  // Store selected row data
  selectedRowData = rowData;
}

// "Completed" button logic to change row color
document.getElementById('completedButton').addEventListener('click', () => {
  if (!selectedRowData) {
    alert('Please select a row to mark as completed.');
    return;
  }

  // Find the selected row in the table
  const selectedRow = document.querySelector('#dataTable tbody tr.highlighted');
  if (selectedRow) {
    selectedRow.classList.add('completed'); // Add the 'completed' class
  } else {
    alert('No row selected to mark as completed.');
  }
}); 

// Function to select the entire row when any part of it is clicked
function activateRow(rowElement, rowData) {
  // Deselect previously selected rows
  document.querySelectorAll('#dataTable tbody tr').forEach(row => row.classList.remove('highlighted'));
  
  // Highlight the clicked row
  rowElement.classList.add('highlighted');
  
  // Store the selected row's data
  selectedRowData = rowData;
}

// "Move" button logic to duplicate the row with a new date
document.getElementById('moveButton').addEventListener('click', () => {
  if (!selectedRowData) {
    alert('Please select a row to move.');
    return;
  }

  // Get the selected row data
  const [, date, day, activity, hours, minutes] = selectedRowData;

  // Add 7 days to the selected date
  const originalDate = new Date(date);
  const newDate = new Date(originalDate.setDate(originalDate.getDate() + 7));
  
  // Format the new date to match the original format (e.g., "YYYY-MM-DD")
  const formattedDate = newDate.toISOString().split('T')[0];
  const newDay = newDate.toLocaleDateString('en-US', { weekday: 'long' });

  // Create a new entry with the new date
  saveData({ date: formattedDate, day: newDay, activity, hours, minutes });
  alert('New activity moved and saved with a new date!');
});



// Move selected rows to a new date (current date + 7 days)
document.getElementById('moveButton').addEventListener('click', () => {
  if (!selectedRowData) {
    alert('Please select a row to move.');
    return;
  }

  const moveDate = new Date();
  moveDate.setDate(moveDate.getDate() + 7); // Move date forward by 7 days
  const formattedDate = moveDate.toISOString().split('T')[0]; // Format date as YYYY-MM-DD

  selectedRowData.forEach(row => {
    const [id, , day, activity, hours, minutes] = row;

    // Save the new row with updated date
    saveData({ date: formattedDate, day, activity, hours, minutes });
    
    // Optionally, delete the old row after moving
    const deleteQuery = `DELETE FROM gtb WHERE id = ?;`;
    db.run(deleteQuery, [id]);
  });

  alert('Selected rows moved successfully!');
});

// Move selected rows to a new date (current date + 7 days)
document.getElementById('moveButton').addEventListener('click', () => {
  if (!selectedRowData) {
    alert('Please select a row to move.');
    return;
  }

  const moveDate = new Date();
  moveDate.setDate(moveDate.getDate() + 7); // Move date forward by 7 days
  const formattedDate = moveDate.toISOString().split('T')[0]; // Format date as YYYY-MM-DD

  selectedRowData.forEach(row => {
    const [id, , day, activity, hours, minutes] = row;

    // Save the new row with updated date
    saveData({ date: formattedDate, day, activity, hours, minutes });
    
    // Optionally, delete the old row after moving
    const deleteQuery = `DELETE FROM gtb WHERE id = ?;`;
    db.run(deleteQuery, [id]);
  });

  alert('Selected rows moved successfully!');
});


// Move selected rows to a new date (current date + 7 days)
document.getElementById('moveButton').addEventListener('click', () => {
  if (!selectedRowData) {
    alert('Please select a row to move.');
    return;
  }

  const moveDate = new Date();
  moveDate.setDate(moveDate.getDate() + 7); // Move date forward by 7 days
  const formattedDate = moveDate.toISOString().split('T')[0]; // Format date as YYYY-MM-DD

  selectedRowData.forEach(row => {
    const [id, , day, activity, hours, minutes] = row;

    // Save the new row with updated date
    saveData({ date: formattedDate, day, activity, hours, minutes });
    
    // Optionally, delete the old row after moving
    const deleteQuery = `DELETE FROM gtb WHERE id = ?;`;
    db.run(deleteQuery, [id]);
  });

  alert('Selected rows moved successfully!');
});

// Move selected rows to a new date (current date + 7 days)
document.getElementById('moveButton').addEventListener('click', () => {
  if (!selectedRowData) {
    alert('Please select a row to move.');
    return;
  }

  const moveDate = new Date();
  moveDate.setDate(moveDate.getDate() + 7); // Move date forward by 7 days
  const formattedDate = moveDate.toISOString().split('T')[0]; // Format date as YYYY-MM-DD

  selectedRowData.forEach(row => {
    const [id, , day, activity, hours, minutes] = row;

    // Save the new row with updated date
    saveData({ date: formattedDate, day, activity, hours, minutes });
    
    // Optionally, delete the old row after moving
    const deleteQuery = `DELETE FROM gtb WHERE id = ?;`;
    db.run(deleteQuery, [id]);
  });

  alert('Selected rows moved successfully!');
});


document.getElementById('timerButton').addEventListener('click', () => {
    document.getElementById('timerPopup').classList.remove('hidden');
});

document.getElementById('cancelTimerButton').addEventListener('click', () => {
    document.getElementById('timerPopup').classList.add('hidden');
    resetTimer();
});

document.getElementById('startTimerButton').addEventListener('click', () => {
    const minutes = parseInt(document.getElementById('minutes').value) || 0;
    const seconds = parseInt(document.getElementById('seconds').value) || 0;

    if (minutes < 0 || seconds < 0 || seconds >= 60) {
        alert('Please enter valid time.');
        return;
    }

    const totalTime = (minutes * 60) + seconds;
    startTimer(totalTime);
});

let timerInterval;

function startTimer(duration) {
    resetTimer(); // Clear any existing timer

    let timer = duration;
    const timerDisplay = document.getElementById('timerDisplay');
    timerDisplay.classList.remove('hidden');

    timerInterval = setInterval(() => {
        const minutes = Math.floor(timer / 60);
        const seconds = timer % 60;

        timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        if (--timer < 0) {
            clearInterval(timerInterval);
            alert('Time is up!');
            resetTimer();
        }
    }, 1000);
}

function resetTimer() {
    clearInterval(timerInterval);
    document.getElementById('timerDisplay').classList.add('hidden');
    document.getElementById('minutes').value = '';
    document.getElementById('seconds').value = '';
}

 

 

 


