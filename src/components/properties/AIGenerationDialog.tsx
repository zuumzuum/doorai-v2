"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  Sparkles, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  DollarSign,
  FileText,
  Loader2
} from "lucide-react";
import { 
  generateDescriptionsAction, 
  getGenerationStatusAction 
} from "@/lib/actions/ai-generation";
import { 
  getBatchStatusAction, 
  processBatchResultsAction, 
  cancelBatchAction 
} from "@/lib/actions/batch-status";

interface AIGenerationDialogProps {
  trigger?: React.ReactNode;
  onComplete?: () => void;
}

interface BatchStatus {
  batchId?: string;
  status?: string;
  requestCounts?: {
    total: number;
    completed: number;
    failed: number;
  };
  estimatedCost?: number;
  estimatedTokens?: number;
}

interface GenerationStatus {
  activeBatches: number;
  pendingProperties: number;
  batches: any[];
}

export function AIGenerationDialog({ trigger, onComplete }: AIGenerationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentBatch, setCurrentBatch] = useState<BatchStatus | null>(null);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchGenerationStatus();
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const fetchGenerationStatus = async () => {
    try {
      const result = await getGenerationStatusAction();
      
      if (result.success && result.data) {
        setGenerationStatus(result.data);
      } else {
        console.error('Failed to fetch generation status:', result.error);
      }
    } catch (error) {
      console.error('Failed to fetch generation status:', error);
    }
  };

  const startGeneration = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateDescriptionsAction();

      if (!result.success) {
        setError(result.error || 'Generation failed');
        return;
      }

      if (result.data) {
        setCurrentBatch({
          batchId: result.data.batchId,
          status: 'validating',
          estimatedCost: result.data.estimatedCost,
          estimatedTokens: result.data.estimatedTokens
        });

        // Start polling for status updates
        startPolling(result.data.batchId);
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  const startPolling = (batchId: string) => {
    const interval = setInterval(async () => {
      try {
        const result = await getBatchStatusAction(batchId);
        
        if (result.success && result.data) {
          const data = result.data;
          setCurrentBatch(prev => ({
            ...prev,
            batchId: data.batchId,
            status: data.status,
            requestCounts: data.requestCounts
          }));

          // If completed, process results
          if (data.status === 'completed' && data.outputFileId) {
            await processResults(batchId);
            clearInterval(interval);
            setPollingInterval(null);
          }

          // Stop polling if failed or cancelled
          if (['failed', 'cancelled', 'expired'].includes(data.status)) {
            clearInterval(interval);
            setPollingInterval(null);
          }
        }

      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000); // Poll every 5 seconds

    setPollingInterval(interval);
  };

  const processResults = async (batchId: string) => {
    try {
      const result = await processBatchResultsAction(batchId);
      
      if (result.success && onComplete) {
        onComplete();
      }

    } catch (error) {
      console.error('Failed to process results:', error);
    }
  };

  const cancelGeneration = async () => {
    if (!currentBatch?.batchId) return;

    try {
      const result = await cancelBatchAction(currentBatch.batchId);
      
      if (result.success) {
        setCurrentBatch(prev => prev ? { ...prev, status: 'cancelled' } : null);
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      }

    } catch (error) {
      console.error('Failed to cancel generation:', error);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'validating':
      case 'in_progress':
      case 'finalizing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'validating': return '検証中...';
      case 'in_progress': return '生成中...';
      case 'finalizing': return '最終処理中...';
      case 'completed': return '完了';
      case 'failed': return '失敗';
      case 'expired': return '期限切れ';
      case 'cancelled': return 'キャンセル済み';
      default: return '待機中';
    }
  };

  const getProgress = () => {
    if (!currentBatch?.requestCounts) return 0;
    const { total, completed } = currentBatch.requestCounts;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const canStartGeneration = !currentBatch && 
    generationStatus && 
    generationStatus.activeBatches === 0 && 
    generationStatus.pendingProperties > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Bot className="h-4 w-4 mr-2" />
            AI一括生成
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            AI紹介文生成
          </DialogTitle>
          <DialogDescription>
            GPT-4oを使用して物件の魅力的な紹介文を自動生成します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Generation Status */}
          {generationStatus && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">処理待ち物件</span>
                <Badge variant="outline">
                  {generationStatus.pendingProperties}件
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">実行中ジョブ</span>
                <Badge variant={generationStatus.activeBatches > 0 ? "default" : "secondary"}>
                  {generationStatus.activeBatches}件
                </Badge>
              </div>
            </div>
          )}

          {/* Current Batch Status */}
          {currentBatch && (
            <div className="space-y-3 p-4 border rounded-lg bg-secondary/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(currentBatch.status)}
                  <span className="font-medium">
                    {getStatusText(currentBatch.status)}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {currentBatch.batchId?.slice(0, 8)}...
                </Badge>
              </div>

              {/* Progress Bar */}
              {currentBatch.requestCounts && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>進捗状況</span>
                    <span>
                      {currentBatch.requestCounts.completed} / {currentBatch.requestCounts.total}
                    </span>
                  </div>
                  <Progress value={getProgress()} className="h-2" />
                </div>
              )}

              {/* Cost Information */}
              {currentBatch.estimatedCost && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span className="text-muted-foreground">推定コスト</span>
                  </div>
                  <span className="font-medium">
                    ${currentBatch.estimatedCost.toFixed(3)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center text-red-800 text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            </div>
          )}

          {/* Information */}
          {!currentBatch && (
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                AI紹介文が未生成の物件を対象に一括生成します
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                処理には数分〜数十分かかる場合があります
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          {currentBatch && ['validating', 'in_progress', 'finalizing'].includes(currentBatch.status || '') && (
            <Button
              variant="outline"
              onClick={cancelGeneration}
              size="sm"
            >
              キャンセル
            </Button>
          )}
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              閉じる
            </Button>
            
            {canStartGeneration && (
              <Button
                onClick={startGeneration}
                disabled={isGenerating}
              >
                {isGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                生成開始
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}