/**
 * 对象池管理器
 * 需求: 2.1, 4.1
 * 
 * 对象池用于复用游戏对象，减少频繁创建和销毁对象带来的性能开销
 */

import { Fruit, FruitType } from './Fruit.js';
import { Bomb } from './Bomb.js';
import { GameObject, Vector2D } from './GameObject.js';

/**
 * 对象池类
 */
export class ObjectPool {
  private fruitPool: Fruit[] = [];
  private bombPool: Bomb[] = [];
  private nextId: number = 0;
  private fruitTypes: FruitType[];

  constructor(fruitTypes: FruitType[] = ['watermelon', 'apple', 'orange', 'banana', 'strawberry']) {
    this.fruitTypes = fruitTypes;
  }

  /**
   * 预加载对象到池中
   * @param fruitCount 预加载的水果数量
   * @param bombCount 预加载的炸弹数量
   */
  preload(fruitCount: number, bombCount: number): void {
    // 预加载水果
    for (let i = 0; i < fruitCount; i++) {
      const fruit = this.createNewFruit();
      fruit.isAlive = false; // 标记为未激活
      this.fruitPool.push(fruit);
    }

    // 预加载炸弹
    for (let i = 0; i < bombCount; i++) {
      const bomb = this.createNewBomb();
      bomb.isAlive = false; // 标记为未激活
      this.bombPool.push(bomb);
    }
  }

  /**
   * 从池中获取水果对象
   * @param type 水果类型（可选，随机选择）
   * @returns 水果对象
   */
  getFruit(type?: FruitType): Fruit {
    // 尝试从池中获取未使用的水果
    let fruit = this.fruitPool.find(f => !f.isAlive);

    if (fruit) {
      // 重置水果状态
      this.resetFruit(fruit, type);
    } else {
      // 池中没有可用对象，创建新的
      fruit = this.createNewFruit(type);
    }

    return fruit;
  }

  /**
   * 从池中获取炸弹对象
   * @returns 炸弹对象
   */
  getBomb(): Bomb {
    // 尝试从池中获取未使用的炸弹
    let bomb = this.bombPool.find(b => !b.isAlive);

    if (bomb) {
      // 重置炸弹状态
      this.resetBomb(bomb);
    } else {
      // 池中没有可用对象，创建新的
      bomb = this.createNewBomb();
    }

    return bomb;
  }

  /**
   * 回收对象到池中
   * @param obj 要回收的游戏对象
   */
  recycle(obj: GameObject): void {
    if (!obj.isAlive) {
      return; // 已经被回收
    }

    // 标记为未激活
    obj.isAlive = false;

    // 根据类型添加到对应的池中
    if (obj.type === 'fruit' && obj instanceof Fruit) {
      // 检查是否已在池中
      if (!this.fruitPool.includes(obj)) {
        this.fruitPool.push(obj);
      }
    } else if (obj.type === 'bomb' && obj instanceof Bomb) {
      // 检查是否已在池中
      if (!this.bombPool.includes(obj)) {
        this.bombPool.push(obj);
      }
    }
  }

  /**
   * 创建新的水果对象
   */
  private createNewFruit(type?: FruitType): Fruit {
    const fruitType = type || this.getRandomFruitType();
    const id = this.generateId();
    const position: Vector2D = { x: 0, y: 0 };
    const velocity: Vector2D = { x: 0, y: 0 };
    
    const fruit = new Fruit(id, fruitType, position, velocity);
    this.fruitPool.push(fruit);
    return fruit;
  }

  /**
   * 创建新的炸弹对象
   */
  private createNewBomb(): Bomb {
    const id = this.generateId();
    const position: Vector2D = { x: 0, y: 0 };
    const velocity: Vector2D = { x: 0, y: 0 };
    
    const bomb = new Bomb(id, position, velocity);
    this.bombPool.push(bomb);
    return bomb;
  }

  /**
   * 重置水果状态
   */
  private resetFruit(fruit: Fruit, type?: FruitType): void {
    // 重新分配ID
    fruit.id = this.generateId();
    
    // 重置类型（如果指定）
    if (type) {
      fruit.fruitType = type;
    } else {
      fruit.fruitType = this.getRandomFruitType();
    }

    // 重置基础属性
    fruit.position = { x: 0, y: 0 };
    fruit.velocity = { x: 0, y: 0 };
    fruit.rotation = 0;
    fruit.rotationSpeed = (Math.random() - 0.5) * 5;
    fruit.scale = 1;
    fruit.isAlive = true;

    // 重置水果特有属性
    fruit.isSliced = false;
    fruit.sliceAngle = 0;
    fruit.sliceOffset = { x: 0, y: 0 };
  }

  /**
   * 重置炸弹状态
   */
  private resetBomb(bomb: Bomb): void {
    // 重新分配ID
    bomb.id = this.generateId();

    // 重置基础属性
    bomb.position = { x: 0, y: 0 };
    bomb.velocity = { x: 0, y: 0 };
    bomb.rotation = 0;
    bomb.rotationSpeed = (Math.random() - 0.5) * 5;
    bomb.scale = 1;
    bomb.isAlive = true;

    // 重置炸弹特有属性
    bomb.isExploding = false;
    bomb.explosionProgress = 0;
  }

  /**
   * 获取随机水果类型
   */
  private getRandomFruitType(): FruitType {
    return this.fruitTypes[Math.floor(Math.random() * this.fruitTypes.length)];
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `obj_${this.nextId++}`;
  }

  /**
   * 获取池的统计信息
   */
  getPoolStats(): {
    fruitTotal: number;
    fruitActive: number;
    fruitAvailable: number;
    bombTotal: number;
    bombActive: number;
    bombAvailable: number;
  } {
    const fruitActive = this.fruitPool.filter(f => f.isAlive).length;
    const bombActive = this.bombPool.filter(b => b.isAlive).length;

    return {
      fruitTotal: this.fruitPool.length,
      fruitActive,
      fruitAvailable: this.fruitPool.length - fruitActive,
      bombTotal: this.bombPool.length,
      bombActive,
      bombAvailable: this.bombPool.length - bombActive
    };
  }

  /**
   * 清空对象池
   */
  clear(): void {
    this.fruitPool = [];
    this.bombPool = [];
    this.nextId = 0;
  }
}
