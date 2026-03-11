import { useCallback, useEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { fetchPosts, type Post } from '@/lib/mockApi';
import PostItem from './PostItem';
import PostPlaceholder from './PostPlaceholder';

const BATCH_SIZE = 20;
const OVERSCAN = 5;
const DEFAULT_ESTIMATED_HEIGHT = 200;

export default function VirtualFeed() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [prevCursor, setPrevCursor] = useState<number | null>(null);
  const [loadingNext, setLoadingNext] = useState(false);
  const [loadingPrev, setLoadingPrev] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const heightCache = useRef<Record<number, number>>({});
  const prevScrollData = useRef<{ scrollTop: number; totalHeight: number } | null>(null);

  // Expose measurements on window
  useEffect(() => {
    (window as any).getPostMeasurements = () => ({ ...heightCache.current });
    return () => { delete (window as any).getPostMeasurements; };
  }, []);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    fetchPosts(BATCH_SIZE).then((res) => {
      if (cancelled) return;
      setPosts(res.data);
      setNextCursor(res.nextCursor);
      // Set prev cursor based on first post
      if (res.data.length > 0) {
        setPrevCursor(-res.data[0].id);
      }
      setInitialLoaded(true);
    });
    return () => { cancelled = true; };
  }, []);

  const estimateSize = useCallback(
    (index: number) => {
      const post = posts[index];
      if (post && heightCache.current[post.id]) {
        return heightCache.current[post.id];
      }
      return DEFAULT_ESTIMATED_HEIGHT;
    },
    [posts]
  );

  const virtualizer = useVirtualizer({
    count: posts.length,
    getScrollElement: () => scrollRef.current,
    estimateSize,
    overscan: OVERSCAN,
    getItemKey: (index) => posts[index]?.id ?? index,
  });

  // Measure items after render
  const measureRef = useCallback(
    (el: HTMLDivElement | null, index: number) => {
      if (!el) return;
      const post = posts[index];
      if (!post) return;
      const measured = el.getBoundingClientRect().height;
      if (measured > 0 && heightCache.current[post.id] !== measured) {
        heightCache.current[post.id] = measured;
        virtualizer.measureElement(el);
      }
    },
    [posts, virtualizer]
  );

  // Load next page
  const loadNext = useCallback(async () => {
    if (loadingNext || nextCursor === null) return;
    setLoadingNext(true);
    try {
      const res = await fetchPosts(BATCH_SIZE, nextCursor);
      setPosts((prev) => {
        // Deduplicate
        const existingIds = new Set(prev.map((p) => p.id));
        const newPosts = res.data.filter((p) => !existingIds.has(p.id));
        return [...prev, ...newPosts];
      });
      setNextCursor(res.nextCursor);
    } finally {
      setLoadingNext(false);
    }
  }, [loadingNext, nextCursor]);

  // Load prev page
  const loadPrev = useCallback(async () => {
    if (loadingPrev || prevCursor === null) return;
    setLoadingPrev(true);

    // Save scroll state for anchoring
    const container = scrollRef.current;
    if (container) {
      prevScrollData.current = {
        scrollTop: container.scrollTop,
        totalHeight: container.scrollHeight,
      };
    }

    try {
      const res = await fetchPosts(BATCH_SIZE, prevCursor);
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newPosts = res.data.filter((p) => !existingIds.has(p.id));
        return [...newPosts, ...prev];
      });
      if (res.data.length > 0) {
        const firstNew = res.data[0];
        setPrevCursor(firstNew.id > 0 ? -firstNew.id : null);
      } else {
        setPrevCursor(null);
      }
    } finally {
      setLoadingPrev(false);
    }
  }, [loadingPrev, prevCursor]);

  // Scroll anchoring: after prepending items, adjust scrollTop
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !prevScrollData.current) return;
    const { scrollTop, totalHeight } = prevScrollData.current;
    const newTotalHeight = container.scrollHeight;
    const diff = newTotalHeight - totalHeight;
    if (diff > 0) {
      container.scrollTop = scrollTop + diff;
    }
    prevScrollData.current = null;
  }, [posts]);

  // Detect scroll boundaries for infinite loading
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Near bottom
      if (scrollHeight - scrollTop - clientHeight < 500) {
        loadNext();
      }
      // Near top
      if (scrollTop < 500) {
        loadPrev();
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [loadNext, loadPrev]);

  const totalSize = virtualizer.getTotalSize();
  const virtualItems = virtualizer.getVirtualItems();

  if (!initialLoaded) {
    return (
      <div className="feed-container py-4 space-y-2 px-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <PostPlaceholder key={i} />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      data-test-id="scroll-container"
      className="h-screen overflow-y-auto"
    >
      <div className="feed-container px-4 py-4">
        {loadingPrev && (
          <div className="space-y-2 mb-2">
            <PostPlaceholder />
            <PostPlaceholder />
          </div>
        )}
        <div
          data-test-id="sizer-element"
          className="relative w-full"
          style={{ height: totalSize }}
        >
          {virtualItems.map((virtualRow) => {
            const post = posts[virtualRow.index];
            if (!post) return null;
            return (
              <div
                key={post.id}
                ref={(el) => measureRef(el, virtualRow.index)}
                data-index={virtualRow.index}
                className="absolute left-0 w-full"
                style={{
                  top: virtualRow.start,
                }}
              >
                <div
                  className="pb-2"
                  {...{ 'data-test-id': `post-item-${post.id}` } as any}
                >
                  <PostItem post={post} />
                </div>
              </div>
            );
          })}
        </div>
        {loadingNext && (
          <div className="space-y-2 mt-2">
            <PostPlaceholder />
            <PostPlaceholder />
          </div>
        )}
      </div>
    </div>
  );
}
