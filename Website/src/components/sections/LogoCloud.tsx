const logos = [
  "Pearson", "McGraw-Hill", "Coursera", "Blackboard",
  "Canvas", "Moodle", "D2L", "Anthology",
];

const LogoCloud = () => (
  <section className="py-14 px-4 border-y border-border/50 overflow-hidden">
    <div className="max-w-7xl mx-auto">
      <p className="text-center text-xs text-muted-foreground mb-8 uppercase tracking-[0.2em] font-medium">
        Trusted by teams at
      </p>
      {/* Marquee container */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
        <div className="flex animate-marquee">
          {[...logos, ...logos, ...logos].map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="shrink-0 mx-4 px-5 py-2 rounded-full border border-border/60 bg-card/40 text-sm font-mono font-medium text-muted-foreground/60 hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 select-none cursor-default"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default LogoCloud;
