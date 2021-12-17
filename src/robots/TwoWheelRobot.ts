import {Body, Engine, Render, Bodies, World, Vector, Runner, Events, Mouse, MouseConstraint} from "matter-js";
import {createPartCircle} from "./utils/CustomBodies"
import { getTranformedPoint, findMinimumDistanceToObstacle } from "./utils/utils";

type event = (robot : TwoWheelRobot) => any;
export type sensorPosition = 'L1'| 'L2' | 'L3' | 'F1' | 'F2' | 'F3' | 'R1' | 'R2' | 'R3' | 'B1' | 'B2'| 'B3';
export class TwoWheelRobot {
    private _canvas : any;
    private _engine : Engine;
    private _render : Render;
    private _runner : Runner;

    robotBody : Body;
    leftWheelBody : Body;
    rightWheelBody : Body;
    robotInitialPosition : Vector;
    robotInitialAngle : number;

    robotMass : number = 1000;
    robotFrictionAir:number = 0.5;
    static readonly forceMultiplier = 0.0015;

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
        'B3': {x: -14, y: 9, angle: -Math.PI}
    }
    ultrasonicSensorDistances : { [position: string]: number; } = {};

    robot : Body;

    obstacles : Array<Body>;
    coins : Array<Body>;
    removedCoins : Array<Body> = [];

    leftWheelSpeed : number;
    rightWheelSpeed : number;
    background : string;
    coinImagePath: string;
    OnAllCoinsCollectedEvent : event = null;

    constructor(canvas:any, robotInitialPosition : Vector = { x: 50, y: 100}, robotInitialAngle : number = 0, background = "white", coinImagePath: string = "images/coin.png") {
        this._canvas = canvas;
        this._engine = Engine.create();
        this.background = background;
        this.coinImagePath = coinImagePath;
        //remove gravity
        this._engine.gravity.y = 0;

        this._render = Render.create({
            canvas: this._canvas,
            engine: this._engine,
            options: {
                width: 800,
                height: 800,
                wireframes: false,
                background: this.background,
                showAngleIndicator: false,
                showConvexHulls: false,
                showVelocity: false,
                showPositions: false
            }
        });

        this._runner = Runner.create();



        this.obstacles = [];
        this.coins = [];
        this.rightWheelSpeed = 0;
        this.leftWheelSpeed = 0;

        //create the robot body object
        this.robotBody = Bodies.rectangle(100, 100, 30, 20, {render: {fillStyle : 'DarkRed'}} );
        this.leftWheelBody = Bodies.rectangle(90, 90, 8, 2, {render: {fillStyle : 'black'}});
        this.rightWheelBody = Bodies.rectangle(90, 110, 8, 2, {render: {fillStyle : 'black'}});
        //create the robot from parts
        this.robot = Body.create({parts: [this.robotBody, this.leftWheelBody, this.rightWheelBody]});
        this.robot.frictionAir = this.robotFrictionAir;
        Body.setMass(this.robot, this.robotMass);
        this.robotInitialPosition = robotInitialPosition;
        this.robotInitialAngle = robotInitialAngle;

        Body.setPosition(this.robot, this.robotInitialPosition);
        Body.setAngle(this.robot, this.robotInitialAngle);


        World.add(this._engine.world, [this.robot, ]);//obstacle]);

        Render.run(this._render);
        this.reset();



        let self = this;

        Events.on(this._render, 'afterRender', function() {
            const ctx = self._render.context;
            ctx.strokeStyle = 'rgba(50,0,255,0.05)';
            ctx.lineWidth = 0.1;

            for(const key in self.ultrasonicSensorDistances)
            {
                const startingPosition = getTranformedPoint(self.robot.position, self.robot.angle, TwoWheelRobot.ultrasonicSensorsOffset[key].x, TwoWheelRobot.ultrasonicSensorsOffset[key].y);
                const startingAngle = self.robot.angle - TwoWheelRobot.ultrasonicSensorsOffset[key].angle + 7.5*Math.PI/180;

                const numberOfRays = 15;
                for(var i =0; i < numberOfRays; i+=1) {
                    if(i%2) continue;
                    const endPoint = getTranformedPoint(startingPosition, startingAngle - i * Math.PI / 180, TwoWheelRobot.maxUltrasonicDistance, 0);

                    const x1 = startingPosition.x;
                    const y1 = startingPosition.y;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(endPoint.x, endPoint.y);
                    ctx.stroke();


                }
            }


            self.updateUltrasonicSensor();



        });
        //add collision events to calculate obstacle distance
        Events.on(this._engine, 'collisionActive',function(event) {self.onCollision(event);}) //;


    }

    public addUltrasonicSensor(position : sensorPosition){
        this.ultrasonicSensorDistances[position] = TwoWheelRobot.maxUltrasonicDistance;
    }
    private onCollision(event : Matter.IEventCollision<Engine>)
    {
        const pairs = event.pairs;
        //console.log(pairs);
        let isLastCoin = false;

        pairs.forEach(({bodyA, bodyB}) => {

            let coinBody = null;
            if(bodyA.label === 'coin')
            {
                coinBody = bodyA;
            }
            else if(bodyB.label === 'coin' )
            {
                coinBody = bodyB;

            }
            if(coinBody !== null) {
                World.remove(this._engine.world, coinBody);
                this.removedCoins.push(coinBody);
                if (this.removedCoins.length === this.coins.length) isLastCoin = true;
            }
            if(isLastCoin && this.OnAllCoinsCollectedEvent)
            {
                this.OnAllCoinsCollectedEvent(this);
            }

        });

    }
    private updateUltrasonicSensor()
    {

        for(const key in this.ultrasonicSensorDistances){
            const sensorStartingPoint = getTranformedPoint(this.robot.position, this.robot.angle, TwoWheelRobot.ultrasonicSensorsOffset[key].x, TwoWheelRobot.ultrasonicSensorsOffset[key].y);
            const startingAngle = this.robot.angle - TwoWheelRobot.ultrasonicSensorsOffset[key].angle + 7.5*Math.PI/180;

            this.ultrasonicSensorDistances[key] = findMinimumDistanceToObstacle(sensorStartingPoint, startingAngle, TwoWheelRobot.maxUltrasonicDistance, this.obstacles);
            if(this.ultrasonicSensorDistances[key] > TwoWheelRobot.maxUltrasonicDistance)
                this.ultrasonicSensorDistances[key] = TwoWheelRobot.maxUltrasonicDistance;
        }


    }
    addObstacleRectangle(posX : number, posY : number, width : number, height : number, color = "grey" ) : void {
        const obstacle = Bodies.rectangle(posX, posY, width, height, { isStatic: true, label: 'obstacle', render: {fillStyle : color} });
        this.obstacles.push(obstacle);
        World.add(this._engine.world, [obstacle]);
    }
    addCoin(posX : number, posY : number){
        const coin = Bodies.circle(posX, posY, 15, {isSensor: true, label: 'coin'});

        this.coins.push(coin);
        coin.render.sprite.texture = this.coinImagePath;
        World.add(this._engine.world, [coin]);

    }
    setSpeeds(left : number, right : number) : void {
        this.leftWheelSpeed = left;
        this.rightWheelSpeed = right;
    }
    private once = 0;
    applyForces() : void {

        const leftForcePosition = getTranformedPoint(this.robotBody.position, this.robot.angle, 0, -10);
        const rightForcePosition = getTranformedPoint(this.robotBody.position, this.robot.angle, 0, 10);
        let leftWheelForce = Vector.create(TwoWheelRobot.forceMultiplier*Math.abs(this.leftWheelSpeed), 0);
        leftWheelForce = Vector.rotate(leftWheelForce, this.robot.angle);
        if(this.leftWheelSpeed < 0)
            leftWheelForce = Vector.neg(leftWheelForce);

        let rightWheelForce = Vector.create(TwoWheelRobot.forceMultiplier*Math.abs(this.rightWheelSpeed), 0);
        rightWheelForce = Vector.rotate(rightWheelForce, this.robot.angle);
        if(this.rightWheelSpeed < 0)
            rightWheelForce = Vector.neg(rightWheelForce);

        Body.applyForce(this.robot, rightForcePosition, rightWheelForce);
        Body.applyForce(this.robot, leftForcePosition, leftWheelForce);


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
    run() {
        Runner.run(this._engine);
    }

    tick(period : number) {
        Engine.update(this._engine, period);
    }

    reset()
    {
        Body.setPosition(this.robot, this.robotInitialPosition);
        Body.setAngle(this.robot, this.robotInitialAngle);
        Body.setVelocity(this.robot, {x:0,y:0});
        Body.setAngularVelocity(this.robot,0);
        this.leftWheelSpeed = 0;
        this.rightWheelSpeed = 0;
        for(const coin of this.removedCoins)
        {
            World.addBody(this._engine.world, coin);
        }
        this.removedCoins = [];

        this.tick(10);
        this.updateUltrasonicSensor();

    }
}
