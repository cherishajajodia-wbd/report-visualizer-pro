import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface ValidationData {
  result_type: string;
  exact_missing: Array<[string, any, any]>;
  fuzzy_missing: Array<[string, any, any]>;
  embedding_results: Array<{
    fact: string;
    score: number;
    present: boolean;
  }>;
  timeline_issues: string[];
  media_type_issues: string[];
  qa_results: Array<{
    fact: string;
    question: string;
    qa_answer: string;
    score: number;
    supported: boolean;
  }>;
  summac_score: number;
  intent_scores: {
    chunks: string[];
    embedding_scores: number[];
    max_embedding_score: number;
    reranker_scores: number[];
    max_reranker_score: number;
  };
}

interface ValidationReportViewerProps {
  data: ValidationData;
  onClose?: () => void;
}

const ScoreBadge = ({ score }: { score: number }) => {
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "bg-gradient-success text-success-foreground";
    if (score >= 0.6) return "bg-gradient-warning text-warning-foreground";
    return "bg-gradient-danger text-danger-foreground";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return "High";
    if (score >= 0.6) return "Medium";
    return "Low";
  };

  return (
    <Badge className={`${getScoreColor(score)} shadow-score font-medium`}>
      {(score * 100).toFixed(1)}% ({getScoreLabel(score)})
    </Badge>
  );
};

const SupportedBadge = ({ supported }: { supported: boolean }) => {
  return (
    <Badge className={supported ? "bg-success text-success-foreground" : "bg-danger text-danger-foreground"}>
      {supported ? (
        <>
          <CheckCircle className="w-3 h-3 mr-1" />
          Supported
        </>
      ) : (
        <>
          <XCircle className="w-3 h-3 mr-1" />
          Not Supported
        </>
      )}
    </Badge>
  );
};

const PresentBadge = ({ present }: { present: boolean }) => {
  return (
    <Badge className={present ? "bg-success text-success-foreground" : "bg-danger text-danger-foreground"}>
      {present ? (
        <>
          <CheckCircle className="w-3 h-3 mr-1" />
          Present
        </>
      ) : (
        <>
          <XCircle className="w-3 h-3 mr-1" />
          Missing
        </>
      )}
    </Badge>
  );
};

const ValidationReportViewer = ({ data, onClose }: ValidationReportViewerProps) => {
  const [expandedChunks, setExpandedChunks] = useState<Set<number>>(new Set());

  const toggleChunk = (index: number) => {
    const newExpanded = new Set(expandedChunks);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedChunks(newExpanded);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <Card className="bg-gradient-card shadow-elevated">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold text-primary mb-2">
                Validation Report
              </CardTitle>
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span className="font-medium">{data.result_type}</span>
              </div>
            </div>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Close Report
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6">
            <h3 className="text-lg font-semibold mb-4">SummaC Factual Consistency Score</h3>
            <div className="flex justify-center items-center gap-4">
              <div className="text-6xl font-bold text-primary">
                {(data.summac_score * 100).toFixed(1)}%
              </div>
              <ScoreBadge score={data.summac_score} />
            </div>
            <Progress value={data.summac_score * 100} className="mt-4 max-w-md mx-auto h-3" />
          </div>
        </CardContent>
      </Card>

      {/* QA-based Fact Checking Section */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            QA-based Fact Checking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-semibold">Fact</th>
                  <th className="text-left p-3 font-semibold">Question</th>
                  <th className="text-left p-3 font-semibold">Extracted Answer</th>
                  <th className="text-left p-3 font-semibold">Score</th>
                  <th className="text-left p-3 font-semibold">Supported</th>
                </tr>
              </thead>
              <tbody>
                {data.qa_results.map((item, index) => (
                  <tr key={index} className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">{item.fact}</td>
                    <td className="p-3 text-muted-foreground">{item.question}</td>
                    <td className="p-3">{item.qa_answer}</td>
                    <td className="p-3">
                      <ScoreBadge score={item.score} />
                    </td>
                    <td className="p-3">
                      <SupportedBadge supported={item.supported} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Intent Validation Section */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-primary">Intent Validation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Chunks */}
          <div>
            <h4 className="font-semibold mb-3">Summary Chunks</h4>
            <div className="space-y-2">
              {data.intent_scores.chunks.map((chunk, index) => (
                <Collapsible key={index}>
                  <CollapsibleTrigger
                    className="flex items-center justify-between w-full p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    onClick={() => toggleChunk(index)}
                  >
                    <span className="font-medium">Chunk {index + 1}</span>
                    {expandedChunks.has(index) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 p-3 bg-card border rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {chunk}
                    </pre>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>

          {/* Scores */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Embedding Scores</h4>
              <div className="space-y-2">
                {data.intent_scores.embedding_scores.map((score, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span>Chunk {index + 1}</span>
                    <ScoreBadge score={score} />
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border">
                  <span className="font-semibold">Max Embedding Score</span>
                  <ScoreBadge score={data.intent_scores.max_embedding_score} />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Reranker Scores</h4>
              <div className="space-y-2">
                {data.intent_scores.reranker_scores.map((score, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span>Chunk {index + 1}</span>
                    <ScoreBadge score={score} />
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border">
                  <span className="font-semibold">Max Reranker Score</span>
                  <ScoreBadge score={data.intent_scores.max_reranker_score} />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Missing Facts Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary">Exact Missing Facts</CardTitle>
          </CardHeader>
          <CardContent>
            {data.exact_missing.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-semibold">Key</th>
                      <th className="text-left p-3 font-semibold">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.exact_missing.map((item, index) => (
                      <tr key={index} className="border-b border-border hover:bg-muted/50">
                        <td className="p-3 font-medium">{item[0]}</td>
                        <td className="p-3 text-muted-foreground">{item[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-success" />
                <p>No exact missing facts found</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary">Fuzzy Missing Facts</CardTitle>
          </CardHeader>
          <CardContent>
            {data.fuzzy_missing.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-semibold">Key</th>
                      <th className="text-left p-3 font-semibold">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.fuzzy_missing.map((item, index) => (
                      <tr key={index} className="border-b border-border hover:bg-muted/50">
                        <td className="p-3 font-medium">{item[0]}</td>
                        <td className="p-3 text-muted-foreground">{item[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-success" />
                <p>No fuzzy missing facts found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Embedding Results Section */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-primary">Embedding Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-semibold">Fact</th>
                  <th className="text-left p-3 font-semibold">Score</th>
                  <th className="text-left p-3 font-semibold">Present</th>
                </tr>
              </thead>
              <tbody>
                {data.embedding_results.map((item, index) => (
                  <tr key={index} className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">{item.fact}</td>
                    <td className="p-3">
                      <ScoreBadge score={item.score} />
                    </td>
                    <td className="p-3">
                      <PresentBadge present={item.present} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Issues & Media Type Issues */}
      {(data.timeline_issues.length > 0 || data.media_type_issues.length > 0) && (
        <div className="grid md:grid-cols-2 gap-6">
          {data.timeline_issues.length > 0 && (
            <Card className="bg-gradient-warning shadow-card">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-warning-foreground">Timeline Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.timeline_issues.map((issue, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 text-warning-foreground" />
                      <span className="text-warning-foreground">{issue}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {data.media_type_issues.length > 0 && (
            <Card className="bg-gradient-warning shadow-card">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-warning-foreground">Media Type Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.media_type_issues.map((issue, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 text-warning-foreground" />
                      <span className="text-warning-foreground">{issue}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ValidationReportViewer;