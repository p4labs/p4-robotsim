import {TwoWheelRobotEnv} from "../environment";
import {ArduinoUno, Servo, UltrasonicSensor} from "../Arduino";
import {sensorPosition} from "../environment/TwoWheelRobotEnv";


export class TwoServoRobot {

    public arduino : ArduinoUno | null = null;
    public servoLeft : Servo;
    public servoRight : Servo;
    public ultrasonicSensors : {[position: string]: {sensor: UltrasonicSensor, triggerPin: number, echoPin: number}} = {}

    public environment : TwoWheelRobotEnv | null = null;


    constructor(leftPin: number, rightPin: number) {
        this.environment = new TwoWheelRobotEnv(undefined, undefined);
        this.arduino = new ArduinoUno();

        this.servoLeft = new Servo(leftPin, "leftServo");
        this.servoRight = new Servo(rightPin, "rightServo");

        //connect the servos
        this.arduino.addConnection(leftPin, this.servoLeft);
        this.arduino.addConnection(rightPin, this.servoRight);


        //add arduino events
        //update the wheel speeds from servo components
        this.arduino.addCPUEvent(100, () => {
            const leftServoSpeed = this.servoLeft.getSpeed();
            const rightServoSpeed = -1 * this.servoRight.getSpeed();
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

            this.environment?.tick(50);
        })

        this.arduino.addCPUEventMicrosecond(1, (cpuCycles : number) => {
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
