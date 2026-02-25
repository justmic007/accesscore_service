module.exports = {
  /**
   * Migration: Add expiresAt field to existing API keys
   * This demonstrates backward compatibility - existing keys without expiration continue to work
   */
  async up(db, client) {
    // Add expiresAt field to all existing API keys that don't have it
    // Set to null (no expiration) for backward compatibility
    await db.collection('apikeys').updateMany(
      { expiresAt: { $exists: false } },
      { 
        $set: { 
          expiresAt: null // null means no expiration (backward compatible)
        } 
      }
    );

    console.log('Migration completed: Added expiresAt field to API keys');
  },

  /**
   * Rollback: Remove expiresAt field from API keys
   */
  async down(db, client) {
    // Remove the expiresAt field from all API keys
    await db.collection('apikeys').updateMany(
      {},
      { 
        $unset: { expiresAt: '' } 
      }
    );

    console.log('Migration rolled back: Removed expiresAt field from API keys');
  }
};
