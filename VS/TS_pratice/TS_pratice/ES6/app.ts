// Rest & Spread
const numbers: number[] = [1, 10, 99, -5];
console.log(Math.max(33, 99, 10, -1));
console.log(Math.max(...numbers));


function makeArray(...args: number[]) {
    return args;
}
console.log(makeArray(1, 2, 6));

// Destructuring
const myHobbies = ["Cooking", "Sports"];
//const hobby1 = myHobbies[0];
//const hobby2 = myHobbies[1];
const [hobby1, hobby2] = myHobbies;
console.log(hobby1, hobby2);

const userData = { userName: "Max", age: 27 };
const { userName: myName, age: myAge } = userData;
console.log(myName, myAge);

// Template Literals
const userName = "Max";
// const greeting = "Hello, I'm " + userName;
const greeting = `Hello, I'm ${userName}`;
console.log(greeting);