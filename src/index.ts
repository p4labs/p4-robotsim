import * as _matterenvironments from './enviroment';
import * as _arduinoenvironments from './ArduinoRobot';

export namespace Robots{
  
  export import SimulationEnviroment = _matterenvironments.SimulationEnviroment;

  export namespace Matter {
    export import TwoWheelRobot = _matterenvironments.TwoWheelRobotEnv;
    
  }
  export namespace Arduino {
    export import TwoServoRobot = _arduinoenvironments.TwoServoRobot;
  }

}