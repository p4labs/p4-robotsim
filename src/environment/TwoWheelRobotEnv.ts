import {
    Body,
    Engine,
    Render,
    Bodies,
    World,
    Vector,
    Runner,
    Events,
    Mouse,
    MouseConstraint,
    Composite
} from "matter-js";
import { SimulationEnvironment } from "./SimulationEnvironment";

import {createPartCircle} from "./utils/CustomBodies"
import { getTranformedPoint, findMinimumDistanceToObstacle } from "./utils/utils";

export type sensorPosition = 'L1'| 'L2' | 'L3' | 'F1' | 'F2' | 'F3' | 'R1' | 'R2' | 'R3' | 'B1' | 'B2'| 'B3' | 'CFL' | 'CFR' | 'CBL' | 'CBR';

export class TwoWheelRobotEnv {

    robotBody : Body;
    leftWheelBody : Body;
    rightWheelBody : Body;
    robotInitialPosition : Vector;
    robotInitialAngle : number;
    simulation: SimulationEnvironment;

    robotMass : number = 1000;
    robotFrictionAir:number = 1;
    static readonly forceMultiplier = 0.5;

    ultrasonicSensor : Body;
    static readonly maxUltrasonicDistance = 400;
    static readonly ultrasonicSensorsOffset : {[position: string]: {x:number, y: number, angle: number}} = {
        'L1': {x: -14, y: -9, angle: Math.PI/2},
        'L2': {x: 0, y: -9, angle: Math.PI/2},
        'L3': {x: 14, y:-9, angle: Math.PI/2},
        'R1': {x: -14, y: 9, angle: -Math.PI/2},
        'R2': {x: 0, y: 9, angle: -Math.PI/2},
        'R3': {x: 14, y:9, angle: -Math.PI/2},
        'F1': {x: 14, y:-9, angle: 0},
        'F2': {x: 14, y: 0, angle: 0},
        'F3': {x: 14, y: 9, angle: 0},
        'B1': {x: -14, y:-9, angle: -Math.PI},
        'B2': {x: -14, y: 0, angle: -Math.PI},
        'B3': {x: -14, y: 9, angle: -Math.PI},
        'CFL': {x: 14, y:-9, angle: Math.PI/4},
        'CFR': {x: 14, y: 9, angle: -Math.PI/4},
        'CBL': {x: -14, y:-9, angle: -5*Math.PI/4},
        'CBR': {x: -14, y: 9, angle: 5*Math.PI/4},

    }
    ultrasonicSensorDistances : { [position: string]: number; } = {};

    robot : Body;
    leftWheelSpeed : number;
    rightWheelSpeed : number;


    constructor(robotInitialPosition : Vector = { x: 50, y: 100}, robotInitialAngle : number = 0) {

        this.rightWheelSpeed = 0;
        this.leftWheelSpeed = 0;

        //create the robot body object
        this.robotBody = Bodies.rectangle(100, 100, 30, 20, {render: {fillStyle : 'DarkRed'}} );
        this.leftWheelBody = Bodies.rectangle(90, 90, 8, 4, {render: {fillStyle : 'black'}});
        this.rightWheelBody = Bodies.rectangle(90, 110, 8, 4, {render: {fillStyle : 'black'}});
        //create the robot from parts
        this.robot = Body.create({parts: [this.robotBody, this.leftWheelBody, this.rightWheelBody]});

        this.robot.frictionAir = this.robotFrictionAir;
        Body.setMass(this.robot, this.robotMass);
        this.robotInitialPosition = robotInitialPosition;
        this.robotInitialAngle = robotInitialAngle;

        Body.setPosition(this.robot, this.robotInitialPosition);
        Body.setAngle(this.robot, this.robotInitialAngle);




        /*
        // add mouse control
        const mouse = Mouse.create(this._canvas);

         const mouseConstraint = MouseConstraint.create(this._engine, {
                mouse: mouse
            });

        World.add(this._engine.world, mouseConstraint);
        // keep the mouse in sync with rendering
        this._render.mouse = mouse;
        */

    }

    public addUltrasonicSensor(position : sensorPosition){
        this.ultrasonicSensorDistances[position] = TwoWheelRobotEnv.maxUltrasonicDistance;
    }

    private updateUltrasonicSensor()
    {

        for(const key in this.ultrasonicSensorDistances){
            const sensorStartingPoint = getTranformedPoint(this.robot.position, this.robot.angle, TwoWheelRobotEnv.ultrasonicSensorsOffset[key].x, TwoWheelRobotEnv.ultrasonicSensorsOffset[key].y);
            const startingAngle = this.robot.angle - TwoWheelRobotEnv.ultrasonicSensorsOffset[key].angle + 7.5*Math.PI/180;

            this.ultrasonicSensorDistances[key] = findMinimumDistanceToObstacle(sensorStartingPoint, startingAngle, TwoWheelRobotEnv.maxUltrasonicDistance, this.simulation.obstacles);
            if(this.ultrasonicSensorDistances[key] > TwoWheelRobotEnv.maxUltrasonicDistance)
                this.ultrasonicSensorDistances[key] = TwoWheelRobotEnv.maxUltrasonicDistance;

            if(this.ultrasonicSensorDistances[key] < 5)
                console.log("distance:" + this.ultrasonicSensorDistances[key])
        }


    }

    setSpeeds(left : number, right : number) : void {
        this.leftWheelSpeed = left;
        this.rightWheelSpeed = right;
    }
    //TODO review if this is actually solving a bug or not
    private starting = true;


    /**
     * The movement of the robot happens by applying forces from the wheel position and
     * in the direction of the robot. The amount of force is relative to the width of the
     * last pulse outputted from the Uno to the servos.
     *
     * Every 50ms the forces are applied depending on the width of the last pulse
     */
    applyForces() : void {
        if(!this.starting) {
            const leftForcePosition = getTranformedPoint(this.robotBody.position, this.robot.angle, 0, -10);
            const rightForcePosition = getTranformedPoint(this.robotBody.position, this.robot.angle, 0, 10);
            let leftWheelForce = Vector.create(TwoWheelRobotEnv.forceMultiplier * Math.abs(this.leftWheelSpeed), 0);
            leftWheelForce = Vector.rotate(leftWheelForce, this.robot.angle);
            if (this.leftWheelSpeed < 0)
                leftWheelForce = Vector.neg(leftWheelForce);

            let rightWheelForce = Vector.create(TwoWheelRobotEnv.forceMultiplier * Math.abs(this.rightWheelSpeed), 0);
            rightWheelForce = Vector.rotate(rightWheelForce, this.robot.angle);
            if (this.rightWheelSpeed < 0)
                rightWheelForce = Vector.neg(rightWheelForce);

            Body.applyForce(this.robot, leftForcePosition, leftWheelForce);
            Body.applyForce(this.robot, rightForcePosition, rightWheelForce);
        }

        else
        {
            this.starting = false;
        }

    }

    setRobotPosition(position : Vector) : void
    {
        Body.setPosition(this.robot, position);
    }

    setRobotInitialPosition(position : Vector) : void
    {
        this.robotInitialPosition = position;
        this.setRobotPosition(this.robotInitialPosition);
    }


    setSimulation(env: SimulationEnvironment){
        this.simulation = env;
    }

    render(render : Render){

        const ctx = render.context;
        ctx.strokeStyle = 'rgba(50,0,255,0.4)';
        ctx.lineWidth = 0.1;

        for(const key in this.ultrasonicSensorDistances)
        {
            const startingPosition = getTranformedPoint(this.robot.position, this.robot.angle, TwoWheelRobotEnv.ultrasonicSensorsOffset[key].x, TwoWheelRobotEnv.ultrasonicSensorsOffset[key].y);
            const startingAngle = this.robot.angle - TwoWheelRobotEnv.ultrasonicSensorsOffset[key].angle + 7.5*Math.PI/180;

            const numberOfRays = 15;
            for(var i =0; i < numberOfRays; i+=1) {
                if(i%2) continue;
                const endPoint = getTranformedPoint(startingPosition, startingAngle - i * Math.PI / 180, TwoWheelRobotEnv.maxUltrasonicDistance, 0);

                const x1 = startingPosition.x;
                const y1 = startingPosition.y;
                ctx.moveTo(x1, y1);
                ctx.lineTo(endPoint.x, endPoint.y);
                ctx.stroke();


            }
        }
        /*
        //Add event with 'mousemove'
        Events.on(mouseConstraint, 'mousemove', function (event) {
            //For Matter.Query.point pass "array of bodies" and "mouse position"

            //Your custom code here
            console.log(event); //returns a shape corrisponding to the mouse position

        });

         */
        this.updateUltrasonicSensor();
    }

    tick(period : number) {
        this.simulation.tick(period);
    }

    reset()
    {
        Body.setPosition(this.robot, this.robotInitialPosition);
        Body.setAngle(this.robot, this.robotInitialAngle);
        Body.setVelocity(this.robot, {x:0,y:0});
        Body.setAngularVelocity(this.robot,0);
        Body.update(this.robot, 10, 1,1);
        this.leftWheelSpeed = 0;
        this.rightWheelSpeed = 0;


        //this.tick(10);
        this.updateUltrasonicSensor();

    }
}
