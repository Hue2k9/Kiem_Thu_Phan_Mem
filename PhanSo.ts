const ExcelJS = require("exceljs");
const workbook = new ExcelJS.Workbook();
const fs = require("fs");
require("dotenv").config();

function getGCD(a, b) {
    while (b > 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }

function phanSo(a, b) {
    if (b === 0) {
      return "Cannot divide by zero.";
    } else if (a % b === 0) {
      return (a / b).toString();
    }
    let gcd = getGCD(Math.abs(a), Math.abs(b));
    a /= gcd;
    b /= gcd;
    if (b < 0) {
       a *= -1;
       b *= -1;
    }
    if ((a > 0 && b < 0) || (a < 0 && b < 0)) {
       a *= -1;
       b *= -1;
    }
    return a + "/" + b;
}

const writeFileExcel = async () =>{
    await workbook.xlsx.readFile(process.env.FILE_EXCEL_PATH);
    const worksheet = workbook.getWorksheet(process.env.WORK_SHEET_NAME);
    worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
        if(rowNumber > 2){
            let a = worksheet.getCell(`C${rowNumber}`).value;
            let b =  worksheet.getCell(`D${rowNumber}`).value;
            worksheet.getCell(`E${rowNumber}`).value = phanSo(a,b);
        }
    });

    workbook.xlsx.writeFile(process.env.FILE_EXCEL_PATH).then(function () {
        console.log("Write to excel file successfully");
    });
}

writeFileExcel();