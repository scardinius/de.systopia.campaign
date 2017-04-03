<?php

/**
 * Collection of upgrade steps.
 */
class CRM_Campaign_Upgrader extends CRM_Campaign_Upgrader_Base {

  /**
   * Upgrade to Campaign 1.0.beta2 (basic activities reporting)
   */
  public function upgrade_102() {
    $this->ctx->log->info('Applying upgrade to 1.0.beta2 (basic activities reporting)');
    $this->executeSqlFile('sql/upgrade_102.sql');
    return TRUE;
  }
}
