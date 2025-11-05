/**
 * 游戏对象生成器
 * 需求: 2.1, 4.1
 * 
 * 负责定时生成水果和炸弹对象
 */

import { ObjectPool } from './ObjectPool.js';
import { PhysicsSystem } from './PhysicsSystem.js';
import { GameObject } from './GameObject.js';
import { GameConfig } from '../core/GameConfig.js';
import { SpecialFruitType } from './SpecialFruit.js';

/**
 * 生成器事件回调接口
 */
export interface SpawnerCallbacks {
  onObjectSpawned?: (obj: GameObject) => void;
}

/**
 * 对象生成器类
 */
export class ObjectSpawner {
  private objectPool: ObjectPool;
  private physicsSystem: PhysicsSystem;
  private config: GameConfig;
  private callbacks: SpawnerCallbacks;
  
  private isActive: boolean;
  private nextSpawnTime: number;
  private timeSinceLastSpawn: number;
  
  // 教程模式相关
  private tutorialMode: boolean;
  private tutorialSpawnType: 'fruit' | 'bomb' | null;
  
  constructor(
    objectPool: ObjectPool,
    physicsSystem: PhysicsSystem,
    config: GameConfig,
    callbacks: SpawnerCallbacks = {}
  ) {
    this.objectPool = objectPool;
    this.physicsSystem = physicsSystem;
    this.config = config;
    this.callbacks = callbacks;
    
    this.isActive = false;
    this.nextSpawnTime = 0;
    this.timeSinceLastSpawn = 0;
    
    this.tutorialMode = false;
    this.tutorialSpawnType = null;
  }

  /**
   * 启动生成器
   */
  start(): void {
    this.isActive = true;
    this.timeSinceLastSpawn = 0;
    this.nextSpawnTime = this.getRandomSpawnInterval();
  }

  /**
   * 停止生成器
   */
  stop(): void {
    this.isActive = false;
  }

  /**
   * 更新生成器状态
   * @param deltaTime 时间增量（秒）
   * @returns 新生成的游戏对象数组
   */
  update(deltaTime: number): GameObject[] {
    if (!this.isActive) {
      return [];
    }

    const spawnedObjects: GameObject[] = [];
    
    // 累加时间
    this.timeSinceLastSpawn += deltaTime;

    // 检查是否到达生成时间
    if (this.timeSinceLastSpawn >= this.nextSpawnTime) {
      const obj = this.spawnObject();
      if (obj) {
        spawnedObjects.push(obj);
        
        // 触发回调
        if (this.callbacks.onObjectSpawned) {
          this.callbacks.onObjectSpawned(obj);
        }
      }

      // 重置计时器
      this.timeSinceLastSpawn = 0;
      this.nextSpawnTime = this.getRandomSpawnInterval();
    }

    return spawnedObjects;
  }

  /**
   * 生成一个游戏对象（水果或炸弹）
   * @returns 生成的游戏对象
   */
  private spawnObject(): GameObject {
    // 教程模式：根据指定类型生成
    if (this.tutorialMode && this.tutorialSpawnType) {
      if (this.tutorialSpawnType === 'bomb') {
        return this.spawnBomb();
      } else {
        return this.spawnFruit();
      }
    }
    
    // 正常模式：根据概率决定生成水果还是炸弹
    const shouldSpawnBomb = Math.random() < this.config.bombSpawnChance;
    
    if (shouldSpawnBomb) {
      return this.spawnBomb();
    } else {
      return this.spawnFruit();
    }
  }

  /**
   * 生成水果
   * 需求: 2.1, 2.6 - 以 5% 概率生成特殊水果
   * @returns 水果对象
   */
  private spawnFruit(): GameObject {
    // 检查是否生成特殊水果（5% 概率）
    const shouldSpawnSpecial = Math.random() < 0.05;
    
    let fruit: GameObject;
    
    if (shouldSpawnSpecial) {
      // 生成特殊水果（目前只有黄金水果）
      const specialTypes = [SpecialFruitType.GOLDEN];
      const randomType = specialTypes[Math.floor(Math.random() * specialTypes.length)];
      fruit = this.objectPool.getSpecialFruit(randomType);
    } else {
      // 生成普通水果
      fruit = this.objectPool.getFruit();
    }
    
    // 生成抛出参数
    const throwParams = this.physicsSystem.generateThrowParams();
    
    // 初始化水果位置和速度
    fruit.position.x = throwParams.startX;
    fruit.position.y = throwParams.startY;
    fruit.velocity.x = throwParams.velocityX;
    fruit.velocity.y = throwParams.velocityY;
    fruit.rotation = throwParams.rotation;
    fruit.rotationSpeed = (Math.random() - 0.5) * 5; // 随机旋转速度
    
    return fruit;
  }

  /**
   * 生成炸弹
   * @returns 炸弹对象
   */
  private spawnBomb(): GameObject {
    // 从对象池获取炸弹
    const bomb = this.objectPool.getBomb();
    
    // 生成抛出参数
    const throwParams = this.physicsSystem.generateThrowParams();
    
    // 初始化炸弹位置和速度
    bomb.position.x = throwParams.startX;
    bomb.position.y = throwParams.startY;
    bomb.velocity.x = throwParams.velocityX;
    bomb.velocity.y = throwParams.velocityY;
    bomb.rotation = throwParams.rotation;
    bomb.rotationSpeed = (Math.random() - 0.5) * 5; // 随机旋转速度
    
    return bomb;
  }

  /**
   * 获取随机生成间隔（秒）
   * @returns 生成间隔时间
   */
  private getRandomSpawnInterval(): number {
    const [minInterval, maxInterval] = this.config.fruitSpawnInterval;
    // 将毫秒转换为秒
    const minSeconds = minInterval / 1000;
    const maxSeconds = maxInterval / 1000;
    return minSeconds + Math.random() * (maxSeconds - minSeconds);
  }

  /**
   * 立即生成一个水果（用于测试或特殊场景）
   * @returns 生成的水果对象
   */
  spawnFruitNow(): GameObject {
    const fruit = this.spawnFruit();
    if (this.callbacks.onObjectSpawned) {
      this.callbacks.onObjectSpawned(fruit);
    }
    return fruit;
  }

  /**
   * 立即生成一个炸弹（用于测试或特殊场景）
   * @returns 生成的炸弹对象
   */
  spawnBombNow(): GameObject {
    const bomb = this.spawnBomb();
    if (this.callbacks.onObjectSpawned) {
      this.callbacks.onObjectSpawned(bomb);
    }
    return bomb;
  }

  /**
   * 检查生成器是否激活
   * @returns 是否激活
   */
  isSpawnerActive(): boolean {
    return this.isActive;
  }

  /**
   * 获取距离下次生成的剩余时间（秒）
   * @returns 剩余时间
   */
  getTimeUntilNextSpawn(): number {
    if (!this.isActive) {
      return 0;
    }
    return Math.max(0, this.nextSpawnTime - this.timeSinceLastSpawn);
  }

  /**
   * 重置生成器
   */
  reset(): void {
    this.timeSinceLastSpawn = 0;
    this.nextSpawnTime = this.getRandomSpawnInterval();
  }

  /**
   * 更新配置
   * @param config 新的游戏配置
   */
  updateConfig(config: GameConfig): void {
    this.config = config;
  }

  /**
   * 启用教程模式
   * 需求: 8.3 - 在教程模式下生成特定的水果和炸弹
   * @param spawnType 要生成的对象类型（'fruit' 或 'bomb'）
   */
  enableTutorialMode(spawnType: 'fruit' | 'bomb'): void {
    this.tutorialMode = true;
    this.tutorialSpawnType = spawnType;
  }

  /**
   * 禁用教程模式
   */
  disableTutorialMode(): void {
    this.tutorialMode = false;
    this.tutorialSpawnType = null;
  }

  /**
   * 检查是否处于教程模式
   */
  isTutorialMode(): boolean {
    return this.tutorialMode;
  }
}
