import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { useCache } from '../../contexts/CacheContext';
import { cacheMonitor } from '../../utils/cacheMonitoring';
import { MaintenanceHistoryPanel } from './MaintenanceHistoryPanel';

interface MaintenanceRule {
  id: string;
  name: string;
  description: string;
  condition: () => Promise<boolean>;
  action: () => Promise<void>;
  interval: number; // in milliseconds
  enabled: boolean;
}

interface MaintenanceEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  timestamp: Date;
  status: 'success' | 'failure';
  action: string;
  details?: string;
}

export const CacheMaintenancePanel: React.FC = () => {
  const { clearCache, invalidateCache, getStorageStats } = useCache();
  const [isAutoMaintenance, setIsAutoMaintenance] = useState(false);
  const [lastMaintenance, setLastMaintenance] = useState<Date | null>(null);
  const [maintenanceStatus, setMaintenanceStatus] = useState<string>('');
  const [rules, setRules] = useState<MaintenanceRule[]>([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceEvent[]>([]);

  // Function to add a maintenance event
  const addMaintenanceEvent = (event: Omit<MaintenanceEvent, 'id'>) => {
    const newEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    setMaintenanceHistory(prev => [newEvent, ...prev]);
  };

  // Define maintenance rules
  useEffect(() => {
    const defaultRules: MaintenanceRule[] = [
      {
        id: 'storage-limit',
        name: 'Storage Limit Check',
        description: 'Clears oldest cache entries when storage exceeds 80% of limit',
        condition: async () => {
          const stats = await getStorageStats();
          return (stats.usage / stats.quota) > 0.8;
        },
        action: async () => {
          const oldestEntries = await invalidateCache('oldest');
          setMaintenanceStatus('Cleared oldest cache entries');
          addMaintenanceEvent({
            ruleId: 'storage-limit',
            ruleName: 'Storage Limit Check',
            timestamp: new Date(),
            status: 'success',
            action: 'Cleared oldest cache entries',
            details: 'Storage usage exceeded 80% threshold'
          });
        },
        interval: 5 * 60 * 1000, // 5 minutes
        enabled: true
      },
      {
        id: 'error-rate',
        name: 'Error Rate Monitor',
        description: 'Invalidates problematic cache entries when error rate is high',
        condition: async () => {
          const metrics = cacheMonitor.getMetrics();
          return metrics.errorRate > 0.05; // 5% error rate threshold
        },
        action: async () => {
          await invalidateCache('error-prone');
          setMaintenanceStatus('Invalidated error-prone cache entries');
          addMaintenanceEvent({
            ruleId: 'error-rate',
            ruleName: 'Error Rate Monitor',
            timestamp: new Date(),
            status: 'success',
            action: 'Invalidated error-prone entries',
            details: 'Error rate exceeded 5% threshold'
          });
        },
        interval: 10 * 60 * 1000, // 10 minutes
        enabled: true
      },
      {
        id: 'compression-check',
        name: 'Compression Optimization',
        description: 'Recompresses cache entries with poor compression ratios',
        condition: async () => {
          const stats = await getStorageStats();
          return stats.compressionRatio > 0.7; // Poor compression threshold
        },
        action: async () => {
          await invalidateCache('uncompressed');
          setMaintenanceStatus('Optimized cache compression');
          addMaintenanceEvent({
            ruleId: 'compression-check',
            ruleName: 'Compression Optimization',
            timestamp: new Date(),
            status: 'success',
            action: 'Optimized cache compression',
            details: 'Compression ratio exceeded 0.7 threshold'
          });
        },
        interval: 30 * 60 * 1000, // 30 minutes
        enabled: true
      }
    ];

    setRules(defaultRules);
  }, [getStorageStats, invalidateCache]);

  // Automated maintenance loop
  useEffect(() => {
    if (!isAutoMaintenance) return;

    const checkRules = async () => {
      for (const rule of rules) {
        if (!rule.enabled) continue;

        try {
          const shouldExecute = await rule.condition();
          if (shouldExecute) {
            await rule.action();
            setLastMaintenance(new Date());
          }
        } catch (error) {
          console.error(`Maintenance rule "${rule.name}" failed:`, error);
          addMaintenanceEvent({
            ruleId: rule.id,
            ruleName: rule.name,
            timestamp: new Date(),
            status: 'failure',
            action: 'Rule execution failed',
            details: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    };

    const intervals = rules.map(rule => 
      setInterval(() => {
        if (rule.enabled) {
          checkRules();
        }
      }, rule.interval)
    );

    return () => {
      intervals.forEach(clearInterval);
    };
  }, [isAutoMaintenance, rules]);

  const toggleRule = (ruleId: string) => {
    setRules(prevRules => 
      prevRules.map(rule => 
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
  };

  const runManualMaintenance = async () => {
    setMaintenanceStatus('Running maintenance...');
    try {
      for (const rule of rules) {
        if (!rule.enabled) continue;
        const shouldExecute = await rule.condition();
        if (shouldExecute) {
          await rule.action();
        }
      }
      setLastMaintenance(new Date());
      setMaintenanceStatus('Maintenance completed successfully');
      addMaintenanceEvent({
        ruleId: 'manual',
        ruleName: 'Manual Maintenance',
        timestamp: new Date(),
        status: 'success',
        action: 'Manual maintenance completed',
        details: 'All enabled rules executed successfully'
      });
    } catch (error) {
      console.error('Manual maintenance failed:', error);
      setMaintenanceStatus('Maintenance failed');
      addMaintenanceEvent({
        ruleId: 'manual',
        ruleName: 'Manual Maintenance',
        timestamp: new Date(),
        status: 'failure',
        action: 'Manual maintenance failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Automated Maintenance
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Auto-maintenance
            </span>
            <button
              onClick={() => setIsAutoMaintenance(!isAutoMaintenance)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                isAutoMaintenance ? 'bg-primary-600' : 'bg-gray-200'
              }`}
              role="switch"
              aria-checked={isAutoMaintenance}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isAutoMaintenance ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {rules.map(rule => (
            <div 
              key={rule.id}
              className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {rule.name}
                  </h4>
                  <span 
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      rule.enabled 
                        ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-300'
                    }`}
                  >
                    {rule.enabled ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {rule.description}
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Runs every {rule.interval / 60000} minutes
                </p>
              </div>
              <button
                onClick={() => toggleRule(rule.id)}
                className="ml-4 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                {rule.enabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          ))}

          <div className="mt-6 flex items-center justify-between">
            <div>
              <button
                onClick={runManualMaintenance}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg 
                  hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                  focus:ring-primary-500"
              >
                Run Maintenance Now
              </button>
              {maintenanceStatus && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Status: {maintenanceStatus}
                </p>
              )}
            </div>
            {lastMaintenance && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last run: {lastMaintenance.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </Card>

      <MaintenanceHistoryPanel events={maintenanceHistory} />
    </div>
  );
}; 