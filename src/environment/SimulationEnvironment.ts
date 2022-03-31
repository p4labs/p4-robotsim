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

import { TwoWheelRobotEnv } from "./TwoWheelRobotEnv";

type event = (env : SimulationEnvironment) => any;

export class SimulationEnvironment {

    private _engine : Engine;
    private _canvas : any;
    private _render : Render;
    private _runner : Runner;
    private robotEnv : TwoWheelRobotEnv;

    obstacles : Array<Body>;
    coins : Array<Body>;
    removedCoins : Array<Body> = [];

    OnAllCoinsCollectedEvent : event = null;

    background : string;
    coinImagePath: string;



    constructor(robot:any, canvas:any, background = "imgs/room-background.jpg", coinImagePath: string = "imgs/coin.png") {
        this.obstacles = [];
        this.coins = [];
        this.robotEnv = robot.environment;
        this.robotEnv.setSimulation(this);

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

        World.add(this._engine.world, [this.robotEnv.robot, ]);//obstacle]);


        Render.run(this._render);
        this.reset();

        let self = this;

        Events.on(this._render, 'afterRender', function() {
            self.robotEnv.render(self._render);
        });

        //add collision events to calculate obstacle distance
        Events.on(this._engine, 'collisionActive',function(event) {self.onCollision(event);}) //;

    }

    addObstacleRectangle(posX : number, posY : number, width : number, height : number, angle = 0, color = "grey" ) : void {
        const obstacle = Bodies.rectangle(posX, posY, width, height, { isStatic: true, label: 'obstacle', render: {fillStyle : color} });
        Body.rotate( obstacle, angle)
        this.obstacles.push(obstacle);
        World.add(this._engine.world, [obstacle]);
    }
    addCoin(posX : number, posY : number){
        const coin = Bodies.circle(posX, posY, 15, {isSensor: true, label: 'coin'});

        this.coins.push(coin);
        coin.render.sprite.texture = this.coinImagePath;
        World.add(this._engine.world, [coin]);

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


    render(){

    }

    run() {
        Runner.run(this._engine);
    }

    tick(period : number) {
        Engine.update(this._engine, period);
    }

    reset()
    {

        for(const coin of this.removedCoins)
        {
            World.addBody(this._engine.world, coin);
        }
        this.removedCoins = [];

        this.robotEnv.reset();


    }
}
