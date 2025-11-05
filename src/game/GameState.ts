/**
 * 游戏状态管理类
 * 需求: 3.1, 3.2, 3.3, 3.4
 */

import { GameObject } from './GameObject.js';
import { GameConfig } from '../core/GameConfig.js';
import { ParticleEffect } from './ParticleEffect.js';
import { ComboSystem } from './ComboSystem.js';
import { SpecialFruitEffectManager } from './SpecialFruitEffectManager.js';

/**
 * 游戏状态类
 * 管理分数、生命值和游戏对象
 */
export class GameState {
  score: number;
  lives: number;
  highScore: number;
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  gameObjects: GameObject[];
  particleEffects: ParticleEffect[];
  comboSystem: ComboSystem;
  specialFruitEffectManager: SpecialFruitEffectManager;
  private config: GameConfig;
  private objectIdCounter: number;

  constructor(config: GameConfig) {
    this.config = config;
    this.score = 0;
    this.lives = config.initialLives;
    this.highScore = this.loadHighScore();
    this.isPlaying = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.gameObjects = [];
    this.particleEffects = [];
    this.objectIdCounter = 0;
    
    // 初始化连击系统
    this.comboSystem = new ComboSystem();
    
    // 初始化特殊水果效果管理器
    this.specialFruitEffectManager = new SpecialFruitEffectManager();
  }

  /**
   * 添加游戏对象
   * @param obj 游戏对象
   */
  addGameObject(obj: GameObject): void {
    this.gameObjects.push(obj);
  }

  /**
   * 移除游戏对象
   * @param id 对象ID
   */
  removeGameObject(id: string): void {
    const index = this.gameObjects.findIndex(obj => obj.id === id);
    if (index !== -1) {
      this.gameObjects.splice(index, 1);
    }
  }

  /**
   * 移除所有死亡的对象
   * @returns 被移除的对象数组
   */
  removeDeadObjects(): GameObject[] {
    const deadObjects = this.gameObjects.filter(obj => !obj.isAlive);
    this.gameObjects = this.gameObjects.filter(obj => obj.isAlive);
    return deadObjects;
  }

  /**
   * 获取所有活着的游戏对象
   */
  getAliveObjects(): GameObject[] {
    return this.gameObjects.filter(obj => obj.isAlive);
  }

  /**
   * 增加分数
   * 需求: 3.1 - 切割水果增加分数
   * @param points 分数
   */
  addScore(points: number): void {
    this.score += points;
    
    // 更新最高分
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore(this.highScore);
    }
  }

  /**
   * 减少生命值
   * 需求: 3.2 - 水果未被切割减少生命值
   */
  loseLife(): void {
    if (this.lives > 0) {
      this.lives--;
    }
    
    // 检查游戏是否结束
    this.checkGameOver();
  }

  /**
   * 检查游戏是否结束
   * 需求: 3.4 - 生命值为0时结束游戏
   */
  private checkGameOver(): void {
    if (this.lives <= 0) {
      this.endGame();
    }
  }

  /**
   * 结束游戏
   * 需求: 3.4 - 游戏结束判定
   */
  endGame(): void {
    this.isPlaying = false;
    this.isGameOver = true;
  }

  /**
   * 开始游戏
   */
  startGame(): void {
    this.isPlaying = true;
    this.isPaused = false;
    this.isGameOver = false;
  }

  /**
   * 暂停游戏
   */
  pauseGame(): void {
    if (this.isPlaying) {
      this.isPaused = true;
    }
  }

  /**
   * 恢复游戏
   */
  resumeGame(): void {
    if (this.isPlaying && this.isPaused) {
      this.isPaused = false;
    }
  }

  /**
   * 重置游戏状态
   * 需求: 3.4 - 游戏状态重置
   */
  reset(): void {
    this.score = 0;
    this.lives = this.config.initialLives;
    this.isPlaying = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.gameObjects = [];
    this.particleEffects = [];
    this.objectIdCounter = 0;
    
    // 重置连击系统
    this.comboSystem.reset();
    
    // 重置特殊水果效果管理器
    this.specialFruitEffectManager.reset();
  }

  /**
   * 生成唯一对象ID
   */
  generateObjectId(): string {
    return `obj_${this.objectIdCounter++}`;
  }

  /**
   * 获取游戏对象数量
   */
  getObjectCount(): number {
    return this.gameObjects.length;
  }

  /**
   * 获取水果数量
   */
  getFruitCount(): number {
    return this.gameObjects.filter(obj => obj.type === 'fruit').length;
  }

  /**
   * 获取炸弹数量
   */
  getBombCount(): number {
    return this.gameObjects.filter(obj => obj.type === 'bomb').length;
  }

  /**
   * 清空所有游戏对象
   */
  clearAllObjects(): void {
    this.gameObjects = [];
  }

  /**
   * 添加粒子效果
   * 需求: 7.1 - 性能优化：限制粒子效果数量
   * @param effect 粒子效果
   */
  addParticleEffect(effect: ParticleEffect): void {
    // 性能优化：限制最大粒子效果数量
    const maxParticleEffects = 20;
    
    if (this.particleEffects.length >= maxParticleEffects) {
      // 移除最老的粒子效果
      this.particleEffects.shift();
    }
    
    this.particleEffects.push(effect);
  }

  /**
   * 移除死亡的粒子效果
   */
  removeDeadParticles(): void {
    this.particleEffects = this.particleEffects.filter(effect => effect.isAlive);
  }

  /**
   * 获取所有活着的粒子效果
   */
  getAliveParticles(): ParticleEffect[] {
    return this.particleEffects.filter(effect => effect.isAlive);
  }

  /**
   * 从本地存储加载最高分
   */
  private loadHighScore(): number {
    try {
      const saved = localStorage.getItem('fruitNinja_highScore');
      return saved ? parseInt(saved, 10) : 0;
    } catch (error) {
      console.warn('Failed to load high score:', error);
      return 0;
    }
  }

  /**
   * 保存最高分到本地存储
   */
  private saveHighScore(score: number): void {
    try {
      localStorage.setItem('fruitNinja_highScore', score.toString());
    } catch (error) {
      console.warn('Failed to save high score:', error);
    }
  }

  /**
   * 获取游戏统计信息
   */
  getStats(): {
    score: number;
    lives: number;
    highScore: number;
    objectCount: number;
    fruitCount: number;
    bombCount: number;
  } {
    return {
      score: this.score,
      lives: this.lives,
      highScore: this.highScore,
      objectCount: this.getObjectCount(),
      fruitCount: this.getFruitCount(),
      bombCount: this.getBombCount()
    };
  }
}
