/**
 * 对象池管理器
 * 需求: 2.1, 4.1
 * 
 * 对象池用于复用游戏对象，减少频繁创建和销毁对象带来的性能开销
 */

import { Fruit, FruitType } from './Fruit.js';
import { Bomb } from './Bomb.js';
import { GameObject, Vector2D } from './GameObject.js';
import { SpecialFruit, SpecialFruitType } from './SpecialFruit.js';

/**
 * 对象池类
 */
export class ObjectPool {
  private fruitPool: Fruit[] = [];
  private bombPool: Bomb[] = [];
  private specialFruitPool: SpecialFruit[] = [];
  private nextId: number = 0;
  private fruitTypes: FruitType[];

  constructor(fruitTypes: FruitType[] = ['watermelon', 'apple', 'orange', 'banana', 'strawberry']) {
    this.fruitTypes = fruitTypes;
  }

  /**
   * 预加载对象到池中
   * @param fruitCount 预加载的水果数量
   * @param bombCount 预加载的炸弹数量
   * @param specialFruitCount 预加载的特殊水果数量
   */
  preload(fruitCount: number, bombCount: number, specialFruitCount: number = 5): void {
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

    // 预加载特殊水果
    for (let i = 0; i < specialFruitCount; i++) {
      const specialFruit = this.createNewSpecialFruit(SpecialFruitType.GOLDEN);
      specialFruit.isAlive = false; // 标记为未激活
      this.specialFruitPool.push(specialFruit);
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
   * 从池中获取特殊水果对象
   * @param specialType 特殊水果类型
   * @param fruitType 水果类型（可选，随机选择）
   * @returns 特殊水果对象
   */
  getSpecialFruit(specialType: SpecialFruitType, fruitType?: FruitType): SpecialFruit {
    // 尝试从池中获取未使用的特殊水果
    let specialFruit = this.specialFruitPool.find(f => !f.isAlive);

    if (specialFruit) {
      // 重置特殊水果状态
      this.resetSpecialFruit(specialFruit, specialType, fruitType);
    } else {
      // 池中没有可用对象，创建新的
      specialFruit = this.createNewSpecialFruit(specialType, fruitType);
    }

    return specialFruit;
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
    if (obj.type === 'fruit') {
      if (obj instanceof SpecialFruit) {
        // 特殊水果
        if (!this.specialFruitPool.includes(obj)) {
          this.specialFruitPool.push(obj);
        }
      } else if (obj instanceof Fruit) {
        // 普通水果
        if (!this.fruitPool.includes(obj)) {
          this.fruitPool.push(obj);
        }
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
   * 创建新的特殊水果对象
   */
  private createNewSpecialFruit(specialType: SpecialFruitType, type?: FruitType): SpecialFruit {
    const fruitType = type || this.getRandomFruitType();
    const id = this.generateId();
    const position: Vector2D = { x: 0, y: 0 };
    const velocity: Vector2D = { x: 0, y: 0 };
    
    const specialFruit = new SpecialFruit(id, fruitType, specialType, position, velocity);
    this.specialFruitPool.push(specialFruit);
    return specialFruit;
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
   * 重置特殊水果状态
   */
  private resetSpecialFruit(specialFruit: SpecialFruit, specialType: SpecialFruitType, type?: FruitType): void {
    // 重新分配ID
    specialFruit.id = this.generateId();
    
    // 重置类型
    if (type) {
      specialFruit.fruitType = type;
    } else {
      specialFruit.fruitType = this.getRandomFruitType();
    }

    // 重置特殊类型
    specialFruit.specialType = specialType;
    specialFruit.specialColor = specialType === SpecialFruitType.GOLDEN ? '#FFD700' :
                                 specialType === SpecialFruitType.FROZEN ? '#00BFFF' : '#FF4500';
    specialFruit.color = specialFruit.specialColor;

    // 重置基础属性
    specialFruit.position = { x: 0, y: 0 };
    specialFruit.velocity = { x: 0, y: 0 };
    specialFruit.rotation = 0;
    specialFruit.rotationSpeed = (Math.random() - 0.5) * 5;
    specialFruit.scale = 1;
    specialFruit.isAlive = true;

    // 重置水果特有属性
    specialFruit.isSliced = false;
    specialFruit.sliceAngle = 0;
    specialFruit.sliceOffset = { x: 0, y: 0 };
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
    specialFruitTotal: number;
    specialFruitActive: number;
    specialFruitAvailable: number;
  } {
    const fruitActive = this.fruitPool.filter(f => f.isAlive).length;
    const bombActive = this.bombPool.filter(b => b.isAlive).length;
    const specialFruitActive = this.specialFruitPool.filter(f => f.isAlive).length;

    return {
      fruitTotal: this.fruitPool.length,
      fruitActive,
      fruitAvailable: this.fruitPool.length - fruitActive,
      bombTotal: this.bombPool.length,
      bombActive,
      bombAvailable: this.bombPool.length - bombActive,
      specialFruitTotal: this.specialFruitPool.length,
      specialFruitActive,
      specialFruitAvailable: this.specialFruitPool.length - specialFruitActive
    };
  }

  /**
   * 清空对象池
   */
  clear(): void {
    this.fruitPool = [];
    this.bombPool = [];
    this.specialFruitPool = [];
    this.nextId = 0;
  }
}
