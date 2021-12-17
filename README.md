# p4-robotsim

Arduino robot simulation built with Matterjs and AVR8js. Right now only 2WD Servo motor robot is supported. 

## How does it work?
The simulation is adding a rigid body for the robot in free fall with no gravity! The movement of the robot happens by applying forces from the wheel position and in the direction of the robot.
The amount of force is relative to the width of the last pulse outputted from the Uno to the servos. 

Every 50ms the forces are applied depending on the width of the last pulse (if you think this is not accurate based on how servos work please start an issue and let us know!). 

## The physics of the robot
There are a few parameters that can be optimized.

### Mass of the robot 
The mass of the robot is set to a large number. If a small number is used the simulation can become unstable.

In `TwoWheelRobot.ts` you can adjust `robotMass`. 

### Air Friction
You need to think of the robot as being in free fall with no gravity and you are looking at a side view. That is perpendicular to the perspective of the robot which is a 2D top view simulation. But the physics is generated from a side view 2D physics engine. 
The higher the air friction the more resistance there is for the robot to move. This variable determines the friction of the "ground". 

In `TwoWheelRobot.ts` you can adjust `robotFrictionAir`.

### Force Multiplier
The force being applied to the wheels have the force value of `(width of pulse - 1.4)*multiplier`.
At angle 90 the pulse width will be 1.4. Which results in 0 force being applied. 

In `TwoWheelRobot.ts` you can adjust `forceMultiplier`
## Robot Dimensions
The robot has dimensions of 30cmx20cm (maybe not accurate?).

## Ultrasonic Sensors
There are 12 positions you can add an ultrasonic sensor. 3 positions on each side
```typescript
'L1'| 'L2' | 'L3' | 'F1' | 'F2' | 'F3' | 'R1' | 'R2' | 'R3' | 'B1' | 'B2'| 'B3';
```
The positions of the ultrasonic sensors relative to the robot where 0,0 is the center of the robot are:
```typescript
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
```
## How to use the library?
To learn more about how to use and run AVR8 simulation please check [avr8js](https://github.com/wokwi/avr8js).

To create a robot simulation first add a `canvas` to your html with an id:

```html
<canvas id="world"></canvas>
```

in ts (or js)
```typescript
import {Robots} from "../../src";   //importing Robots from p4-robotsim

const canvas = document.getElementById('world');    //get the canvas from html 

const robot = new Robots.Arduino.TwoServoRobot(canvas)  //create a new Two Servo Robot

robot.addUltrasonicSensor('L2', 2,3); //adding sensor on the center of the left side. pins 2 and 3
robot.addUltrasonicSensor('F2', 4,5); //adding sensor front center using pins 4 and 5
robot.environment.setRobotInitialPosition({x:50, y: 100});
robot.environment?.addObstacleRectangle(400, 50, 800, 20, "grey"); //adding obstacles 
robot.environment?.addObstacleRectangle(700, 200, 20, 800, "grey"); //adding obstacles 

robot.environment?.addCoin(150,100); //coins are not obstacles! 
robot.environment?.addCoin(300, 100); //they just disappear when the robot gets in contact with coins

robot.run(hex); //hex is a compiled arduino program

robot.stop(); //stops the simulation 
```

To access the uno board simulation from the robot:

```typescript
robot.arduino //object of ArduinoUno class
```

You can also use the events in the ArduinoUno:

```typescript
robot.arduino.simulationTimeCallback = (time)=>{
    //get the time from the simulation and update your UI
}
robot.arduino.serialOutputCallback = (value)=>{
    //get the new serial output value and update your UI
}
```

To access the Matterjs robot environment from the robot:
```typescript
robot.environment   //object of TwoWheelRobot
```

## Demo project

Basic environment provided as a starter. Dawson College Engineering Robotics labs show what you can build. Work done as part of a grant-supported project can be found here: [englab](https://englab.dawsoncollege.qc.ca/robot/).

The demo project has 2 walls as obstacles, 2 ultrasonic sensors and 2 coins. 
It is also using Monaco Editor to write code. The code is compiled by making a request to a hosted API intended for educational purposes only. (thanks to [urish](https://github.com/urish) for sharing this).
## Running the demo project

To run the demo project, check out this repository, run `yarn install` and then `yarn start`.

### Modifying the Demo
In `demo/src/index.ts` you can modify the robot environment inside the `initiateRobot` function.

