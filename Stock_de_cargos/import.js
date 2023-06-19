const fs = require('fs');
const csv = require('csv-parser');
const sqlite3 = require('sqlite3').verbose();

// Open the database
const db = new sqlite3.Database('inventory.db');

// Import data from CSV file
function importData(csvFilePath) {
  let tableCreated = false;

  fs.createReadStream(csvFilePath)
    .pipe(csv({ separator: ';' }))
    .on('data', (data) => {
      // Check if the table has been created
      if (!tableCreated) {
        const fieldNames = Object.keys(data);

        // Create the table if it doesn't exist
        const createTableQuery = `CREATE TABLE IF NOT EXISTS records (${generateFieldDefinitions(fieldNames)})`;
        db.run(createTableQuery, (err) => {
          if (err) {
            console.error('Table creation error:', err);
          } else {
            tableCreated = true;
          }
        });
      }

      // Insert data into the table
      const fieldValues = Object.values(data);
      const insertQuery = `INSERT INTO records VALUES (${generatePlaceholders(fieldValues)})`;
      db.run(insertQuery, fieldValues, (err) => {
        if (err) {
          console.error('Data import error:', err);
        }
      });
    })
    .on('end', () => {
      console.log('Data imported successfully');

      // Close the database connection
      db.close();
    });
}

// Generate field definitions for table creation query
function generateFieldDefinitions(fieldNames) {
  return fieldNames.map((fieldName) => `${fieldName.replace(/[^a-zA-Z0-9_]/g, '_')} TEXT`).join(', ');
}

// Generate placeholders for data insertion query
function generatePlaceholders(fieldValues) {
  return fieldValues.map(() => '?').join(', ');
}

// Use fs to choose the CSV file path
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the directory path where the CSV file is located: ', (directoryPath) => {
  rl.question('Enter the name of the CSV file (including the extension): ', (fileName) => {
    const csvFilePath = `${directoryPath}/${fileName}`;

    // Check if the CSV file exists
    fs.access(csvFilePath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error('CSV file does not exist:', err);
        rl.close();
        process.exit(1);
      }

      // Call the importData function to initiate the data import process
      importData(csvFilePath);

      rl.close();
    });
  });
});

