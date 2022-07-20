import P5 from "p5";

export const STEP_SIZE = 1;

export function normalVec(p5: P5, vec: P5.Vector): P5.Vector {
  if (vec.y === 0) return p5.createVector(0, 1);
  if (vec.x === 0) return p5.createVector(1, 0);
  const normal = p5.createVector(1, 0);
  normal.y = -vec.x / vec.y;
  if (vec.y > 0) normal.mult(-1);
  return normal.normalize();
}

function drawArrow(p5: P5, base: P5.Vector, vec: P5.Vector, myColor = "green") {
  if (vec.mag() === 0) return;
  p5.push();
  p5.stroke(myColor);
  p5.strokeWeight(3);
  p5.fill(myColor);
  p5.translate(base.x, base.y);
  p5.line(0, 0, vec.x, vec.y);
  p5.rotate(vec.heading());
  let arrowSize = 7;
  p5.translate(vec.mag() - arrowSize, 0);
  p5.triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
  p5.pop();
}

export class Point {
  public pos: P5.Vector;
  public speed: P5.Vector;
  public sticks: Set<Stick> = new Set();
  private p5: P5;
  private size: number;

  constructor(p5: P5, atPosition: P5.Vector, size: number = 5) {
    this.p5 = p5;
    this.pos = atPosition;
    this.size = size;
    this.speed = this.p5.createVector(0, 0);
  }

  /**
   * Move time by given amount of steps
   */
  tick(steps: number = 1) {
    for (let i = 0; i < steps; i++) this.pos.add(this.speed.mult(STEP_SIZE));
    // notify parents
    this.sticks.forEach((s) => {
      const fixedPoint = s.point1 === this ? s.point2 : this;
      s.update();
    });
  }

  draw() {
    const p5 = this.p5; // just for convenience
    p5.push();
    p5.translate(this.pos);
    p5.noStroke();
    p5.fill("orange");
    p5.ellipse(0, 0, this.size);
    p5.pop();
  }
}

export class Stick {
  private p5: P5;
  public point1: Point;
  public point2: Point;
  private distance: number;
  public name = "";

  constructor(
    p5: P5,
    posA: P5.Vector | Point,
    posB: P5.Vector | Point,
    name?: string
  ) {
    this.p5 = p5;
    this.point1 = posA instanceof Point ? posA : new Point(p5, posA, 5);
    this.point1.sticks.add(this);
    this.point2 = posB instanceof Point ? posB : new Point(p5, posB, 5);
    this.point2.sticks.add(this);
    this.distance = this.point1.pos.dist(this.point2.pos);
    this.name = name;
  }

  /**
   * Checks the distance between two points and updates their
   * position along their axes to match the original distance
   */
  update(fixedPoint?: Point) {
    if (!fixedPoint) {
      const dist = this.point1.pos.dist(this.point2.pos);
      const delta = this.distance - dist;
      const deltaVec = P5.Vector.sub(this.point1.pos, this.point2.pos);
      deltaVec.normalize();
      deltaVec.mult(delta / 2);
      this.point1.pos.add(deltaVec);
      this.point2.pos.sub(deltaVec);
    } else {
      const movablePoint =
        this.point1 === fixedPoint ? this.point2 : this.point1;
      const dist = this.point1.pos.dist(this.point2.pos);
      const delta = this.distance - dist;
      const deltaVec = P5.Vector.sub(fixedPoint.pos, movablePoint.pos);
      deltaVec.normalize();
      deltaVec.mult(delta);
      movablePoint.pos.sub(deltaVec);
    }
  }

  getDirection(): P5.Vector {
    return P5.Vector.sub(this.point2.pos, this.point1.pos).normalize();
  }

  getMidPoint(): P5.Vector {
    return P5.Vector.add(
      this.point1.pos,
      P5.Vector.sub(this.point2.pos, this.point1.pos)
        .normalize()
        .mult(this.distance / 2)
    );
  }

  draw(drawName = true, drawDirection = true) {
    // draw the two points
    this.point1.draw();
    this.point2.draw();
    // draw the line in between
    this.p5.push();
    this.p5.fill("grey");
    this.p5.line(
      this.point1.pos.x,
      this.point1.pos.y,
      this.point2.pos.x,
      this.point2.pos.y
    );
    const midPoint = this.getMidPoint();
    if (this.name && drawName) {
      this.p5.text(this.name, midPoint.x, midPoint.y);
    }
    if (drawDirection) {
      drawArrow(this.p5, midPoint, this.getDirection().mult(30), "blue");
    }
    this.p5.pop();
  }
}

export class Car {
  /**
   * Motor Layout
         S0
        _____
    [0]-| ^ |-[1]
        | | |
    S1->|   |<-S3
    [2]-|   |-[3]
        ‾‾‾‾‾
         S2
  */

  motorSpeeds = [0, 0, 0, 0];
  motors: Point[] = new Array(4);
  private bodyLines: Stick[] = new Array(5);
  private p5;

  constructor(p5: P5) {
    this.p5 = p5;
    // create 4 motors
    for (let i = 0; i < 4; i++)
      this.motors[i] = new Point(
        p5,
        p5.createVector(300 + 150 * (i % 2), 350 + (i < 2 ? 0 : 150))
      );

    // create the body
    this.bodyLines[0] = new Stick(p5, this.motors[0], this.motors[1], "S0");
    this.bodyLines[1] = new Stick(p5, this.motors[0], this.motors[2], "S1");
    this.bodyLines[2] = new Stick(p5, this.motors[2], this.motors[3], "S2");
    this.bodyLines[3] = new Stick(p5, this.motors[3], this.motors[1], "S3");
    this.bodyLines[4] = new Stick(p5, this.motors[0], this.motors[3], "S4");
  }

  setMotorSpeed(
    m0: number = 0,
    m1: number = 0,
    m2: number = 0,
    m3: number = 0
  ) {
    this.motorSpeeds = [m0, m1, m2, m3];
    let normal = this.bodyLines[1].getDirection();
    this.motors[0].speed = P5.Vector.mult(normal, m0);
    this.motors[1].speed = P5.Vector.mult(normal, m1);
    normal = this.bodyLines[1].getDirection();
    this.motors[2].speed = P5.Vector.mult(normal, m2);
    this.motors[3].speed = P5.Vector.mult(normal, m3);
  }

  setCarSpeed(throttle: number, steering: number) {
    this.setMotorSpeed(
      throttle - steering,
      throttle + steering,
      throttle - steering,
      throttle + steering
    );
  }

  tick(steps = 1) {
    this.setMotorSpeed(...this.motorSpeeds);
    this.motors.forEach((m) => m.tick(steps));
  }

  draw(speedVec = false) {
    this.motors.forEach((m) => {
      m.draw();
      if (speedVec && m.speed)
        drawArrow(this.p5, m.pos, P5.Vector.mult(m.speed, 10), "red");
    });
    this.bodyLines.forEach((l) => l.draw());
  }
}
