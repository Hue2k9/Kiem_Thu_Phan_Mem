const ExcelJS = require("exceljs");
const workbook = new ExcelJS.Workbook();
const fs = require("fs");
require("dotenv").config();
const acorn = require('acorn');

function analyzeControlFlow(code) {
  const ast = acorn.parse(code, {
    sourceType: 'module',
    plugins: {
      jsx: true,
    },
    locations: true
  });
  let controlFlowGraph = {
    index: [],
    text: [],
    control: [],
    nodeEnd: [],
    ifElse: [],
    nodeControl:[],
  };
  let currentIndex = 0;
  let previousLineCode = ''; // Dòng lệnh trước đó
  for (let i = 0; i < ast.body.length; i++) {
    const node = ast.body[i];
    if (node.type === 'FunctionDeclaration') {
      const startLine = node.loc.start.line;
      const endLine = node.loc.end.line;

      for (let line = startLine; line <= endLine; line++) {
        const lineCode = code.split('\n')[line - 1];
        const lineType = getTypeForLine(line, node.body);

        if (lineType === 'IfStatement' || lineType === 'WhileStatement' || lineType === 'ForStatement') {
          if (previousLineCode.trim() !== '') {
            // So sánh dòng lệnh trước đó với dòng lệnh hiện tại
            if (/(if|else|return)/i.test(previousLineCode) || previousLineCode.trim()==='}'){
              currentIndex++;
              controlFlowGraph.index.push(currentIndex);
              controlFlowGraph.text.push({
                i: currentIndex,
                text: lineCode,
              });
             // controlFlowGraph.text.push(`Các lệnh ${currentIndex} - Loại: ${lineType} - Lệnh: ${lineCode}`);
              controlFlowGraph.control.push(currentIndex)
              if (/(if|else)/i.test(lineCode)){
                controlFlowGraph.control.push([currentIndex]); //push if
                let key = {};
                key.index=currentIndex;
                key.text=lineCode.trim();
                controlFlowGraph.ifElse.push(key);
                controlFlowGraph.nodeControl.push(currentIndex);
              }
              if (/(return)/i.test(lineCode))
                controlFlowGraph.nodeEnd.push(currentIndex);
            }
            else if(/(if|else)/i.test(lineCode)){
              currentIndex++;
              controlFlowGraph.index.push(currentIndex);
              controlFlowGraph.control.push([currentIndex]);   //push if
              let key = {};
              key.index=currentIndex;
              key.text=lineCode.trim();
              controlFlowGraph.ifElse.push(key);
              controlFlowGraph.nodeControl.push(currentIndex);
            //  controlFlowGraph.text.push(`Các lệnh  ${currentIndex} - Loại: ${lineType} - Lệnh: ${lineCode}`);
              controlFlowGraph.text.push({
                i: currentIndex,
                text: lineCode,
              });  
          }
          //  console.log(`Dòng ${line - 1} phụ thuộc vào dòng ${line} - Lệnh trước: ${previousLineCode} - Lệnh hiện tại: ${lineCode}`);
          }


        } else if (lineType === 'BlockStatement') {
          // console.log(lineCode);
        } else if (lineType === 'ReturnStatement') {
          currentIndex++;
          controlFlowGraph.index.push(currentIndex);
          controlFlowGraph.control.push(currentIndex);
          controlFlowGraph.nodeEnd.push(currentIndex);
       //   controlFlowGraph.text.push(`Các lệnh return ${currentIndex} - Loại: ${lineType} - Lệnh: ${lineCode}`);
          controlFlowGraph.text.push({
            i: currentIndex,
            text: lineCode,
          });  
      } else {
          controlFlowGraph.index.push(currentIndex);
      //    controlFlowGraph.text.push(`Các lệnh khac ${currentIndex} - Loại: ${lineType || 'Other'} - Lệnh: ${lineCode}`);
          controlFlowGraph.text.push({
            i: currentIndex,
            text: lineCode,
          });  
      }
        previousLineCode = lineCode;
      }
    } 
    else {
      const lineCode = code.split('\n')[node.loc.start.line - 1];
      controlFlowGraph.index.push(currentIndex);
    //  controlFlowGraph.text.push(`Các lệnh  ${currentIndex} - Loại: Other - Lệnh: ${lineCode}`);
      controlFlowGraph.text.push({
        i: currentIndex,
        text: lineCode,
      });
    }
  }
  const arr = [...controlFlowGraph.control];
  
  const formattedArr = [];
  let tempArr = [];
  let index = 0;
  for (const element of arr) {
    if (Array.isArray(element)) {
      if (tempArr.length > 0) {
        formattedArr.push(tempArr);
        tempArr = [];
      }
      formattedArr.push(element);
    } else {
      tempArr.push(element);
    }
    index++;
    
    if (formattedArr.length >= 2 && formattedArr[formattedArr.length-2].length>=2 && Array.isArray(formattedArr[formattedArr.length - 2]) && !formattedArr[formattedArr.length-2].includes(arr[index])){
      formattedArr.push(arr[index-1]);
    }
  }
  
  if (tempArr.length > 0) {
    formattedArr.push(tempArr);
  }
   
   for(let i =0; i<formattedArr.length; i++){
    if (i>0 &&  formattedArr[i].length==1 && formattedArr[i-1].length>1 && formattedArr[i-1].includes(...formattedArr[i])){
      formattedArr.splice(i,1);
    }
   }
   formattedArr.push([]);
   controlFlowGraph.control=[...formattedArr];
   return controlFlowGraph;
}

function getTypeForLine(line, body) {
  for (const statement of body.body) {
    if (statement.loc.start.line <= line && statement.loc.end.line >= line) {
      return statement.type;
    }
  }
  return null;
}

const code = `
function phanSo(a, b) {
  if (b === 0) { //1
    return "Cannot divide by zero."; //2
  } else if (a % b === 0) {  //3
    return (a / b).toString();  //4
  }
  let gcd = getGCD(Math.abs(a),Math.abs(b)); //5
  a /= gcd;  //5
  b /= gcd; //5
  if (b < 0) {  //6
    a *= -1;  //7
    b *= -1;  //7
  }
  if ((a > 0 && b < 0) || (a < 0 && b < 0)) {  //8
    a *= -1;   //9
    b *= -1;  //9
  }
  return a + "/" + b;  //10
}
`;


function extractConditionFromText(text) {
  const regex = /if\s*\((.*?)\)\s*{/;
  const match = regex.exec(text);
  if (match) {
    return match[1].trim();
  }
  return '';
}

//########################## TEST CASE #####################################
// Hàm tạo test case thỏa mãn điều kiện trong lệnh điều khiển
function generateTestCase(controlFlowGraph, paths) {
  const testCases = [];
  paths.forEach((path)=>{
    const command = [];
    for(let i=0; i<path.length-1; i++){
       if(controlFlowGraph.nodeControl.includes(path[i]) && controlFlowGraph.nodeEnd.includes(path[i+1])){
          controlFlowGraph.ifElse.forEach((e)=>{
            if (e.index === path[i] && i<=path.length-2){
              command.push(e.text);              
            }
          })
        }
        else if (controlFlowGraph.nodeControl.includes(path[i]) && path[i]+1===path[i+1]){
          controlFlowGraph.ifElse.forEach((e)=>{
            if (e.index === path[i]){
              command.push(e.text);
            }
          });
        }
    }
    for (const textIf of command) {
      const condition = extractConditionFromText(textIf);
      let a, b;
      do {
        a = Math.floor(Math.random() * 100) - 50;
        b = Math.floor(Math.random() * 100) - 50;
      } while (!eval(condition));
      testCases.push({ a, b });
    }
  })
  testCases.pop();
  return testCases;
}

function getGCD(a, b) {
  while (b > 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

function phanSo(a, b, vertexNumber) {
  if (b === 0) { //1
    return { result: "Cannot divide by zero.", vertexNumber }; //2
  } else if (a % b === 0) {  //3
    return { result: (a / b).toString(), vertexNumber };  //4
  }
  let gcd = getGCD(Math.abs(a), Math.abs(b)); //5
  a /= gcd;  //5
  b /= gcd; //5
  if (b < 0) {  //6
    a *= -1;  //7
    b *= -1;  //7
  }
  if ((a > 0 && b < 0) || (a < 0 && b < 0)) {  //8
    a *= -1;   //9
    b *= -1;  //9
  }
  return { result: a + "/" + b, vertexNumber };  //10
}


// Hàm tìm đường đi DFS
function findPaths(graph, startNode, endNodes, currentPath, allPaths) {
  currentPath.push(startNode);
  if (endNodes.includes(startNode)) {
    allPaths.push(currentPath.slice());
  } else {
    const neighbors = graph[startNode];
    for (let i = 0; i < neighbors.length; i++) {
      if (!currentPath.includes(neighbors[i])) {
        findPaths(graph, neighbors[i], endNodes, currentPath, allPaths);
      }
    }
  }
  currentPath.pop();
}

// Hàm lấy tập đường đi cơ bản
function findBasisSetOfPaths(graph, startNode, endNodes) {
  const allPaths = [];
  findPaths(graph, startNode, endNodes, [], allPaths);
  return allPaths;
}

const controlFlowGraph = analyzeControlFlow(code);

const basisSetOfPaths = findBasisSetOfPaths(controlFlowGraph.control, 1, [2, 4, 10]);
console.log(basisSetOfPaths);
console.log(generateTestCase(controlFlowGraph, basisSetOfPaths));


