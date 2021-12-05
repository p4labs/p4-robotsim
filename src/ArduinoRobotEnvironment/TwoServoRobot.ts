import {TwoWheelRobot} from "../robots";
import {ArduinoUno, Servo, UltrasonicSensor} from "../Arduino";


export class TwoServoRobot {

    public arduino : ArduinoUno | null = null;
    public servoLeft : Servo = new Servo(9, "leftServo");
    public servoRight : Servo = new Servo(10, "rightServo");
    public ultrasonic : UltrasonicSensor = new UltrasonicSensor(11, 12);
    public environment : TwoWheelRobot | null = null;



    constructor(canvas:any, canvasBackground='white',  coinImagePath: string = "imgs/coin.png") {
        this.environment = new TwoWheelRobot(canvas, undefined, undefined, canvasBackground, coinImagePath);
        this.arduino = new ArduinoUno();

        //connect the servos
        this.arduino.addConnection(9, this.servoLeft);
        this.arduino.addConnection(10, this.servoRight);
        this.arduino.addConnection(11, this.ultrasonic);

        //add arduino events
        //update the wheel speeds from servo components
        this.arduino.addCPUEvent(5, () => {
            const leftServoSpeed = (this.servoLeft.getWidthOfLastPulse() - 1.4);
            const rightServoSpeed = -1*(this.servoRight.getWidthOfLastPulse() - 1.4);
            this.environment?.setSpeeds(leftServoSpeed, rightServoSpeed);
            //console.log("Left: ", leftServoSpeed,this.servoLeft.getWidthOfLastPulse(),"\nRight: ", rightServoSpeed, this.servoRight.getWidthOfLastPulse());
        })

        //apply the force on the wheels
        this.arduino.addCPUEvent(50, () => {
            this.environment?.applyForces();
        })
        this.arduino.addCPUEvent(50, () => {
            this.environment?.tick(1000);
        })
        this.arduino.addCPUEventMicrosecond(5, (cpuCycles : number) => {
            if(this.environment)
                this.ultrasonic.setDistanceOfObstacle(this.environment.ultrasonicSensorDistance);
            this.arduino?.writeDigitalPin(this.ultrasonic.getEchoPin(), this.ultrasonic.getEchoPinState(cpuCycles));
        })

    }

    run(hex: string)
    {
        this.environment?.reset();
        this.environment?.tick(100);
        this.arduino?.executeProgram(hex);
    }

    stop()
    {
        this.arduino?.stopExecute();
        this.servoLeft.widthOfLastPulse = 1.4;
        this.servoRight.widthOfLastPulse = 1.4;
    }
}
