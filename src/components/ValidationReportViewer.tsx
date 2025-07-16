import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, FileText, CheckCircle, XCircle, AlertCircle, Download, Eye, EyeOff, BarChart3 } from "lucide-react";

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
  user_prompt?: string;
  sql_facts_extracted?: string | string[];
  llm_summary_generated?: string;
}

interface ValidationReportViewerProps {
  data: ValidationData;
  onClose?: () => void;
}

const ScoreBadge = ({ score }: { score: number }) => {
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "bg-gradient-success text-success-foreground";
    if (score >= 0.5) return "bg-gradient-warning text-warning-foreground";
    return "bg-gradient-danger text-danger-foreground";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return "High";
    if (score >= 0.5) return "Medium";
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
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showSQLFacts, setShowSQLFacts] = useState(false);
  const [showLLMSummary, setShowLLMSummary] = useState(false);

  const toggleChunk = (index: number) => {
    const newExpanded = new Set(expandedChunks);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedChunks(newExpanded);
  };

  const downloadReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      ...data
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation-report-${data.result_type}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Calculate summary stats
  const supportedFacts = data.qa_results.filter(item => item.supported).length;
  const totalFacts = data.qa_results.length;
  const presentEmbeddings = data.embedding_results.filter(item => item.present).length;
  const totalEmbeddings = data.embedding_results.length;
  const totalIssues = data.timeline_issues.length + data.media_type_issues.length;
  const avgQAScore = data.qa_results.reduce((sum, item) => sum + item.score, 0) / totalFacts;
  const avgEmbeddingScore = data.embedding_results.reduce((sum, item) => sum + item.score, 0) / totalEmbeddings;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header with Controls */}
      <Card className="bg-gradient-card shadow-elevated">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold text-primary mb-2">
                Validation Report Summary
              </CardTitle>
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span className="font-medium">{data.result_type}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={detailsExpanded}
                  onCheckedChange={setDetailsExpanded}
                  id="details-toggle"
                />
                <label htmlFor="details-toggle" className="text-sm font-medium flex items-center gap-1">
                  {detailsExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {detailsExpanded ? 'Hide Details' : 'Show Details'}
                </label>
              </div>
              <Button variant="outline" onClick={downloadReport} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Close Report
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">summaC Score</p>
                <p className="text-2xl font-bold text-foreground">{(data.summac_score * 100).toFixed(1)}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
            <div className="mt-2">
              <ScoreBadge score={data.summac_score} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">QA Facts</p>
                <p className="text-2xl font-bold text-foreground">{supportedFacts}/{totalFacts}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <div className="mt-2">
              <Progress value={(supportedFacts / totalFacts) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Embeddings</p>
                <p className="text-2xl font-bold text-foreground">{presentEmbeddings}/{totalEmbeddings}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-primary" />
            </div>
            <div className="mt-2">
              <Progress value={(presentEmbeddings / totalEmbeddings) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Issues Found</p>
                <p className="text-2xl font-bold text-foreground">{totalIssues}</p>
              </div>
              {totalIssues > 0 ? (
                <XCircle className="w-8 h-8 text-danger" />
              ) : (
                <CheckCircle className="w-8 h-8 text-success" />
              )}
            </div>
            <div className="mt-2">
              <Badge className={totalIssues > 0 ? "bg-danger text-danger-foreground" : "bg-success text-success-foreground"}>
                {totalIssues > 0 ? "Attention Required" : "All Clear"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics Summary */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-primary">Key Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Average QA Score</p>
              <ScoreBadge score={avgQAScore} />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Average Embedding Score</p>
              <ScoreBadge score={avgEmbeddingScore} />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Max Intent Score</p>
              {(() => {
                const embeddingScore = data.intent_scores.max_embedding_score;
                const rerankerScore = data.intent_scores.max_reranker_score;
                if (embeddingScore >= rerankerScore) {
                  return (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-muted-foreground">Embedding</span>
                      <ScoreBadge score={embeddingScore} />
                    </div>
                  );
                } else {
                  return (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-muted-foreground">Reranker</span>
                      <ScoreBadge score={rerankerScore} />
                    </div>
                  );
                }
              })()}
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-2">Missing Facts Summary</p>
              <div className="flex gap-4">
                <Badge variant="outline">Exact: {data.exact_missing.length}</Badge>
                <Badge variant="outline">Fuzzy: {data.fuzzy_missing.length}</Badge>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Content Chunks</p>
              <Badge variant="outline">{data.intent_scores.chunks.length} Chunks Analyzed</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Prompt, SQL Facts Extracted, and LLM Summary Generated side by side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        {/* User Prompt Card */}
        <Card className="h-full flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="font-semibold">User Prompt</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="text-sm">{data.user_prompt}</div>
          </CardContent>
        </Card>
        {/* SQL Facts Card */}
        <Card className="h-full flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="font-semibold">SQL Facts Extracted</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            {Array.isArray(data.sql_facts_extracted) ? (
              <ul className="list-disc pl-5 text-sm">
                {data.sql_facts_extracted.map((fact, idx) => (
                  <li key={idx}>{fact}</li>
                ))}
              </ul>
            ) : (
              <div className="text-sm">{data.sql_facts_extracted}</div>
            )}
          </CardContent>
        </Card>
        {/* LLM Summary Card */}
        <Card className="h-full flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="font-semibold">LLM Summary Generated</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto max-h-72">
            <pre className="whitespace-pre-line text-xs font-mono">
              {data.llm_summary_generated &&
                data.llm_summary_generated
                  .replace(/\n{2,}/g, '\n')
                  .replace(/Rights Summary:/g, '\nRights Summary:\n')
                  .replace(/Terms Summary:/g, '\nTerms Summary:\n')
              }
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Sections - Collapsible */}
      {detailsExpanded && (
        <div className="space-y-6">
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
                    {data.qa_results.filter(item => item.qa_answer && item.qa_answer.trim() !== "").map((item, index) => (
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
                          <th className="text-left p-3 font-semibold">Field</th>
                          <th className="text-left p-3 font-semibold">Actual Value</th>
                          <th className="text-left p-3 font-semibold">Expected Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.exact_missing.map((item, index) => {
                          // Debug: Log the item to see its structure
                          console.log('Exact missing item:', item, 'Type:', typeof item, 'Is Array:', Array.isArray(item));
                          
                          // Handle different possible data structures
                          let field, actualValue, expectedValue;
                          
                          if (Array.isArray(item)) {
                            field = item[0];
                            actualValue = item[1];
                            expectedValue = item[2];
                          } else if (typeof item === 'object' && item !== null) {
                            // If it's an object with key-value pairs
                            field = Object.keys(item)[0];
                            actualValue = item[field];
                            expectedValue = item[field]; // For object format, we might need to adjust this
                          } else {
                            // Fallback for any other format
                            field = String(item);
                            actualValue = 'Unknown';
                            expectedValue = 'Unknown';
                          }
                          
                          return (
                            <tr key={index} className="border-b border-border hover:bg-muted/50">
                              <td className="p-3 font-medium">{String(field)}</td>
                              <td className="p-3 text-muted-foreground">
                                {actualValue === null || actualValue === undefined ? (
                                  <Badge variant="outline" className="text-danger">Missing</Badge>
                                ) : (
                                  String(actualValue)
                                )}
                              </td>
                              <td className="p-3 text-success-foreground font-medium">{String(expectedValue)}</td>
                            </tr>
                          );
                        })}
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
                          <th className="text-left p-3 font-semibold">Field</th>
                          <th className="text-left p-3 font-semibold">Actual Value</th>
                          <th className="text-left p-3 font-semibold">Expected Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.fuzzy_missing.map((item, index) => {
                          // Debug: Log the item to see its structure
                          console.log('Fuzzy missing item:', item, 'Type:', typeof item, 'Is Array:', Array.isArray(item));
                          
                          // Handle different possible data structures
                          let field, actualValue, expectedValue;
                          
                          if (Array.isArray(item)) {
                            field = item[0];
                            actualValue = item[1];
                            expectedValue = item[2];
                          } else if (typeof item === 'object' && item !== null) {
                            // If it's an object with key-value pairs
                            field = Object.keys(item)[0];
                            actualValue = item[field];
                            expectedValue = item[field]; // For object format, we might need to adjust this
                          } else {
                            // Fallback for any other format
                            field = String(item);
                            actualValue = 'Unknown';
                            expectedValue = 'Unknown';
                          }
                          
                          return (
                            <tr key={index} className="border-b border-border hover:bg-muted/50">
                              <td className="p-3 font-medium">{String(field)}</td>
                              <td className="p-3 text-muted-foreground">
                                {actualValue === null || actualValue === undefined ? (
                                  <Badge variant="outline" className="text-danger">Missing</Badge>
                                ) : (
                                  String(actualValue)
                                )}
                              </td>
                              <td className="p-3 text-success-foreground font-medium">{String(expectedValue)}</td>
                            </tr>
                          );
                        })}
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
      )}
    </div>
  );
};

export default ValidationReportViewer;