import {Component} from "./Component";
import {getMilliSecconds} from "./Uno/format-time";

const MHZ = 16000000;

/**
 * Ref: https://www.youtube.com/watch?v=1WnGv-DPexc
 */
export class Servo extends Component{

    widthOfLastPulse : number;
    startingCpuCyclesOfPulse : number;

    constructor(pin : number, label = "Servo")
    {
        super(pin, label);
        this.widthOfLastPulse = 1.4;
        this.startingCpuCyclesOfPulse = -1;
    }

    getWidthOfLastPulse() : number { return this.widthOfLastPulse;}

    getSpeed() : number {
        return this.getWidthOfLastPulse() - 1.4;
    }

    update(pinState : boolean, cpuCycles : number)
    {
        if(pinState)
        {
            if(!this.pinState)   //if we are LOW
            {
               this.startingCpuCyclesOfPulse = cpuCycles;
            }
        }
        else
        {
            if(this.pinState)
            {
                this.widthOfLastPulse = getMilliSecconds((cpuCycles - this.startingCpuCyclesOfPulse)/MHZ);
            }
        }
        this.pinState = pinState;

    }

    reset()
    {
        this.widthOfLastPulse = 1.4;
        this.startingCpuCyclesOfPulse = -1;
    }
}
