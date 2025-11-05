/**
 * 特殊水果效果管理器
 * 需求: 2.3, 2.4
 */

import { SpecialFruitType } from './SpecialFruit.js';

/**
 * 特殊水果效果接口
 */
export interface SpecialFruitEffect {
  type: SpecialFruitType;
  duration: number;      // 效果持续时间（毫秒）
  startTime: number;     // 效果开始时间
  isActive: boolean;
}

/**
 * 特殊水果效果管理器
 * 管理冰冻和狂暴效果的激活、持续和过期
 */
export class SpecialFruitEffectManager {
  private activeEffects: Map<SpecialFruitType, SpecialFruitEffect>;

  constructor() {
    this.activeEffects = new Map();
  }

  /**
   * 激活特殊效果
   * 需求: 2.3 - WHEN 玩家切割冰冻水果时，THE 游戏系统 SHALL 将所有水果的移动速度降低50%持续3秒
   * 需求: 2.4 - WHEN 玩家切割狂暴水果时，THE 游戏系统 SHALL 在接下来的5秒内增加水果生成频率
   * @param type 特殊水果类型
   * @param duration 效果持续时间（毫秒）
   */
  activateEffect(type: SpecialFruitType, duration: number): void {
    // 黄金水果不需要持续效果，只在切割时生效
    if (type === SpecialFruitType.GOLDEN) {
      return;
    }

    const currentTime = Date.now();
    
    // 如果效果已经激活，延长持续时间
    if (this.activeEffects.has(type)) {
      const existingEffect = this.activeEffects.get(type)!;
      existingEffect.duration = duration;
      existingEffect.startTime = currentTime;
    } else {
      // 创建新效果
      const effect: SpecialFruitEffect = {
        type,
        duration,
        startTime: currentTime,
        isActive: true
      };
      this.activeEffects.set(type, effect);
    }
  }

  /**
   * 更新效果状态和检查过期
   * @param currentTime 当前时间戳
   */
  update(currentTime: number): void {
    // 检查所有激活的效果是否过期
    for (const [type, effect] of this.activeEffects.entries()) {
      if (effect.isActive) {
        const elapsed = currentTime - effect.startTime;
        if (elapsed >= effect.duration) {
          // 效果过期，标记为非激活
          effect.isActive = false;
          this.activeEffects.delete(type);
        }
      }
    }
  }

  /**
   * 检查效果是否激活
   * @param type 特殊水果类型
   * @returns 效果是否激活
   */
  isEffectActive(type: SpecialFruitType): boolean {
    const effect = this.activeEffects.get(type);
    return effect ? effect.isActive : false;
  }

  /**
   * 获取效果剩余时间
   * @param type 特殊水果类型
   * @returns 剩余时间（毫秒），如果效果未激活则返回 0
   */
  getRemainingTime(type: SpecialFruitType): number {
    const effect = this.activeEffects.get(type);
    if (!effect || !effect.isActive) {
      return 0;
    }

    const currentTime = Date.now();
    const elapsed = currentTime - effect.startTime;
    const remaining = effect.duration - elapsed;
    
    return Math.max(0, remaining);
  }

  /**
   * 获取所有激活的效果
   * @returns 激活的效果数组
   */
  getActiveEffects(): SpecialFruitEffect[] {
    return Array.from(this.activeEffects.values()).filter(effect => effect.isActive);
  }

  /**
   * 重置所有效果
   */
  reset(): void {
    this.activeEffects.clear();
  }

  /**
   * 获取冰冻效果的速度倍率
   * 需求: 2.3 - 冰冻效果降低速度 50%
   * @returns 速度倍率（0.5 表示降低 50%）
   */
  getFrozenSpeedMultiplier(): number {
    return this.isEffectActive(SpecialFruitType.FROZEN) ? 0.5 : 1.0;
  }

  /**
   * 获取狂暴效果的生成频率倍率
   * 需求: 2.4 - 狂暴效果增加生成频率 100%
   * @returns 生成频率倍率（2.0 表示增加 100%）
   */
  getFrenzySpawnMultiplier(): number {
    return this.isEffectActive(SpecialFruitType.FRENZY) ? 2.0 : 1.0;
  }
}
