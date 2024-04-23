import {Autowire} from "../../../src/core/beans/Autowire";

export class Car {
    name: string = "Car"
}

export class Panda extends Car {
    static __bean__ = {}
    name: string = "Panda"
}

export class Punto extends Car {
    static __bean__ = {
        name: "myPunto",
        groups: ["myOldCars"]
    }
    name: string = "Punto"
}

export class Parking {
    static __bean__ = {}

    panda = Autowire(Panda);
    punto: Punto = Autowire("myPunto");
    myOldCars = Autowire(["group:myOldCars"])
    cars = Autowire([Car])
    carsByName = Autowire([Car], (x:Car) => x.name)
}
