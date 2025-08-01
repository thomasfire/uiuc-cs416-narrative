const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Function to read CSV and return promise with data
function readCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}

// Main function to combine CSV files
async function combineCSVFiles(filePaths, outputFile) {
    try {
        // Read all files
        const dataArray = await Promise.all(filePaths.map(readCSV));
        
        // Get all unique years (from first column assumed to be year)
        const years = [...new Set(dataArray.flat().map(row => Object.values(row)[0]))];
        
        // Get all unique classes (column headers except first)
        const headers = Object.keys(dataArray[0][0]);
        const classes = headers.slice(1); // Assuming first column is year
        
        // Create combined data structure - now organized by year
        const combinedData = years.map(year => {
            const yearObj = { year: year };
            
            // For each class, get the value from each file
            classes.forEach(cls => {
                dataArray.forEach((fileData, fileIndex) => {
                    // Extract filename without extension for the key
                    const fileName = path.basename(filePaths[fileIndex], '.csv');
                    
                    // Find the row matching the current year
                    const matchingRow = fileData.find(row => Object.values(row)[0] == year);
                    if (yearObj[cls] == undefined) {
                        yearObj[cls] = {};
                    }
                    if (matchingRow) {
                        yearObj[cls][fileName] = parseFloat(matchingRow[cls]) || 0;
                    } else {
                        yearObj[cls][fileName] = 0;
                    }
                });
            });
            
            return yearObj;
        });
        
        // Write to output file
        fs.writeFileSync(outputFile, JSON.stringify(combinedData, null, 2));
        console.log(`Combined data written to ${outputFile}`);
        
        return combinedData;
    } catch (error) {
        console.error('Error combining CSV files:', error);
        throw error;
    }
}

// Example usage:
const csvFiles = [
     'diff_mort_rent.csv',
     'downpayment.csv',
     'mortgage_payment.csv',
     'price_to_rent.csv'
 ];
 combineCSVFiles(csvFiles, 'combined_data.json');

module.exports = { combineCSVFiles };