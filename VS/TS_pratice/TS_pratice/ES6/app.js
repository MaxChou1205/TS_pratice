// Rest & Spread
var numbers = [1, 10, 99, -5];
console.log(Math.max(33, 99, 10, -1));
console.log(Math.max.apply(Math, numbers));
function makeArray() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return args;
}
console.log(makeArray(1, 2, 6));
// Destructuring
var myHobbies = ["Cooking", "Sports"];
//const hobby1 = myHobbies[0];
//const hobby2 = myHobbies[1];
var hobby1 = myHobbies[0], hobby2 = myHobbies[1];
console.log(hobby1, hobby2);
var userData = { userName: "Max", age: 27 };
var myName = userData.userName, myAge = userData.age;
console.log(myName, myAge);
// Template Literals
var userName = "Max";
// const greeting = "Hello, I'm " + userName;
var greeting = "Hello, I'm " + userName;
console.log(greeting);
