function getGCD(a, b) {
    while (b > 0) {
        var temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}
function phanSo(a, b) {
    if (b === 0) {
        return "Cannot divide by zero.";
    }
    else if (a % b === 0) {
        return (a / b).toString();
    }
    else {
        var gcd = getGCD(Math.abs(a), Math.abs(b));
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
}
console.log(phanSo(5, 10));
