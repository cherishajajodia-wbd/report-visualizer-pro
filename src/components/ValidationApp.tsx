import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import FileUpload from "./FileUpload";
import ValidationReportViewer from "./ValidationReportViewer";

const ValidationApp = () => {
  const [validationData, setValidationData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (data: any) => {
    setValidationData(data);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setValidationData(null);
  };

  const handleCloseReport = () => {
    setValidationData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {error && (
        <div className="max-w-2xl mx-auto p-6">
          <Alert className="border-danger bg-danger/10">
            <AlertCircle className="h-4 w-4 text-danger" />
            <AlertDescription className="text-danger">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {!validationData ? (
        <FileUpload onFileUpload={handleFileUpload} onError={handleError} />
      ) : (
        <ValidationReportViewer 
          data={validationData} 
          onClose={handleCloseReport} 
        />
      )}
    </div>
  );
};

export default ValidationApp;