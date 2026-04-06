CREATE DATABASE IF NOT EXISTS probets_credit
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE probets_credit;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','superagent','agent','player') NOT NULL DEFAULT 'player',
  parent_id BIGINT UNSIGNED NULL,
  credit_balance DECIMAL(20,2) NOT NULL DEFAULT 0.00,
  credit_limit DECIMAL(20,2) NOT NULL DEFAULT 0.00,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  KEY idx_users_parent_id (parent_id),
  CONSTRAINT fk_users_parent FOREIGN KEY (parent_id) REFERENCES users(id)
    ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT chk_users_credit_nonnegative CHECK (credit_balance >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS credit_transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(20,2) NOT NULL,
  type ENUM('add_credit','subtract_credit','bet_place','bet_win','bet_loss','bet_push','settlement') NOT NULL,
  operator_id BIGINT UNSIGNED NOT NULL,
  reference_id VARCHAR(100) NULL,
  remark VARCHAR(255) NULL,
  balance_before DECIMAL(20,2) NOT NULL,
  balance_after DECIMAL(20,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_credit_tx_user_created (user_id, created_at),
  CONSTRAINT fk_credit_tx_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_credit_tx_operator FOREIGN KEY (operator_id) REFERENCES users(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  bet_no VARCHAR(64) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  bet_type ENUM('sports','dice','plinko','baccarat','crash') NOT NULL,
  amount DECIMAL(20,2) NOT NULL,
  event_id VARCHAR(100) NULL,
  market_key VARCHAR(50) NULL,
  selection VARCHAR(100) NULL,
  odds DECIMAL(10,4) NULL,
  potential_payout DECIMAL(20,2) NULL,
  result_status ENUM('pending','win','loss','push','cancel') NOT NULL DEFAULT 'pending',
  payout DECIMAL(20,2) NOT NULL DEFAULT 0.00,
  server_seed_hash VARCHAR(64) NULL,
  client_seed VARCHAR(128) NULL,
  nonce INT NULL,
  fair_roll DECIMAL(6,2) NULL,
  fair_path_json JSON NULL,
  api_snapshot JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  settled_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bets_bet_no (bet_no),
  KEY idx_bets_user_created (user_id, created_at),
  KEY idx_bets_event (event_id),
  CONSTRAINT fk_bets_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS fair_seed_states (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  current_server_seed VARCHAR(128) NOT NULL,
  current_server_seed_hash VARCHAR(64) NOT NULL,
  nonce INT NOT NULL DEFAULT 0,
  last_revealed_server_seed VARCHAR(128) NULL,
  last_revealed_server_seed_hash VARCHAR(64) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_fair_seed_states_user_id (user_id),
  CONSTRAINT fk_fair_seed_states_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS events (
  event_id VARCHAR(100) NOT NULL,
  sport_key VARCHAR(50) NOT NULL,
  home_team VARCHAR(100) NOT NULL,
  away_team VARCHAR(100) NOT NULL,
  commence_time DATETIME NULL,
  last_updated DATETIME NULL,
  status ENUM('upcoming','live','finished','canceled') NOT NULL DEFAULT 'upcoming',
  bookmakers_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (event_id),
  KEY idx_events_sport_status_time (sport_key, status, commence_time)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bet_exposures (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id VARCHAR(100) NOT NULL,
  market_key VARCHAR(50) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  total_stake DECIMAL(20,2) NOT NULL DEFAULT 0.00,
  total_potential_payout DECIMAL(20,2) NOT NULL DEFAULT 0.00,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bet_exposure_user_event_market (user_id, event_id, market_key),
  KEY idx_bet_exposure_event_market (event_id, market_key),
  CONSTRAINT fk_bet_exposure_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sports_bet_queue (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  event_id VARCHAR(100) NOT NULL,
  market_key VARCHAR(50) NOT NULL,
  selection VARCHAR(100) NOT NULL,
  stake DECIMAL(20,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  execute_after DATETIME NOT NULL,
  last_attempt_at DATETIME NULL,
  attempt_count INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 10,
  idempotency_key VARCHAR(180) NULL,
  error_message VARCHAR(255) NULL,
  bet_no VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sports_queue_status_exec (status, execute_after),
  KEY idx_sports_queue_event_market (event_id, market_key),
  KEY idx_sports_queue_user (user_id),
  KEY idx_sports_queue_idempotency (idempotency_key),
  CONSTRAINT fk_sports_queue_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB;
