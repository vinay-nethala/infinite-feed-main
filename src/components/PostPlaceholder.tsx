const PostPlaceholder = () => (
  <div data-test-id="post-placeholder" className="post-placeholder p-4" style={{ minHeight: 80 }}>
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-border" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 rounded bg-border" />
        <div className="h-3 w-full rounded bg-border" />
        <div className="h-3 w-3/4 rounded bg-border" />
      </div>
    </div>
  </div>
);

export default PostPlaceholder;
