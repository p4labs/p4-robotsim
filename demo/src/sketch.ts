export const MOVE_CODE = `#include <Servo.h>
Servo leftservo;  
Servo rightservo;  
const int pingPin = 5; // Trigger Pin of Ultrasonic Sensor
const int echoPin = 6; // Echo Pin of Ultrasonic Sensor

const int distanceToCoints = 40;
void moveCloserToWall()
{
  leftservo.write(10);
  rightservo.write(10);
  delay(1000);
  leftservo.write(170);
  rightservo.write(10);
    delay(500);
  leftservo.write(170);
  rightservo.write(170);
  delay(1000);
  leftservo.write(90);
  rightservo.write(90);
}

void moveAwayFromWall()
{
  leftservo.write(170);
  rightservo.write(170);
  delay(1000);
  leftservo.write(170);
  rightservo.write(10);
    delay(500);
  leftservo.write(10);
  rightservo.write(10);
  delay(1000);
  leftservo.write(90);
  rightservo.write(90);
}

void setup() {
  leftservo.attach(9);  
  rightservo.attach(10);
   //set up the Serial
  Serial.begin(9600);
  //setupt the pin modes  
  pinMode(pingPin, OUTPUT);
  pinMode(echoPin, INPUT);
  leftservo.write(90);
  rightservo.write(90);


}

void loop() {
  long duration;  
  //clear the ping pin
  digitalWrite(pingPin, LOW);
  delayMicroseconds(2);
  //send the 10 microsecond trigger
  digitalWrite(pingPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(pingPin, LOW);
  //get the pulse duration in microseconds
  duration = pulseIn(echoPin, HIGH);
  float distance = (duration / 2.0) / 29.0;
  Serial.println(distance);
  if(distance > (distanceToCoints +15))
  {
    moveCloserToWall();
  }
  else if (distance < (distanceToCoints - 15))
  {
    moveAwayFromWall();
  }
  else{
    leftservo.write(170);
  rightservo.write(10);
  }


  delay(50);  
}
`;
