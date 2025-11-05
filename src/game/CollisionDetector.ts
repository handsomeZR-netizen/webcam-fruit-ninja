/**
 * 碰撞检测系统
 * 需求: 1.4, 3.1, 4.2
 */

import { GameObject, Bounds } from './GameObject';
import { HandPosition } from '../gesture/GestureTracker';
import { GameConfig } from '../core/GameConfig';

/**
 * 点接口
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * 线段接口
 */
export interface Line {
  start: Point;
  end: Point;
}

/**
 * 碰撞检测器接口
 */
export interface ICollisionDetector {
  checkSliceCollision(handTrail: HandPosition[], gameObjects: GameObject[]): GameObject[];
  lineIntersectsRect(line: Line, rect: Bounds): boolean;
}

/**
 * 碰撞检测器实现
 * 需求: 1.4 - WHEN 手部轨迹与水果对象相交时，THE 游戏引擎 SHALL 触发切割动作并播放切割效果
 * 需求: 3.1 - WHEN 切割动作成功切割水果对象时，THE 游戏系统 SHALL 增加玩家分数 10 分
 * 需求: 4.2 - WHEN 切割动作触碰到炸弹对象时，THE 游戏系统 SHALL 立即结束游戏会话
 */
export class CollisionDetector implements ICollisionDetector {
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(config: GameConfig) {
    this.canvasWidth = config.canvasWidth;
    this.canvasHeight = config.canvasHeight;
  }

  /**
   * 检测手部轨迹与游戏对象的碰撞
   * 需求: 1.4 - 实现手部轨迹与游戏对象的碰撞检测
   * 需求: 7.1 - 性能优化：优化碰撞检测算法
   * 
   * @param handTrail 手部移动轨迹（归一化坐标 0-1）
   * @param gameObjects 游戏对象数组
   * @returns 被切割的游戏对象数组
   */
  checkSliceCollision(handTrail: HandPosition[], gameObjects: GameObject[]): GameObject[] {
    // 如果轨迹点少于2个，无法形成线段
    if (handTrail.length < 2) {
      return [];
    }

    const slicedObjects: GameObject[] = [];
    const checkedObjects = new Set<string>();

    // 性能优化：计算轨迹的边界框，用于快速剔除
    const trailBounds = this.calculateTrailBounds(handTrail);

    // 遍历手部轨迹，检查每个线段
    for (let i = 0; i < handTrail.length - 1; i++) {
      const start = handTrail[i];
      const end = handTrail[i + 1];

      // 将归一化坐标转换为画布坐标
      const line: Line = {
        start: {
          x: start.x * this.canvasWidth,
          y: start.y * this.canvasHeight
        },
        end: {
          x: end.x * this.canvasWidth,
          y: end.y * this.canvasHeight
        }
      };

      // 检查与每个游戏对象的碰撞
      for (const obj of gameObjects) {
        // 跳过已死亡的对象
        if (!obj.isAlive) {
          continue;
        }

        // 避免重复检测同一对象
        if (checkedObjects.has(obj.id)) {
          continue;
        }

        // 获取对象边界
        const bounds = obj.getBounds();

        // 性能优化：快速边界框检查
        if (!this.boundsIntersect(trailBounds, bounds)) {
          continue;
        }

        // 检测线段与矩形相交
        if (this.lineIntersectsRect(line, bounds)) {
          slicedObjects.push(obj);
          checkedObjects.add(obj.id);
        }
      }
    }

    return slicedObjects;
  }

  /**
   * 计算轨迹的边界框（性能优化）
   * 需求: 7.1 - 优化碰撞检测算法
   * @param handTrail 手部轨迹
   * @returns 边界框
   */
  private calculateTrailBounds(handTrail: HandPosition[]): Bounds {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const point of handTrail) {
      const x = point.x * this.canvasWidth;
      const y = point.y * this.canvasHeight;
      
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * 检查两个边界框是否相交（性能优化）
   * 需求: 7.1 - 优化碰撞检测算法
   * @param bounds1 边界框1
   * @param bounds2 边界框2
   * @returns 是否相交
   */
  private boundsIntersect(bounds1: Bounds, bounds2: Bounds): boolean {
    return !(
      bounds1.x + bounds1.width < bounds2.x ||
      bounds2.x + bounds2.width < bounds1.x ||
      bounds1.y + bounds1.height < bounds2.y ||
      bounds2.y + bounds2.height < bounds1.y
    );
  }

  /**
   * 线段与矩形相交检测
   * 需求: 1.4 - 编写线段与矩形相交算法
   * 
   * 使用 Liang-Barsky 算法的简化版本
   * 检查线段是否与矩形的任意边相交，或线段端点是否在矩形内
   * 
   * @param line 线段
   * @param rect 矩形边界
   * @returns 是否相交
   */
  lineIntersectsRect(line: Line, rect: Bounds): boolean {
    // 1. 快速边界检查：如果线段完全在矩形外部，则不相交
    const lineMinX = Math.min(line.start.x, line.end.x);
    const lineMaxX = Math.max(line.start.x, line.end.x);
    const lineMinY = Math.min(line.start.y, line.end.y);
    const lineMaxY = Math.max(line.start.y, line.end.y);

    const rectRight = rect.x + rect.width;
    const rectBottom = rect.y + rect.height;

    // 如果线段的边界框与矩形的边界框不相交，则不可能相交
    if (lineMaxX < rect.x || lineMinX > rectRight ||
        lineMaxY < rect.y || lineMinY > rectBottom) {
      return false;
    }

    // 2. 检查线段端点是否在矩形内
    if (this.pointInRect(line.start, rect) || this.pointInRect(line.end, rect)) {
      return true;
    }

    // 3. 检查线段是否与矩形的四条边相交
    const rectLines: Line[] = [
      // 上边
      { start: { x: rect.x, y: rect.y }, end: { x: rectRight, y: rect.y } },
      // 右边
      { start: { x: rectRight, y: rect.y }, end: { x: rectRight, y: rectBottom } },
      // 下边
      { start: { x: rectRight, y: rectBottom }, end: { x: rect.x, y: rectBottom } },
      // 左边
      { start: { x: rect.x, y: rectBottom }, end: { x: rect.x, y: rect.y } }
    ];

    for (const rectLine of rectLines) {
      if (this.lineIntersectsLine(line, rectLine)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 检查点是否在矩形内
   * 
   * @param point 点
   * @param rect 矩形
   * @returns 是否在矩形内
   */
  private pointInRect(point: Point, rect: Bounds): boolean {
    return point.x >= rect.x &&
           point.x <= rect.x + rect.width &&
           point.y >= rect.y &&
           point.y <= rect.y + rect.height;
  }

  /**
   * 检查两条线段是否相交
   * 使用向量叉积方法
   * 
   * @param line1 线段1
   * @param line2 线段2
   * @returns 是否相交
   */
  private lineIntersectsLine(line1: Line, line2: Line): boolean {
    const p1 = line1.start;
    const p2 = line1.end;
    const p3 = line2.start;
    const p4 = line2.end;

    // 计算方向向量
    const d1x = p2.x - p1.x;
    const d1y = p2.y - p1.y;
    const d2x = p4.x - p3.x;
    const d2y = p4.y - p3.y;

    // 计算叉积
    const cross = d1x * d2y - d1y * d2x;

    // 如果叉积为0，线段平行或共线
    if (Math.abs(cross) < 1e-10) {
      return false;
    }

    // 计算参数 t 和 u
    const dx = p3.x - p1.x;
    const dy = p3.y - p1.y;

    const t = (dx * d2y - dy * d2x) / cross;
    const u = (dx * d1y - dy * d1x) / cross;

    // 如果 t 和 u 都在 [0, 1] 范围内，则线段相交
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  }

  /**
   * 更新配置（用于动态调整画布尺寸）
   * 
   * @param config 新的游戏配置
   */
  updateConfig(config: GameConfig): void {
    this.canvasWidth = config.canvasWidth;
    this.canvasHeight = config.canvasHeight;
  }

  /**
   * 空间分区优化（可选）
   * 将游戏对象按空间位置分组，减少碰撞检测次数
   * 
   * 注：当前实现使用简单的边界检查优化，如果对象数量增加，
   * 可以考虑实现四叉树或网格分区
   */
  // TODO: 实现空间分区优化（如果性能需要）
}
