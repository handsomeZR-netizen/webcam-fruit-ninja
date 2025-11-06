/**
 * 成就追踪系统
 * 需求: 5.1, 5.2, 5.3, 5.5
 */

import { Achievement, ACHIEVEMENTS, PlayerStats } from './AchievementDefinitions.js';

/**
 * 本地存储数据格式
 */
interface AchievementStorageData {
  stats: PlayerStats;
  achievements: {
    [key: string]: {
      unlocked: boolean;
      unlockedAt?: number;
    };
  };
}

/**
 * 成就追踪器类
 * 需求: 5.1, 5.2, 5.3, 5.5
 */
export class AchievementTracker {
  private stats: PlayerStats;
  private achievements: Map<string, Achievement>;
  private newlyUnlocked: Achievement[];
  private storageKey: string = 'fruitNinja_achievements';
  
  // 当前游戏会话的临时统计
  private currentGameFruitsSliced: number = 0;
  private currentGameBombsHit: number = 0;
  private currentGameMissedFruits: number = 0;
  private currentGameStartTime: number = 0;
  private twentySlicesStartTime: number = 0;
  private twentySlicesCount: number = 0;

  constructor() {
    // 初始化统计数据
    this.stats = {
      totalFruitsSliced: 0,
      totalBombsHit: 0,
      maxCombo: 0,
      totalPlayTime: 0,
      gamesPlayed: 0,
      perfectGames: 0,
      fastestTwentySlices: 0
    };

    // 初始化成就
    this.achievements = new Map();
    ACHIEVEMENTS.forEach(achievement => {
      this.achievements.set(achievement.id, { ...achievement });
    });

    this.newlyUnlocked = [];

    // 从本地存储加载数据
    this.load();
  }

  /**
   * 记录水果切割
   * 需求: 5.1 - 追踪总切割水果数
   */
  recordFruitSliced(): void {
    this.stats.totalFruitsSliced++;
    this.currentGameFruitsSliced++;
    
    // 追踪 20 个水果的最快时间
    this.twentySlicesCount++;
    if (this.twentySlicesCount === 1) {
      this.twentySlicesStartTime = Date.now();
    } else if (this.twentySlicesCount === 20) {
      const timeElapsed = Date.now() - this.twentySlicesStartTime;
      if (this.stats.fastestTwentySlices === 0 || timeElapsed < this.stats.fastestTwentySlices) {
        this.stats.fastestTwentySlices = timeElapsed;
      }
      // 重置计数器
      this.twentySlicesCount = 0;
    }
  }

  /**
   * 记录炸弹切割
   * 需求: 5.1 - 追踪总切割炸弹数
   */
  recordBombHit(): void {
    this.stats.totalBombsHit++;
    this.currentGameBombsHit++;
  }

  /**
   * 更新最高连击数
   * 需求: 5.1 - 追踪最高连击数
   */
  updateMaxCombo(combo: number): void {
    if (combo > this.stats.maxCombo) {
      this.stats.maxCombo = combo;
    }
  }

  /**
   * 更新游戏时长
   * 需求: 5.1 - 追踪总游戏时长
   */
  updatePlayTime(deltaTime: number): void {
    this.stats.totalPlayTime += deltaTime;
  }

  /**
   * 记录游戏开始
   * 需求: 5.2 - 追踪游戏局数
   */
  recordGameStart(): void {
    this.stats.gamesPlayed++;
    this.currentGameFruitsSliced = 0;
    this.currentGameBombsHit = 0;
    this.currentGameMissedFruits = 0;
    this.currentGameStartTime = Date.now();
    this.twentySlicesCount = 0;
  }

  /**
   * 记录水果错过
   */
  recordFruitMissed(): void {
    this.currentGameMissedFruits++;
  }

  /**
   * 记录完美游戏
   * 需求: 5.3 - 完美主义者成就
   */
  recordPerfectGame(): void {
    this.stats.perfectGames++;
  }

  /**
   * 检查当前游戏是否完美（游戏结束时调用）
   */
  checkAndRecordPerfectGame(): void {
    // 完美游戏：至少切割了一些水果，没有切炸弹，没有错过水果
    if (this.currentGameFruitsSliced > 0 && 
        this.currentGameBombsHit === 0 && 
        this.currentGameMissedFruits === 0) {
      this.recordPerfectGame();
    }
  }

  /**
   * 更新最快 20 切时间
   * 需求: 5.3 - 速度之王成就
   */
  updateFastestTwentySlices(time: number): void {
    if (this.stats.fastestTwentySlices === 0 || time < this.stats.fastestTwentySlices) {
      this.stats.fastestTwentySlices = time;
    }
  }

  /**
   * 检查成就解锁
   * 需求: 5.2 - 达成特定里程碑时解锁成就
   * @returns 新解锁的成就列表
   */
  checkAchievements(): Achievement[] {
    this.newlyUnlocked = [];

    this.achievements.forEach(achievement => {
      // 跳过已解锁的成就
      if (achievement.unlocked) {
        return;
      }

      // 检查解锁条件
      if (achievement.condition(this.stats)) {
        achievement.unlocked = true;
        achievement.unlockedAt = Date.now();
        this.newlyUnlocked.push(achievement);
      }
    });

    // 如果有新解锁的成就，保存数据
    if (this.newlyUnlocked.length > 0) {
      this.save();
    }

    return this.newlyUnlocked;
  }

  /**
   * 获取所有成就
   */
  getAllAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  /**
   * 获取已解锁的成就
   */
  getUnlockedAchievements(): Achievement[] {
    return Array.from(this.achievements.values()).filter(a => a.unlocked);
  }

  /**
   * 获取未解锁的成就
   */
  getLockedAchievements(): Achievement[] {
    return Array.from(this.achievements.values()).filter(a => !a.unlocked);
  }

  /**
   * 获取统计数据
   * 需求: 5.1 - 追踪统计数据
   */
  getStats(): PlayerStats {
    return { ...this.stats };
  }

  /**
   * 获取成就解锁进度
   */
  getProgress(): { unlocked: number; total: number; percentage: number } {
    const total = this.achievements.size;
    const unlocked = this.getUnlockedAchievements().length;
    const percentage = total > 0 ? (unlocked / total) * 100 : 0;
    
    return { unlocked, total, percentage };
  }

  /**
   * 保存到本地存储
   * 需求: 5.5 - 将成就数据保存到浏览器本地存储
   */
  save(): void {
    try {
      const data: AchievementStorageData = {
        stats: this.stats,
        achievements: {}
      };

      // 保存成就解锁状态
      this.achievements.forEach((achievement, id) => {
        data.achievements[id] = {
          unlocked: achievement.unlocked,
          unlockedAt: achievement.unlockedAt
        };
      });

      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save achievements:', error);
    }
  }

  /**
   * 从本地存储加载
   * 需求: 5.5 - 从浏览器本地存储加载成就数据
   */
  load(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (!saved) {
        return;
      }

      const data: AchievementStorageData = JSON.parse(saved);

      // 验证并加载统计数据
      this.stats = this.validatePlayerStats(data.stats);

      // 加载成就解锁状态
      if (data.achievements) {
        Object.keys(data.achievements).forEach(id => {
          const achievement = this.achievements.get(id);
          if (achievement) {
            achievement.unlocked = data.achievements[id].unlocked;
            achievement.unlockedAt = data.achievements[id].unlockedAt;
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load achievements:', error);
    }
  }

  /**
   * 验证玩家统计数据
   * 需求: 5.5 - 数据验证逻辑
   */
  private validatePlayerStats(data: any): PlayerStats {
    return {
      totalFruitsSliced: typeof data?.totalFruitsSliced === 'number' ? data.totalFruitsSliced : 0,
      totalBombsHit: typeof data?.totalBombsHit === 'number' ? data.totalBombsHit : 0,
      maxCombo: typeof data?.maxCombo === 'number' ? data.maxCombo : 0,
      totalPlayTime: typeof data?.totalPlayTime === 'number' ? data.totalPlayTime : 0,
      gamesPlayed: typeof data?.gamesPlayed === 'number' ? data.gamesPlayed : 0,
      perfectGames: typeof data?.perfectGames === 'number' ? data.perfectGames : 0,
      fastestTwentySlices: typeof data?.fastestTwentySlices === 'number' ? data.fastestTwentySlices : 0
    };
  }

  /**
   * 重置所有数据（用于测试）
   */
  reset(): void {
    this.stats = {
      totalFruitsSliced: 0,
      totalBombsHit: 0,
      maxCombo: 0,
      totalPlayTime: 0,
      gamesPlayed: 0,
      perfectGames: 0,
      fastestTwentySlices: 0
    };

    this.achievements.forEach(achievement => {
      achievement.unlocked = false;
      achievement.unlockedAt = undefined;
    });

    this.newlyUnlocked = [];
    this.currentGameFruitsSliced = 0;
    this.currentGameBombsHit = 0;
    this.currentGameMissedFruits = 0;
    this.currentGameStartTime = 0;
    this.twentySlicesCount = 0;

    // 清除本地存储
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Failed to clear achievements from storage:', error);
    }
  }

  /**
   * 获取当前游戏会话统计
   */
  getCurrentGameStats(): {
    fruitsSliced: number;
    bombsHit: number;
    missedFruits: number;
    playTime: number;
  } {
    return {
      fruitsSliced: this.currentGameFruitsSliced,
      bombsHit: this.currentGameBombsHit,
      missedFruits: this.currentGameMissedFruits,
      playTime: this.currentGameStartTime > 0 ? Date.now() - this.currentGameStartTime : 0
    };
  }
}
