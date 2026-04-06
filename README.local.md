# ProBets Backend (Credit Wallet Agent Mode)

## 1) 准备数据库
1. 创建 MySQL 8 数据库并执行 `schema.mysql.sql`
2. 建议先手动插入 admin 用户（id=1）

## 2) 环境变量
复制 `.env.example` 为 `.env` 并修改数据库账号。

## 3) 运行
```bash
npm install
npm run start:dev
```
默认端口：3001

## 4) 核心接口
### 创建用户
POST /users
```json
{
  "username": "agent001",
  "passwordHash": "plain_or_hash_here",
  "role": "agent",
  "parentId": "1"
}
```

### 直属加分/抽分
POST /credit/adjust
```json
{
  "operatorId": "2",
  "targetUserId": "5",
  "amount": 1000,
  "action": "add",
  "remark": "initial credit"
}
```

### 体育/通用下注
POST /bets/place
```json
{
  "userId": "5",
  "betType": "sports",
  "amount": 500,
  "odds": 1.95
}
```

### Dice（Provably Fair）
先取当前 hash（投注前展示给玩家）
GET /bets/fairness/:userId/hash

下注：
POST /bets/dice/place
```json
{
  "userId": "5",
  "amount": 100,
  "target": 50,
  "isUnder": true,
  "clientSeed": "my-seed-001"
}
```

验证：
POST /bets/dice/verify
```json
{
  "serverSeed": "revealed_server_seed_hex",
  "clientSeed": "my-seed-001",
  "nonce": 0,
  "expectedRoll": 48.23
}
```

### Plinko（Provably Fair）
下注：
POST /bets/plinko/place
```json
{
  "userId": "5",
  "amount": 100,
  "rows": 12,
  "risk": "medium",
  "clientSeed": "my-seed-001"
}
```
返回包含：`path`、`slot`、`multiplier`、`payout`

验证：
POST /bets/plinko/verify
```json
{
  "serverSeed": "revealed_server_seed_hex",
  "clientSeed": "my-seed-001",
  "nonce": 1,
  "rows": 12,
  "risk": "medium",
  "expectedPath": [1,0,1,1,0,0,1,1,0,1,0,1],
  "expectedMultiplier": 1.5
}
```

### Baccarat（Provably Fair）
下注：
POST /bets/baccarat/place
```json
{
  "userId": "5",
  "amount": 100,
  "betOn": "banker",
  "clientSeed": "my-seed-001"
}
```
返回包含：`winner`、`playerScore`、`bankerScore`、`cards`、`multiplier`、`payout`

验证：
POST /bets/baccarat/verify
```json
{
  "serverSeed": "revealed_server_seed_hex",
  "clientSeed": "my-seed-001",
  "nonce": 2,
  "expectedPlayerScore": 7,
  "expectedBankerScore": 5,
  "expectedWinner": "player"
}
```

换种子（公开旧seed + 下发新hash）：
POST /bets/fairness/:userId/rotate-seed

### Sports Odds Feed & Bet Engine
拉体育项目：
GET /odds/sports

拉赔率：
GET /odds/markets?sport=soccer_epl&regions=eu&markets=h2h,spreads,totals

刷新并缓存赔率到 events 表：
POST /odds/refresh?sport=soccer_epl&regions=eu&markets=h2h,spreads,totals

Sports 下注（锁 odds 快照）：
POST /bets/sports/place
```json
{
  "userId": "5",
  "eventId": "event_xxx",
  "marketKey": "h2h",
  "selection": "Home",
  "stake": 100
}
```

> 自动结算任务每 30 秒跑一次（当前先实现 h2h 结算）。

### 结算（sports 等 pending 游戏）
POST /bets/settle
```json
{
  "betNo": "BET...",
  "result": "win",
  "payout": 975,
  "operatorId": "1"
}
```

## 5) 重要规则
- 只有直属上级可调整信用：`target.parentId === operator.id`
- 所有余额变动写入 `credit_transactions`
- 下注先扣，结算再加
- Dice / Plinko / Baccarat 已接 Provably Fair：`serverSeedHash + clientSeed + nonce` 可复算
- Seed 状态已持久化到 `fair_seed_states`（重启不丢）
- Sports Bet Engine：下注锁定 `odds + api_snapshot`，并支持 h2h/spreads/totals 自动结算
- 风控：单注上限、单用户单赛事单市场 exposure 上限、live 延迟拒单、赔率 margin 可调、bookmaker 白名单过滤
- 赔率选择策略：`SPORTS_ODDS_PICK=min|max`（min=更保守利润更稳，max=更友好给玩家）
- 风险查看：`GET /bets/risk/exposure?userId=xx[&eventId=...&marketKey=...]`
- Live Queue：开赛后下注可排队延迟复核，接口：`GET /bets/sports/queue?userId=xx[&status=pending|processing|executed|failed|dead|canceled]`
- 队列操作：`POST /bets/sports/queue/:queueId/retry`、`POST /bets/sports/queue/:queueId/cancel`
- 队列可靠性：支持 idempotency 合并（重复请求不重复入队）与 max attempts 自动 dead-letter
- 队列指标：`GET /bets/sports/queue/metrics?hours=24`（success/dead/failed rate、平均重试）
- 风险总览：`GET /bets/risk/overview?limit=50[&sportKey=...&marketKey=...]`（按 event+market 聚合 exposure 与 worst-case liability）
- 运营总览：`GET /bets/ops/dashboard?hours=24&limit=30[&sportKey=...&marketKey=...]`（queue metrics + risk overview + deadTop）
- 风险告警（日志）：`SPORTS_ALERT_DEAD_RATE`、`SPORTS_ALERT_LIABILITY`，每30秒巡检
- 自动降级：deadRate 超阈值时可自动暂停 live queue（`SPORTS_ALERT_AUTO_PAUSE_MINUTES`）
- 暂停控制：`GET /bets/ops/queue-pause`、`POST /bets/ops/queue-pause/:minutes`
