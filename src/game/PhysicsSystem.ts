/**
 * 物理系统 - 处理重力、速度更新和抛物线运动
 * 需求: 2.2, 2.3
 */

import { GameObject } from './GameObject.js';
import { GameConfig } from '../core/GameConfig.js';

/**
 * 抛出参数接口
 */
export interface ThrowParams {
  startX: number;      // 起始X坐标
  startY: number;      // 起始Y坐标
  velocityX: number;   // X方向速度
  velocityY: number;   // Y方向速度（向上为负）
  rotation: number;    // 初始旋转角度
}

/**
 * 物理系统类
 */
export class PhysicsSystem {
  private gravity: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private minThrowVelocity: number;
  private maxThrowVelocity: number;

  constructor(config: GameConfig) {
    this.gravity = config.gravity;
    this.canvasWidth = config.canvasWidth;
    this.canvasHeight = config.canvasHeight;
    this.minThrowVelocity = config.minThrowVelocity;
    this.maxThrowVelocity = config.maxThrowVelocity;
  }

  /**
   * 更新所有游戏对象的物理状态
   * @param gameObjects 游戏对象数组
   * @param deltaTime 时间增量（秒）
   */
  update(gameObjects: GameObject[], deltaTime: number): void {
    for (const obj of gameObjects) {
      if (!obj.isAlive) continue;

      // 应用重力（只影响Y方向速度）
      obj.velocity.y += this.gravity * deltaTime;

      // 对象自身的update方法会处理位置更新
      obj.update(deltaTime);
    }
  }

  /**
   * 检查对象是否超出边界
   * @param obj 游戏对象
   * @returns 是否超出边界
   */
  isOutOfBounds(obj: GameObject): boolean {
    const bounds = obj.getBounds();
    
    // 检查是否完全离开屏幕
    // 左侧或右侧超出
    if (bounds.x + bounds.width < 0 || bounds.x > this.canvasWidth) {
      return true;
    }
    
    // 底部超出（顶部不算，因为水果会飞出顶部再落下）
    if (bounds.y > this.canvasHeight + 100) {
      return true;
    }
    
    return false;
  }

  /**
   * 移除超出边界的对象
   * @param gameObjects 游戏对象数组
   * @returns 被移除的对象数组
   */
  removeOutOfBoundsObjects(gameObjects: GameObject[]): GameObject[] {
    const removedObjects: GameObject[] = [];
    
    for (const obj of gameObjects) {
      if (this.isOutOfBounds(obj)) {
        obj.destroy();
        removedObjects.push(obj);
      }
    }
    
    return removedObjects;
  }

  /**
   * 生成随机抛出参数
   * @returns 抛出参数
   */
  generateThrowParams(): ThrowParams {
    // 随机起始X位置（屏幕底部）
    const startX = Math.random() * this.canvasWidth;
    const startY = this.canvasHeight + 50; // 稍微在屏幕下方开始

    // 随机速度大小
    const velocityMagnitude = 
      this.minThrowVelocity + 
      Math.random() * (this.maxThrowVelocity - this.minThrowVelocity);

    // 计算抛出角度（60-120度，向上抛）
    const minAngle = Math.PI / 3;  // 60度
    const maxAngle = (2 * Math.PI) / 3;  // 120度
    const throwAngle = minAngle + Math.random() * (maxAngle - minAngle);

    // 根据起始位置调整角度，使水果更倾向于向屏幕中心抛
    let adjustedAngle = throwAngle;
    if (startX < this.canvasWidth * 0.3) {
      // 左侧，稍微向右倾斜
      adjustedAngle = throwAngle - Math.PI / 12; // 减少15度
    } else if (startX > this.canvasWidth * 0.7) {
      // 右侧，稍微向左倾斜
      adjustedAngle = throwAngle + Math.PI / 12; // 增加15度
    }

    // 计算速度分量
    const velocityX = Math.cos(adjustedAngle) * velocityMagnitude;
    const velocityY = -Math.sin(adjustedAngle) * velocityMagnitude; // 负值表示向上

    // 随机初始旋转
    const rotation = Math.random() * Math.PI * 2;

    return {
      startX,
      startY,
      velocityX,
      velocityY,
      rotation
    };
  }

  /**
   * 生成从特定侧面抛出的参数（用于更多样化的生成）
   * @param side 'left' | 'right' | 'center'
   * @returns 抛出参数
   */
  generateThrowParamsFromSide(side: 'left' | 'right' | 'center'): ThrowParams {
    let startX: number;
    let throwAngle: number;

    switch (side) {
      case 'left':
        // 从左侧抛出，向右上方
        startX = Math.random() * (this.canvasWidth * 0.2);
        throwAngle = Math.PI / 3 + Math.random() * (Math.PI / 6); // 60-90度
        break;
      
      case 'right':
        // 从右侧抛出，向左上方
        startX = this.canvasWidth * 0.8 + Math.random() * (this.canvasWidth * 0.2);
        throwAngle = (2 * Math.PI) / 3 + Math.random() * (Math.PI / 6); // 90-120度
        break;
      
      case 'center':
      default:
        // 从中间抛出，垂直向上
        startX = this.canvasWidth * 0.4 + Math.random() * (this.canvasWidth * 0.2);
        throwAngle = Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 6); // 75-105度
        break;
    }

    const startY = this.canvasHeight + 50;

    // 随机速度大小
    const velocityMagnitude = 
      this.minThrowVelocity + 
      Math.random() * (this.maxThrowVelocity - this.minThrowVelocity);

    // 计算速度分量
    const velocityX = Math.cos(throwAngle) * velocityMagnitude;
    const velocityY = -Math.sin(throwAngle) * velocityMagnitude;

    // 随机初始旋转
    const rotation = Math.random() * Math.PI * 2;

    return {
      startX,
      startY,
      velocityX,
      velocityY,
      rotation
    };
  }

  /**
   * 更新配置
   * @param config 新的游戏配置
   */
  updateConfig(config: GameConfig): void {
    this.gravity = config.gravity;
    this.canvasWidth = config.canvasWidth;
    this.canvasHeight = config.canvasHeight;
    this.minThrowVelocity = config.minThrowVelocity;
    this.maxThrowVelocity = config.maxThrowVelocity;
  }
}
