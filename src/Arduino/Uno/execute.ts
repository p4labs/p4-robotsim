import {
  avrInstruction,
  AVRTimer,
  CPU,
  timer0Config,
  timer1Config,
  timer2Config,
  AVRIOPort,
  AVRUSART,
  portBConfig,
  portCConfig,
  portDConfig,
  usart0Config
} from 'avr8js';
import { loadHex } from './intelhex';

type Event = {
  period : number,  //milliseconds
  eventCall : any
}

// ATmega328p params
const FLASH = 0x8000;

export class AVRRunner {
  readonly program = new Uint16Array(FLASH);
  readonly cpu: CPU;
  readonly timer0: AVRTimer;
  readonly timer1: AVRTimer;
  readonly timer2: AVRTimer;
  readonly portB: AVRIOPort;
  readonly portC: AVRIOPort;
  readonly portD: AVRIOPort;
  readonly usart: AVRUSART;
  readonly speed = 16e6; // 16 MHZ
  readonly workUnitCycles = 500000;


  //events
  private cpuEvents : Event[] = [];
  private cpuEventsMicrosecond : Event[] = [];

  constructor(hex: string) {
    loadHex(hex, new Uint8Array(this.program.buffer));
    this.cpu = new CPU(this.program);
    this.timer0 = new AVRTimer(this.cpu, timer0Config);
    this.timer1 = new AVRTimer(this.cpu, timer1Config);
    this.timer2 = new AVRTimer(this.cpu, timer2Config);
    this.portB = new AVRIOPort(this.cpu, portBConfig);
    this.portC = new AVRIOPort(this.cpu, portCConfig);
    this.portD = new AVRIOPort(this.cpu, portDConfig);
    this.usart = new AVRUSART(this.cpu, usart0Config, this.speed);
  }

  private cpuTimeMS = 0;
  private cpuTimeMicroS = 0;

  private isStopped = false;

  // CPU main loop
  execute(callback: (cpu: CPU) => void) {
      if(this.isStopped)
          return;
    const cyclesToRun = this.cpu.cycles + this.workUnitCycles;
    while (this.cpu.cycles < cyclesToRun) {
      avrInstruction(this.cpu);
      this.cpu.tick();

        //this probably can be done more efficiently?
      if(Math.floor(this.cpu.cycles*1000/this.speed) !== this.cpuTimeMS)
      {
          this.cpuTimeMS = Math.floor(this.cpu.cycles*1000/this.speed);

          for(const event of this.cpuEvents)
          {

              if(Math.floor(this.cpu.cycles*1000/this.speed) % event.period === 0) //events by ms
              {
                  event.eventCall(this.cpu.cycles);

              }
          }
      }

      if(Math.floor(this.cpu.cycles*1000000/this.speed) !== this.cpuTimeMicroS)
      {
          this.cpuTimeMicroS = Math.floor(this.cpu.cycles*1000000/this.speed);


          for(const event of this.cpuEventsMicrosecond)
          {

              if(Math.floor(this.cpu.cycles*1000000/this.speed) % event.period === 0)
              {

                  event.eventCall(this.cpu.cycles);

              }
          }
      }

    }
      callback(this.cpu);
      requestAnimationFrame(() => this.execute(callback));

  }
  start(callback: (cpu: CPU) => void){
      this.isStopped = false;
      this.execute(callback);
  }
  stop() {
    //this.taskScheduler.stop();
      this.isStopped = true;
  }


  addCPUEvent(cpuEvent : Event)
  {
      this.cpuEvents.push(cpuEvent);
  }

  addCPUEventMicrosecond(cpuEvent : Event)
  {
      this.cpuEventsMicrosecond.push(cpuEvent);
  }
}
