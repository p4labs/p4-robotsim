import {TwoWheelRobot} from "../robots";
import {ArduinoUno, Servo, UltrasonicSensor} from "../Arduino";
import {sensorPosition} from "../robots/TwoWheelRobot";


export class TwoServoRobot {

    public arduino : ArduinoUno | null = null;
    public servoLeft : Servo = new Servo(9, "leftServo");
    public servoRight : Servo = new Servo(10, "rightServo");
    public ultrasonicSensors : {[position: string]: {sensor: UltrasonicSensor, triggerPin: number, echoPin: number}} = {}

    public environment : TwoWheelRobot | null = null;



    constructor(canvas:any, canvasBackground='white',  coinImagePath: string = "imgs/coin.png") {
        this.environment = new TwoWheelRobot(canvas, undefined, undefined, canvasBackground, coinImagePath);
        this.arduino = new ArduinoUno();

        //connect the servos
        this.arduino.addConnection(9, this.servoLeft);
        this.arduino.addConnection(10, this.servoRight);





        //add arduino events
        //update the wheel speeds from servo components
        this.arduino.addCPUEvent(5, () => {
            const leftServoSpeed = (this.servoLeft.getWidthOfLastPulse() - 1.4);
            const rightServoSpeed = -1*(this.servoRight.getWidthOfLastPulse() - 1.4);
            this.environment?.setSpeeds(leftServoSpeed, rightServoSpeed);
            //console.log("Left: ", leftServoSpeed,this.servoLeft.getWidthOfLastPulse(),"\nRight: ", rightServoSpeed, this.servoRight.getWidthOfLastPulse());
        })

        this.arduino.addCPUEvent(50, () => {
            //apply the force on the wheels
            this.environment?.applyForces();
            //update the sensor distances
            for(const key in this.ultrasonicSensors){
                this.ultrasonicSensors[key].sensor.setDistanceOfObstacle(this.environment.ultrasonicSensorDistances[key]);
            }


        })
        this.arduino.addCPUEvent(50, () => {
             this.environment?.tick(1000);

        })
        this.arduino.addCPUEventMicrosecond(5, (cpuCycles : number) => {
            if(this.environment)
            {
                for(const key in this.ultrasonicSensors)
                {

                    this.arduino?.writeDigitalPin(this.ultrasonicSensors[key].sensor.getEchoPin(), this.ultrasonicSensors[key].sensor.getEchoPinState(cpuCycles));

                }

            }
        })

    }

    addUltrasonicSensor(position : sensorPosition, triggerPin: number, echoPin: number){
        this.ultrasonicSensors[position] = {
            sensor: new UltrasonicSensor(triggerPin, echoPin, position),
            triggerPin, echoPin
        }

        this.arduino.addConnection(triggerPin, this.ultrasonicSensors[position].sensor);
        this.environment.addUltrasonicSensor(position);
    }

    run(hex: string)
    {
        this.environment?.reset();
        this.environment?.tick(100);
        for(const key in this.ultrasonicSensors){
            this.ultrasonicSensors[key].sensor.setDistanceOfObstacle(this.environment.ultrasonicSensorDistances[key]);
        }
        this.arduino?.executeProgram(hex);
    }

    stop()
    {
        this.arduino?.stopExecute();
        this.servoLeft.reset();
        this.servoRight.reset();
        for(const key in this.ultrasonicSensors){
            this.ultrasonicSensors[key].sensor.reset();
        }

    }
}
