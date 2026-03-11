import VirtualFeed from '@/components/VirtualFeed';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="feed-container px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
            Feed
          </h1>
          <span className="text-xs text-muted-foreground">∞ scroll</span>
        </div>
      </header>
      <VirtualFeed />
    </div>
  );
};

export default Index;
