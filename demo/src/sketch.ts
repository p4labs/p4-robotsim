export const MOVE_CODE = `#include <Servo.h>
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
  Serial.print("Left: ");
  Serial.print(leftDistance);
  Serial.print(", Front: ");
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
  leftservo.write(170);
  rightservo.write(10);
  
}
void moveAwayFromTheLeftWall(){
  leftservo.write(160);
  rightservo.write(160);

  delay(600);

 leftservo.write(160);
  rightservo.write(20);
  delay(500);

 leftservo.write(20);
  rightservo.write(20);

  delay(600);
  leftservo.write(90);
  rightservo.write(90);
}

void moveCloserToTheLeftWall(){
    leftservo.write(20);
  rightservo.write(20);

  delay(600);

 leftservo.write(160);
  rightservo.write(20);
  delay(500);

 leftservo.write(160);
  rightservo.write(160);

  delay(600);
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