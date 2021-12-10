import {Body, Engine, Render, Bodies, World, Vector, Runner, Events, Mouse, MouseConstraint} from "matter-js";
import {createPartCircle} from "./utils/CustomBodies"
import { getTranformedPoint, findMinimumDistanceToObstacle } from "./utils/utils";

type event = (robot : TwoWheelRobot) => any;

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

    robotMass : number = 100000;
    robotFrictionAir:number = 0.2;

    ultrasonicSensor : Body;
    static readonly maxUltrasonicDistance = 200;
    ultrasonicSensorDistance : number;

    robot : Body;

    obstacles : Array<Body>;
    coins : Array<Body>;
    removedCoins : Array<Body> = [];

    static readonly forceMultiplier = 0.08;
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
        this.ultrasonicSensorDistance = TwoWheelRobot.maxUltrasonicDistance;

        //create the robot body object
        this.robotBody = Bodies.rectangle(100, 100, 50, 30, {render: {fillStyle : 'DarkRed'}} );
        this.leftWheelBody = Bodies.rectangle(88, 82, 20, 6, {render: {fillStyle : 'black'}});
        this.rightWheelBody = Bodies.rectangle(88, 118, 20, 6, {render: {fillStyle : 'black'}});
        //create the ultrasonic sensor body
        this.ultrasonicSensor = createPartCircle(110,-30, 50,200, -3*Math.PI/7,{label: 'ultrasonic'});
        this.ultrasonicSensor.isSensor = true;
        this.ultrasonicSensor.render.opacity = 0.2;
        Body.setDensity(this.ultrasonicSensor, 0);
        //create the robot from parts
        this.robot = Body.create({parts: [this.robotBody, this.leftWheelBody, this.rightWheelBody, this.ultrasonicSensor,]});
        this.robot.frictionAir = this.robotFrictionAir;
        Body.setMass(this.robot, this.robotMass);
        this.robotInitialPosition = robotInitialPosition;
        this.robotInitialAngle = robotInitialAngle;



        World.add(this._engine.world, [this.robot, ]);//obstacle]);

        Render.run(this._render);
        this.reset();

        //add collision events to calculate obstacle distance
        let self = this;
        Events.on(this._engine, 'collisionActive',function(event) {self.onCollision(event);}) //;
        Events.on(this._engine, 'collisionEnd', function(event ) {
            const pairs = event.pairs;

            pairs.forEach(({bodyA, bodyB}) => {
                if((bodyA.label ==='ultrasonic' && bodyB.label === 'obstacle') ||
                    (bodyB.label === 'ultrasonic' && bodyA.label === 'obstacle'))
                {
                    self.ultrasonicSensorDistance = TwoWheelRobot.maxUltrasonicDistance;
                }
            })
        });


    }

    private onCollision(event : Matter.IEventCollision<Engine>)
    {
        const pairs = event.pairs;
        //console.log(pairs);
        let isLastCoin = false;

        pairs.forEach(({bodyA, bodyB}) => {
            if(bodyA.label ==='ultrasonic' || bodyB.label === 'ultrasonic')
            {
                if(this.robot)
                {
                    this.updateUltrasonicSensor();
                }
            }
            else if(bodyA.label === 'coin' && bodyB.label !== 'ultrasonic')
            {
                World.remove(this._engine.world, bodyA);
                this.removedCoins.push(bodyA);

                if(this.removedCoins.length === this.coins.length) isLastCoin = true;
            }
            else if(bodyB.label === 'coin' && bodyA.label !== 'ultrasonic')
            {
                World.remove(this._engine.world, bodyB);
                this.removedCoins.push(bodyB);
                if(this.removedCoins.length === this.coins.length) isLastCoin = true;

            }

            if(isLastCoin && this.OnAllCoinsCollectedEvent)
            {
                console.log("empty");

                this.OnAllCoinsCollectedEvent(this);
            }

        });

    }
    private updateUltrasonicSensor()
    {

        const sensorStartingPoint = getTranformedPoint(this.robot.position, 0, 15, -10);
        const startingAngle = this.robot.angle - 5*Math.PI/12;
        this.ultrasonicSensorDistance = findMinimumDistanceToObstacle(sensorStartingPoint, startingAngle, TwoWheelRobot.maxUltrasonicDistance, this.obstacles);
        if(this.ultrasonicSensorDistance > TwoWheelRobot.maxUltrasonicDistance)
            this.ultrasonicSensorDistance = TwoWheelRobot.maxUltrasonicDistance;

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

        const leftForcePosition = getTranformedPoint(this.robotBody.position, this.robot.angle, 0, -20);
        const rightForcePosition = getTranformedPoint(this.robotBody.position, this.robot.angle, 0, 20);

        let leftWheelForce = Vector.create(TwoWheelRobot.forceMultiplier*Math.abs(this.leftWheelSpeed), 0);
        leftWheelForce = Vector.rotate(leftWheelForce, this.robot.angle);
        if(this.leftWheelSpeed < 0)
            leftWheelForce = Vector.neg(leftWheelForce);

        let rightWheelForce = Vector.create(TwoWheelRobot.forceMultiplier*Math.abs(this.rightWheelSpeed), 0);
        rightWheelForce = Vector.rotate(rightWheelForce, this.robot.angle);
        if(this.rightWheelSpeed < 0)
            rightWheelForce = Vector.neg(rightWheelForce);
/*
          if( Math.floor(Math.random() * 10) == 0) {

              const circle = Bodies.circle(leftForcePosition.x, leftForcePosition.y, 3,{isSensor: true});
              const circle2 = Bodies.circle(leftForcePosition.x + leftWheelForce.x*100000, leftForcePosition.y + leftWheelForce.y*100000, 3, {isSensor:true});

              World.add(this._engine.world, circle);
                World.add(this._engine.world, circle2);

              const circle3 = Bodies.circle(rightForcePosition.x, rightForcePosition.y, 3,{isSensor: true});
              const circle4 = Bodies.circle(rightForcePosition.x + rightWheelForce.x*100000, rightForcePosition.y + rightWheelForce.y*100000, 3, {isSensor:true});

              World.add(this._engine.world, circle3);
              World.add(this._engine.world, circle4);

              console.log("right", this.rightWheelSpeed, rightForcePosition, rightWheelForce);
              console.log("left",this.leftWheelSpeed, leftForcePosition, leftWheelForce);

            }

*/
        Body.applyForce(this.robot, leftForcePosition, leftWheelForce);
        Body.applyForce(this.robot, rightForcePosition, rightWheelForce);

    }

    setRobotPosition(position : Vector) : void
    {
        Body.setPosition(this.robot, position);
    }

    setRobotInitialPosition(position : Vector) : void
    {

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
        for(const coin of this.removedCoins)
        {
            World.addBody(this._engine.world, coin);
        }
        this.removedCoins = [];

        this.tick(10);
        this.updateUltrasonicSensor();

    }
}
