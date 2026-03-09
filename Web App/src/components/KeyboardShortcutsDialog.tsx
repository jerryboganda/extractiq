import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ShortcutRow {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: ShortcutRow[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: "Global",
    shortcuts: [
      { keys: ["⌘", "K"], description: "Open command palette" },
      { keys: ["?"], description: "Show keyboard shortcuts" },
    ],
  },
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["G", "D"], description: "Go to Dashboard" },
      { keys: ["G", "J"], description: "Go to Jobs" },
      { keys: ["G", "R"], description: "Go to Review Queue" },
      { keys: ["G", "U"], description: "Go to Upload Center" },
      { keys: ["G", "P"], description: "Go to Projects" },
      { keys: ["G", "A"], description: "Go to Analytics" },
      { keys: ["G", "S"], description: "Go to Settings" },
    ],
  },
  {
    title: "Review Detail",
    shortcuts: [
      { keys: ["A"], description: "Approve current MCQ" },
      { keys: ["R"], description: "Reject current MCQ" },
      { keys: ["F"], description: "Flag current MCQ" },
      { keys: ["←"], description: "Previous MCQ" },
      { keys: ["→"], description: "Next MCQ" },
    ],
  },
];

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>Quick reference for keyboard shortcuts throughout the app.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {group.title}
              </h4>
              <div className="space-y-1.5">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key) => (
                        <kbd
                          key={key}
                          className="inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded border border-border bg-muted text-[11px] font-mono font-medium text-muted-foreground"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
