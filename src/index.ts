import  * as _matterenvironments from './robots';
import * as _arduinoenvironments from './ArduinoRobotEnvironment';

export namespace Robots{
    export namespace Matter {
    export import TwoWheelRobot = _matterenvironments.TwoWheelRobot;
  }


    export namespace Arduino {
    export import TwoServoRobot = _arduinoenvironments.TwoServoRobot;
  }

}