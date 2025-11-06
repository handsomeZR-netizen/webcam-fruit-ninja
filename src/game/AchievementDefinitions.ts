/**
 * 成就定义
 * 需求: 5.1, 5.2, 5.3
 */

/**
 * 玩家统计数据接口
 * 需求: 5.1 - 追踪统计数据
 */
export interface PlayerStats {
  totalFruitsSliced: number;      // 总切割水果数
  totalBombsHit: number;          // 总切割炸弹数
  maxCombo: number;               // 最高连击数
  totalPlayTime: number;          // 总游戏时长（毫秒）
  gamesPlayed: number;            // 游戏局数
  perfectGames: number;           // 完美游戏次数（无失误）
  fastestTwentySlices: number;    // 切割 20 个水果的最快时间（毫秒）
}

/**
 * 成就接口
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (stats: PlayerStats) => boolean;
  unlocked: boolean;
  unlockedAt?: number; // 时间戳
}

/**
 * 成就定义列表
 * 需求: 5.3 - 支持至少五个成就
 */
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_slice',
    name: '首次切割',
    description: '切割你的第一个水果',
    icon: '🍉',
    condition: (stats: PlayerStats) => stats.totalFruitsSliced >= 1,
    unlocked: false
  },
  {
    id: 'combo_master',
    name: '连击大师',
    description: '达到 10 连击',
    icon: '⚡',
    condition: (stats: PlayerStats) => stats.maxCombo >= 10,
    unlocked: false
  },
  {
    id: 'fruit_killer',
    name: '水果杀手',
    description: '累计切割 100 个水果',
    icon: '🔪',
    condition: (stats: PlayerStats) => stats.totalFruitsSliced >= 100,
    unlocked: false
  },
  {
    id: 'perfectionist',
    name: '完美主义者',
    description: '完成一局游戏不失误（不错过水果，不切炸弹）',
    icon: '💎',
    condition: (stats: PlayerStats) => stats.perfectGames >= 1,
    unlocked: false
  },
  {
    id: 'speed_king',
    name: '速度之王',
    description: '在 30 秒内切割 20 个水果',
    icon: '👑',
    condition: (stats: PlayerStats) => 
      stats.fastestTwentySlices > 0 && stats.fastestTwentySlices <= 30000,
    unlocked: false
  }
];
