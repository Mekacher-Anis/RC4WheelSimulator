import P5 from "p5";
import "./styles.scss";

import { Car } from "./Elements";

let car: Car;
let throttle = 0;
let steering = 0;
const MAX_FWD_SPEED = 5;
const MAX_ROT_SPEED = 5;
let leftRightRepeat: number = null;
let upDownRepeat: number = null;

const sketch = (p5: P5) => {
  p5.setup = () => {
    const canvas = p5.createCanvas(800, 1000);
    canvas.parent("app");
    p5.background("white");
    car = new Car(p5);
    // car.setSpeed(2, -1, 3, -1);
  };

  p5.keyPressed = () => {
    if (
      !leftRightRepeat &&
      (p5.keyCode === p5.LEFT_ARROW || p5.keyCode === p5.RIGHT_ARROW)
    ) {
      leftRightRepeat = setInterval(() => {
        if (p5.keyCode === p5.LEFT_ARROW) steering--;
        else if (p5.keyCode === p5.RIGHT_ARROW) steering++;
        steering = p5.constrain(steering, -MAX_ROT_SPEED, MAX_ROT_SPEED);
      }, 100);
    } else if (
      !upDownRepeat &&
      (p5.keyCode === p5.UP_ARROW || p5.keyCode === p5.DOWN_ARROW)
    ) {
      upDownRepeat = setInterval(() => {
        if (p5.keyCode === p5.UP_ARROW) throttle++;
        else if (p5.keyCode === p5.DOWN_ARROW) throttle--;
        throttle = p5.constrain(throttle, -MAX_FWD_SPEED, MAX_FWD_SPEED);
      });
    }
  };

  p5.keyReleased = () => {
    // console.log("key released", p5.LEFT_ARROW, p5.keyCode)
    if (p5.keyCode === p5.LEFT_ARROW || p5.keyCode === p5.RIGHT_ARROW) {
      clearInterval(leftRightRepeat);
      leftRightRepeat = null;
      steering = 0;
    } else if (p5.keyCode === p5.UP_ARROW || p5.keyCode === p5.DOWN_ARROW) {
      clearInterval(upDownRepeat);
      upDownRepeat = null;
      throttle = 0;
    }
  };

  p5.draw = () => {
    p5.background("white");
    car.draw(true);
    car.setCarSpeed(throttle, steering);
    car.tick();
  };
};

new P5(sketch);
