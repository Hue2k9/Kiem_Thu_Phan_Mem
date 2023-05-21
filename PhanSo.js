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

const controlFlowGraph = [
  [ 1 ],     [ 2, 3 ],
  [ 3 ],     [ 4, 5 ],
  [ 6 ],     [ 6 ],
  [ 7, 8 ],  [ 8 ],
  [ 9, 10 ],
  [],
];


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

const basisSetOfPaths = findBasisSetOfPaths(controlFlowGraph, 1, [2, 4, 10]);
console.log(basisSetOfPaths);
