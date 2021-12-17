import { buildHex } from './compile';
import './index.css';
import { EditorHistoryUtil } from './utils/editor-history.util';
import {Robots} from "../../src";
console.log("hello")
let editor: any; // eslint-disable-line @typescript-eslint/no-explicit-any
const MOVE_CODE = `#include <Servo.h>
Servo leftservo;  
Servo rightservo;  

void setup() {
  Serial.begin(9600);
  leftservo.attach(9);  
  rightservo.attach(10); 
  //move forward fast
  leftservo.write(90);
  rightservo.write(90);

  delay(500);
  leftservo.write(180);
  rightservo.write(0);
  delay(1000);
 
}
void loop() {
  float leftDistance = getDistance(2,3);
  float frontDistance = getDistance(4,5);
  Serial.println(leftDistance);
  Serial.println(frontDistance);
  if(frontDistance < 50)
  {
      stop();
      return;
  }
  if(leftDistance < 180)
    moveAwayFromTheLeftWall();
  else if(leftDistance > 220)
    moveCloserToTheLeftWall();
  else
    moveForward();

  delay(10);
}
void stop(){
  leftservo.write(90);
  rightservo.write(90);
}
void moveForward(){
  leftservo.write(140);
  rightservo.write(40);
  delay(50);
  leftservo.write(90);
  rightservo.write(90);
}
void moveAwayFromTheLeftWall(){
  leftservo.write(160);
  rightservo.write(160);

  delay(200);

 leftservo.write(160);
  rightservo.write(20);
  delay(300);

 leftservo.write(20);
  rightservo.write(20);

  delay(200);
  leftservo.write(90);
  rightservo.write(90);
}

void moveCloserToTheLeftWall(){
    leftservo.write(20);
  rightservo.write(20);

  delay(433);

 leftservo.write(160);
  rightservo.write(20);
  delay(100);

 leftservo.write(160);
  rightservo.write(160);

  delay(433);
  leftservo.write(90);
  rightservo.write(90);
}

int getDistance(int trigger, int echo){
  long duration;  
  //clear the ping pin
  digitalWrite(trigger, LOW);
  delayMicroseconds(2);
  //send the 10 microsecond trigger
  digitalWrite(trigger, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigger, LOW);
  //get the pulse duration in microseconds
  duration = pulseIn(echo, HIGH);
  return duration/ 29 / 2;
}`;

// Load Editor
declare const window: any; // eslint-disable-line @typescript-eslint/no-explicit-any
declare const monaco: any; // eslint-disable-line @typescript-eslint/no-explicit-any
window.require.config({
    paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.21.2/min/vs' },
});
window.require(['vs/editor/editor.main'], () => {
    editor = monaco.editor.create(document.querySelector('.code-editor'), {
        value: EditorHistoryUtil.getValue() || MOVE_CODE,
        language: 'cpp',
        minimap: { enabled: false },
    });
});


// Set up toolbar


/* eslint-disable @typescript-eslint/no-use-before-define */
const runButton = document.querySelector('#run-button');
runButton.addEventListener('click', compileAndRun);
const stopButton = document.querySelector('#stop-button');
stopButton.addEventListener('click', stopCode);
const statusLabel = document.querySelector('#status-label');
const compilerOutputText = document.querySelector('#compiler-output-text');
const serialOutputText = document.querySelector('#serial-output-text');

const robot = initiateRobot();


function initiateRobot(){

//set up robot environment
    const canvas = document.getElementById('world');

    const robot = new Robots.Arduino.TwoServoRobot(canvas)
    robot.addUltrasonicSensor('L2', 2,3);
    robot.addUltrasonicSensor('F2', 4,5);
    robot.environment.setRobotInitialPosition({x:50, y: 100});
    robot.environment?.addObstacleRectangle(400, 50, 800, 20, "grey");
    robot.environment?.addObstacleRectangle(700, 200, 20, 800, "grey");

    robot.environment?.addCoin(150,100);
    robot.environment?.addCoin(300, 100);

    robot.environment.OnAllCoinsCollectedEvent = (env) => {
        env.removedCoins = [];
        env.coins = [];
        env.addCoin(400, 200);
        env.addCoin(500,500);
    }
    robot.arduino.simulationTimeCallback = (time)=>{
        statusLabel.textContent = `Simulation time: ${time}`;
    }
    robot.arduino.serialOutputCallback = (value)=>{
        serialOutputText.textContent += value;
    }

    return robot;
}

function executeProgram(hex: string) {
    robot.run(hex);
}

async function compileAndRun() {


    storeUserSnippet();
    runButton.setAttribute('disabled', '1');
    serialOutputText.textContent = '';

    try {
        statusLabel.textContent = 'Compiling...';
        const result = await buildHex(editor.getModel().getValue());
        // @ts-ignore
        compilerOutputText.textContent = result.stderr || result.stdout;
        // @ts-ignore
        if (result.hex) {
            compilerOutputText.textContent += '\nProgram running...';
            stopButton.removeAttribute('disabled');
            // @ts-ignore
            executeProgram(result.hex);
        } else {
            runButton.removeAttribute('disabled');
        }
    } catch (err) {
        runButton.removeAttribute('disabled');
        alert('Failed: ' + err);
    } finally {
        statusLabel.textContent = '';
    }


}

function storeUserSnippet() {
    EditorHistoryUtil.clearSnippet();
    EditorHistoryUtil.storeSnippet(editor.getValue());
}

function stopCode() {

    stopButton.setAttribute('disabled', '1');
    runButton.removeAttribute('disabled');

    if (robot) {
        robot.stop();
    }
}


