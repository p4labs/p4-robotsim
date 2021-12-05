export abstract class Component{
    /*
    This design of an electronic component is it general.
    It actually assumes that a component will only have one control pin.
    It also does not take into consideration power or ground pins.
    It works for this simple simulation though
     */
    protected label : string;
    protected pin :  number;
    protected pinState : boolean;


    constructor(pin : number, label: string)
    {
        this.pin = pin;
        this.label = label;
        this.pinState = false;

    }

    getLabel() : string { return this.label;}
    getPin() : number {return this.pin};
    getPinState() : boolean { return this.pinState;}

    abstract update(pinState : boolean, cpuCycles : number) : void;
    abstract reset() : void;
}
