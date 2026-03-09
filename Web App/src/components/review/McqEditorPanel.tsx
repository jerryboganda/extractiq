import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProgressRing } from "@/components/dashboard/ProgressRing";
import { X, Plus } from "lucide-react";

interface McqEditorPanelProps {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  confidence: number;
  confidenceBreakdown: number[];
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
}

const difficultyColors: Record<string, string> = {
  easy: "bg-success/10 text-success border-success/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  hard: "bg-destructive/10 text-destructive border-destructive/20",
};

const optionLabels = ["A", "B", "C", "D"];

export function McqEditorPanel({
  question: initialQuestion,
  options: initialOptions,
  correctIndex: initialCorrect,
  explanation: initialExplanation,
  confidence,
  confidenceBreakdown,
  difficulty: initialDifficulty,
  tags: initialTags,
}: McqEditorPanelProps) {
  const [question, setQuestion] = useState(initialQuestion);
  const [options, setOptions] = useState(initialOptions);
  const [correctIndex, setCorrectIndex] = useState(initialCorrect);
  const [explanation, setExplanation] = useState(initialExplanation);
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [tags, setTags] = useState(initialTags);
  const [newTag, setNewTag] = useState("");

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  const updateOption = (i: number, val: string) => {
    const next = [...options];
    next[i] = val;
    setOptions(next);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Confidence overview */}
        <div className="flex items-center gap-4 animate-fade-in">
          <ProgressRing progress={Math.round(confidence)} size={56} strokeWidth={5} />
          <div>
            <p className="text-sm font-semibold text-foreground">Overall Confidence</p>
            <p className="text-xs text-muted-foreground">{confidence}% extraction accuracy</p>
          </div>
          <div className="ml-auto">
            <Badge className={`text-[10px] px-2 py-0.5 ${difficultyColors[difficulty]}`}>
              {difficulty}
            </Badge>
          </div>
        </div>

        {/* Question */}
        <div className="space-y-2 animate-fade-in" style={{ animationDelay: "50ms" }}>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Question</label>
          <Textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            className="min-h-[80px] text-sm bg-muted/50 border-border focus:border-primary/50"
          />
        </div>

        {/* Options with confidence bars */}
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Answer Options</label>
          {options.map((opt, i) => (
            <div key={i} className="flex items-start gap-3 group">
              <button
                onClick={() => setCorrectIndex(i)}
                className={`mt-2 flex-shrink-0 w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center border-2 transition-all ${
                  correctIndex === i
                    ? "bg-success/20 border-success text-success"
                    : "border-border text-muted-foreground hover:border-foreground/50"
                }`}
              >
                {optionLabels[i]}
              </button>
              <div className="flex-1 space-y-1">
                <Input
                  value={opt}
                  onChange={e => updateOption(i, e.target.value)}
                  className="text-sm h-9 bg-muted/50 border-border focus:border-primary/50"
                />
                {/* Confidence bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        correctIndex === i ? "bg-success" : "bg-muted-foreground/40"
                      }`}
                      style={{ width: `${confidenceBreakdown[i] * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground w-10 text-right">
                    {(confidenceBreakdown[i] * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Explanation */}
        <div className="space-y-2 animate-fade-in" style={{ animationDelay: "150ms" }}>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Explanation</label>
          <Textarea
            value={explanation}
            onChange={e => setExplanation(e.target.value)}
            className="min-h-[100px] text-sm bg-muted/50 border-border focus:border-primary/50"
          />
        </div>

        {/* Difficulty */}
        <div className="space-y-2 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Difficulty</label>
          <Select value={difficulty} onValueChange={(v: "easy" | "medium" | "hard") => setDifficulty(v)}>
            <SelectTrigger className="w-32 h-9 text-sm bg-muted/50 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tags */}
        <div className="space-y-2 animate-fade-in" style={{ animationDelay: "250ms" }}>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tags</label>
          <div className="flex flex-wrap gap-1.5">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-[10px] gap-1 pr-1">
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors">
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            ))}
            <div className="flex items-center gap-1">
              <Input
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addTag()}
                placeholder="Add tag..."
                className="h-6 w-24 text-[10px] bg-transparent border-border px-2"
              />
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={addTag}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
