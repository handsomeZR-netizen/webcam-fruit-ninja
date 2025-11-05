/**
 * 游戏对象基类
 * 需求: 2.4, 4.4
 */

export interface Vector2D {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 游戏对象抽象基类
 */
export abstract class GameObject {
  id: string;
  type: 'fruit' | 'bomb';
  position: Vector2D;
  velocity: Vector2D;
  rotation: number;
  rotationSpeed: number;
  scale: number;
  isAlive: boolean;

  constructor(
    id: string,
    type: 'fruit' | 'bomb',
    position: Vector2D,
    velocity: Vector2D,
    rotation: number = 0,
    scale: number = 1
  ) {
    this.id = id;
    this.type = type;
    this.position = { ...position };
    this.velocity = { ...velocity };
    this.rotation = rotation;
    this.rotationSpeed = (Math.random() - 0.5) * 5; // 随机旋转速度
    this.scale = scale;
    this.isAlive = true;
  }

  /**
   * 更新对象状态
   * @param deltaTime 时间增量（秒）
   */
  abstract update(deltaTime: number): void;

  /**
   * 渲染对象
   * @param ctx Canvas 渲染上下文
   */
  abstract render(ctx: CanvasRenderingContext2D): void;

  /**
   * 获取碰撞边界
   */
  abstract getBounds(): Bounds;

  /**
   * 被切割时调用
   * 需求: 7.1 - 性能优化：根据帧率动态调整粒子质量
   * @param qualityMultiplier 粒子质量乘数（0.5-1.0）
   */
  abstract onSliced(qualityMultiplier?: number): void;

  /**
   * 销毁对象
   */
  destroy(): void {
    this.isAlive = false;
  }

  /**
   * 基础物理更新（位置和旋转）
   * @param deltaTime 时间增量（秒）
   */
  protected updatePhysics(deltaTime: number): void {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.rotation += this.rotationSpeed * deltaTime;
  }
}
