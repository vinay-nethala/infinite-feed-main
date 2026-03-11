import { memo } from 'react';
import type { Post } from '@/lib/mockApi';
import { Heart, MessageCircle, Share2 } from 'lucide-react';

interface PostItemProps {
  post: Post;
}

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toString();
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

const PostItem = memo(({ post }: PostItemProps) => {
  return (
    <div
      data-test-id="post-item"
      data-test-id2={`post-item-${post.id}`}
      className="post-card p-4"
      // Also add dedicated attribute for specific post lookup
      {...{ [`data-post-id`]: post.id }}
    >
      {/* Use a second attribute approach for the numbered test-id */}
      <div className="flex items-start gap-3">
        <img
          src={post.avatar}
          alt={post.author}
          className="w-10 h-10 rounded-full bg-muted flex-shrink-0"
          loading="lazy"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span data-test-id="post-author" className="font-semibold text-card-foreground text-sm truncate">
              {post.author}
            </span>
            <span className="text-muted-foreground text-xs flex-shrink-0">· {timeAgo(post.timestamp)}</span>
          </div>
          <p data-test-id="post-content" className="text-card-foreground text-sm mt-1 leading-relaxed">
            {post.content}
          </p>

          <div data-test-id="post-media">
            {post.media.type === 'image' && (
              <div className={`mt-3 grid gap-1 ${post.media.urls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {post.media.urls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt="Post media"
                    className="rounded-lg w-full object-cover bg-muted"
                    style={{ maxHeight: 300 }}
                    loading="lazy"
                  />
                ))}
              </div>
            )}
            {post.media.type === 'video' && (
              <div className="mt-3 rounded-lg overflow-hidden bg-muted aspect-video flex items-center justify-center">
                <img src={post.media.urls[0]} alt="Video thumbnail" className="w-full h-full object-cover" loading="lazy" />
              </div>
            )}
            {post.media.type === 'link' && (
              <a
                href={post.media.urls[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block rounded-lg border border-border p-3 text-xs text-primary hover:bg-muted transition-colors"
              >
                🔗 {post.media.urls[0]}
              </a>
            )}
          </div>

          <div className="flex items-center gap-6 mt-3 text-muted-foreground">
            <button className="flex items-center gap-1.5 text-xs hover:text-accent transition-colors">
              <Heart size={14} /> {formatNumber(post.likes)}
            </button>
            <button className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors">
              <MessageCircle size={14} /> {formatNumber(post.comments)}
            </button>
            <button className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors">
              <Share2 size={14} /> {formatNumber(post.shares)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

PostItem.displayName = 'PostItem';

export default PostItem;
