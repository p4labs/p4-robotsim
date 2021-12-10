# p4-robotsim

Arduino robot simulation built with Matterjs and AVR8js. Right now only 2WD Servo motor robot is supported. 

## How it works?
The simulation is adding a rigid body for the robot in free fall with no gravity! The movement of the robot happens by applying forces from the wheel position and in the direction of the robot.
The amount of force is relative to the width of the last pulse outputted from the Uno to the servos. 

Every 50ms the forces are applied depending on the width of the last pulse (if you think this is not accurate based on how servos work please start an issue and let us know!). 

## The physics of the robot
There are few parameters that can be optimized:

### Mass of the robot 
The mass of the robot is set to a large number. If a small number is used the simulation can be very unstable.

In `TwoWheelRobot.ts` you can adjust `robotMass`. 

### Air Friction
You have to think of the robot in free fall with no gravity and you are looking at a side view. That's totally not how the robot is, the robot is a 2D top view simulation. But the 2D physics is a side view 2D physics engine. 
The higher the air friction that more resistance there is for the robot to move around. This variable can determine "the friction of the ground". 

In `TwoWheelRobot.ts` you can adjust `robotFrictionAir`.

### Force Multiplier
The force being applied to the wheels have the force value of `(width of pulse - 1.4)*multiplier`.
At angle 90 the pulse width will be 1.4. Which results in 0 force being applied. 

In `TwoWheelRobot.ts` you can adjust `forceMultiplier`


## How to use the library?
To learn more about how to use and run AVR8 simulation please check [avr8js](https://github.com/wokwi/avr8js).

To create a robot simulation first add a `canvas` to your html with an id:

```html
<canvas id="world"></canvas>
```

in js or ts
```typescript
import {Robots} from "../../src";   //importing Robots from p4-robotsim

const canvas = document.getElementById('world');    //get the canvas from html 

const robot = new Robots.Arduino.TwoServoRobot(canvas)  //create a new Two Servo Robot

robot.environment?.addObstacleRectangle(400, 50, 800, 20, "grey");  //adding obstacles 
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

## Demo project

Basic environment provided as a starter. Dawson College Engineering Robotics labs show what you can build. Work done as part of a grant-supported project can be found here: [englab](https://englab.dawsoncollege.qc.ca/robot/).

## Running the demo project

To run the demo project, check out this repository, run `yarn install` and then `yarn start`.



