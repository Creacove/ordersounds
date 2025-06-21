
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertTriangle, Upload } from 'lucide-react';
import { migrateBase64ImagesToStorage, cleanupCorruptedRecords, type MigrationResult } from '@/lib/migrationUtils';
import { setupStorageBuckets, testStorageAccess } from '@/lib/storageSetup';
import { toast } from 'sonner';

export function ImageMigrationTool() {
  const [isRunning, setIsRunning] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [cleanupResult, setCleanupResult] = useState<{ cleaned: number; errors: string[] } | null>(null);
  const [storageStatus, setStorageStatus] = useState<string>('');

  const checkStorageSetup = async () => {
    try {
      const setupResult = await setupStorageBuckets();
      const testResult = await testStorageAccess();
      
      if (setupResult.success && testResult.success) {
        setStorageStatus('✅ Storage buckets are properly configured');
        toast.success('Storage setup verified');
      } else {
        setStorageStatus(`❌ Storage issue: ${setupResult.message || testResult.message}`);
        toast.error('Storage setup issue detected');
      }
    } catch (error) {
      setStorageStatus(`❌ Error checking storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error('Failed to check storage setup');
    }
  };

  const runMigration = async () => {
    setIsRunning(true);
    setMigrationResult(null);
    
    try {
      toast.info('Starting migration of base64 images to storage...');
      const result = await migrateBase64ImagesToStorage();
      setMigrationResult(result);
      
      if (result.migratedUsers > 0) {
        toast.success(`Migration completed! Migrated ${result.migratedUsers} users`);
      } else {
        toast.info('No users found with base64 profile pictures');
      }
    } catch (error) {
      toast.error('Migration failed');
      console.error('Migration error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runCleanup = async () => {
    setIsRunning(true);
    setCleanupResult(null);
    
    try {
      toast.info('Starting cleanup of corrupted records...');
      const result = await cleanupCorruptedRecords();
      setCleanupResult(result);
      
      if (result.cleaned > 0) {
        toast.success(`Cleanup completed! Cleaned ${result.cleaned} corrupted records`);
      } else {
        toast.info('No corrupted records found');
      }
    } catch (error) {
      toast.error('Cleanup failed');
      console.error('Cleanup error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Image Storage Migration Tool
          </CardTitle>
          <CardDescription>
            Migrate profile pictures from base64 storage to Supabase Storage to fix database corruption and improve performance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button onClick={checkStorageSetup} variant="outline" className="w-full">
              Check Storage Setup
            </Button>
            {storageStatus && (
              <Alert>
                <AlertDescription>{storageStatus}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={runMigration}
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Migration...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Migrate Base64 Images
                </>
              )}
            </Button>

            <Button
              onClick={runCleanup}
              disabled={isRunning}
              variant="destructive"
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Cleanup...
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Clean Corrupted Records
                </>
              )}
            </Button>
          </div>

          {migrationResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p><strong>Migration Results:</strong></p>
                  <p>Total users found: {migrationResult.totalUsers}</p>
                  <p>Successfully migrated: {migrationResult.migratedUsers}</p>
                  <p>Failed migrations: {migrationResult.failedUsers}</p>
                  {migrationResult.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer">View Errors</summary>
                      <ul className="list-disc list-inside mt-1">
                        {migrationResult.errors.map((error, index) => (
                          <li key={index} className="text-sm text-red-600">{error}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {cleanupResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p><strong>Cleanup Results:</strong></p>
                  <p>Corrupted records cleaned: {cleanupResult.cleaned}</p>
                  {cleanupResult.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer">View Errors</summary>
                      <ul className="list-disc list-inside mt-1">
                        {cleanupResult.errors.map((error, index) => (
                          <li key={index} className="text-sm text-red-600">{error}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
