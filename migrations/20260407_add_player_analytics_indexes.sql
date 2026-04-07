-- Migration: add indexes for player analytics/admin reporting queries
-- Date: 2026-04-07

ALTER TABLE `bets`
  ADD INDEX `idx_bets_user_created_at` (`user_id`, `created_at`);

ALTER TABLE `users`
  ADD INDEX `idx_users_role_parent_id` (`role`, `parent_id`),
  ADD INDEX `idx_users_username` (`username`);

ALTER TABLE `credit_transactions`
  ADD INDEX `idx_credit_tx_user_created_at` (`user_id`, `created_at`);

-- Rollback (manual):
-- ALTER TABLE `bets` DROP INDEX `idx_bets_user_created_at`;
-- ALTER TABLE `users` DROP INDEX `idx_users_role_parent_id`, DROP INDEX `idx_users_username`;
-- ALTER TABLE `credit_transactions` DROP INDEX `idx_credit_tx_user_created_at`;
