class Person {
    name: String;
    private type: string;
    protected age: number = 25;

    constructor(name: String, public userName: string) { // public可讓userName properties不存在於Person但存在於someone物件中
        this.name = name;
    }

    printAge() {
        console.log(this.age);
        this.setType("Old Guy");
    }

    private setType(type: string) {
        this.type = type;
        console.log(this.type);
    }
}

const someone = new Person("Max", "max");
console.log(someone);

someone.printAge();
// someone.setType("Cool Guy"); // Won't work with private method

// Inheritance
class Max extends Person {
    name = "Max";

    constructor(userName:string) {
        super("Max", userName); // 會呼叫parent class的constructor
        this.age = 30; // can't access type because type is private
    }
}
const me = new Max("Anna");
console.log(me);

// Getters & Setters
class Plant {
    private _species: string = "Default";

    get species() {
        return this._species;
    }

    set species(value: string) {
        if (value.length > 3) {
            this._species = value;
        }
        else {
            this._species = "Default";
        }
    }
}

let plant = new Plant();
console.log(plant.species);
plant.species = "AB";
console.log(plant.species);
plant.species = "Green Plant";
console.log(plant.species);

// Static Properties & Methods
class Helpers {
    static PI: number = 3.14;
    static calc(diameter: number): number {
        return this.PI * diameter;
    }
}
console.log(2 * Helpers.PI);
console.log(Helpers.calc(8));