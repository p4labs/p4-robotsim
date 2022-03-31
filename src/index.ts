import * as _matterenvironments from './environment';
import * as _arduinoenvironments from './ArduinoRobot';

export namespace Robots{

  export import SimulationEnvironment = _matterenvironments.SimulationEnviroment;

  export namespace Matter {
    export import TwoWheelRobot = _matterenvironments.TwoWheelRobotEnv;

  }
  export namespace Arduino {
    export import TwoServoRobot = _arduinoenvironments.TwoServoRobot;
  }

}
