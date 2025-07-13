"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Info
} from 'lucide-react'
import { importCSVAction, CSVImportResult } from '@/lib/actions/csv-import'

interface CSVImportDialogProps {
  onImportComplete?: (result: CSVImportResult) => void
}

export function CSVImportDialog({ onImportComplete }: CSVImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<CSVImportResult | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    setResult(null)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      handleFileSelect(droppedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const actionResult = await importCSVAction(formData)
      
      if (actionResult.success && actionResult.data) {
        setResult(actionResult.data)
        
        if (onImportComplete) {
          onImportComplete(actionResult.data)
        }
      } else {
        setResult({
          success: false,
          message: actionResult.error || 'インポートに失敗しました',
          errors: [],
          totalRows: 0,
          validRows: 0,
          importedRows: 0
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      setResult({
        success: false,
        message: 'アップロードに失敗しました',
        errors: [],
        totalRows: 0,
        validRows: 0,
        importedRows: 0
      })
    } finally {
      setIsUploading(false)
    }
  }

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/properties/template')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'property_template.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Template download error:', error)
    }
  }

  const resetDialog = () => {
    setFile(null)
    setResult(null)
    setIsUploading(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) {
        resetDialog()
      }
    }}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          CSVインポート
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>物件データCSVインポート</DialogTitle>
          <DialogDescription>
            CSVファイルから物件データを一括インポートできます
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                CSVテンプレート
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                正しい形式でデータをインポートするため、まずテンプレートをダウンロードしてください。
              </p>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                テンプレートをダウンロード
              </Button>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">ファイルアップロード</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                } ${file ? 'bg-muted/50' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {file ? (
                  <div className="space-y-2">
                    <FileText className="h-8 w-8 mx-auto text-green-600" />
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFile(null)}
                    >
                      ファイルを変更
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm">
                      CSVファイルをドラッグ&ドロップするか、クリックして選択
                    </p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const selectedFile = e.target.files?.[0]
                        if (selectedFile) {
                          handleFileSelect(selectedFile)
                        }
                      }}
                      className="hidden"
                      id="csv-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('csv-upload')?.click()}
                    >
                      ファイルを選択
                    </Button>
                  </div>
                )}
              </div>

              {file && (
                <div className="mt-4 flex justify-end">
                  <Button onClick={handleUpload} disabled={isUploading}>
                    {isUploading ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        アップロード中...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        インポート実行
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload Result */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2 text-red-600" />
                  )}
                  インポート結果
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.success ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-800 font-medium">{result.message}</p>
                  </div>
                ) : (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800 font-medium">
                      {result.message || 'インポートに失敗しました'}
                    </p>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{result.totalRows}</p>
                    <p className="text-sm text-muted-foreground">総行数</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{result.validRows}</p>
                    <p className="text-sm text-muted-foreground">有効行数</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{result.importedRows}</p>
                    <p className="text-sm text-muted-foreground">インポート済み</p>
                  </div>
                </div>

                {/* Errors */}
                {result.errors && result.errors.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
                      エラー詳細 ({result.errors.length}件)
                    </h4>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {result.errors.map((error, index) => (
                        <div key={index} className="text-sm p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <span className="font-medium">行{error.row}</span>
                          {error.field !== 'general' && (
                            <span className="text-muted-foreground"> ({error.field})</span>
                          )}
                          : {error.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <Info className="h-4 w-4 mr-2" />
                インポート手順
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                <li>テンプレートをダウンロードして形式を確認</li>
                <li>Excelなどでテンプレートに物件データを入力</li>
                <li>CSV形式で保存</li>
                <li>上記のアップロード欄からファイルを選択</li>
                <li>「インポート実行」ボタンをクリック</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}