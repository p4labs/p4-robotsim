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
  leftservo.attach(9);  
  rightservo.attach(10); 
  //move forward fast
  leftservo.write(170);
  /*
    TASK: Get all the coins!
  */
  delay(3000);  //is this enough time to get all the coins?
  //stop moving
  leftservo.write(90);
  rightservo.write(90);
}
void loop() {
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

    robot.environment?.addObstacleRectangle(400, 50, 800, 20, "grey");
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


