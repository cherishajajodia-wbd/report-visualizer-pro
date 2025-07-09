import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, File, AlertCircle, CheckCircle } from "lucide-react";

interface FileUploadProps {
  onFileUpload: (data: any) => void;
  onError: (error: string) => void;
}

const FileUpload = ({ onFileUpload, onError }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setUploadedFile(file);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Basic validation to ensure it's a validation report
      if (!data.result_type || !data.summac_score || !data.qa_results) {
        throw new Error("Invalid validation report format. Please ensure the file contains required fields: result_type, summac_score, and qa_results.");
      }

      onFileUpload(data);
    } catch (error) {
      console.error("Error processing file:", error);
      onError(error instanceof Error ? error.message : "Error processing file. Please ensure it's a valid JSON file.");
      setUploadedFile(null);
    } finally {
      setIsProcessing(false);
    }
  }, [onFileUpload, onError]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
    onDropRejected: () => setIsDragging(false)
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="bg-gradient-card shadow-elevated">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary mb-2">
            Validation Report Viewer
          </CardTitle>
          <p className="text-muted-foreground">
            Upload a JSON validation report to view detailed analysis
          </p>
        </CardHeader>
        <CardContent>
          {!uploadedFile ? (
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
                ${isDragActive || isDragging 
                  ? 'border-primary bg-primary/10 scale-105' 
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                }
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-4">
                <div className={`rounded-full p-4 ${isDragActive || isDragging ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-lg font-semibold mb-2">
                    {isDragActive ? 'Drop the file here' : 'Drag & drop your JSON file here'}
                  </p>
                  <p className="text-muted-foreground mb-4">
                    or click to select a file
                  </p>
                  <Button variant="outline" disabled={isProcessing}>
                    {isProcessing ? 'Processing...' : 'Choose File'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert className="border-success bg-success/10">
                <CheckCircle className="h-4 w-4 text-success" />
                <AlertDescription className="text-success">
                  File uploaded successfully: {uploadedFile.name}
                </AlertDescription>
              </Alert>
              
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <File className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{uploadedFile.name}</span>
                <span className="text-muted-foreground">
                  ({(uploadedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setUploadedFile(null);
                    onFileUpload(null);
                  }}
                >
                  Upload New File
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-input"
                />
                <Button 
                  variant="outline" 
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  Browse Files
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              <strong>Supported formats:</strong> JSON files (.json)
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              <strong>Required fields:</strong> result_type, summac_score, qa_results, embedding_results, intent_scores
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = '/sample-validation-report.json';
                  link.download = 'sample-validation-report.json';
                  link.click();
                }}
              >
                Download Sample File
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FileUpload;