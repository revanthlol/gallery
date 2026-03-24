import { createElement, memo, startTransition, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  Squares2X2Icon,
  ViewColumnsIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useGitHubWallpapers } from './hooks/useGitHubWallpapers';

const APP_REPO_URL = 'https://github.com/revanthlol/gallery';
const WALLPAPER_REPO_URL = 'https://github.com/revanthlol/wallpapers';
const LOADING_MESSAGES = [
  'Curating pixels so you do not have to.',
  'Fun fact: darker wallpapers usually hide icon clutter better.',
  'Loading images, not summoning them from the void.',
  'A clean wallpaper is desktop hygiene with style.',
  'Preheating the gallery for smoother scrolling.',
];

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 180 : -180,
    opacity: 0,
    scale: 0.97,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction) => ({
    x: direction < 0 ? 180 : -180,
    opacity: 0,
    scale: 0.97,
  }),
};

function preloadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = resolve;
    image.src = src;
    if (image.complete) resolve();
  });
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const updateMatches = (event) => setMatches(event.matches);
    mediaQuery.addEventListener('change', updateMatches);
    return () => mediaQuery.removeEventListener('change', updateMatches);
  }, [query]);

  return matches;
}

const RepoButton = memo(function RepoButton({ href, icon, label, subtitle }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="repo-button">
      <span className="repo-button__icon">{createElement(icon, { className: 'h-4 w-4' })}</span>
      <span>
        <span className="repo-button__label">{label}</span>
        <span className="repo-button__subtitle">{subtitle}</span>
      </span>
    </a>
  );
});

const SidebarButton = memo(function SidebarButton({ active, icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`sidebar-button ${active ? 'sidebar-button-active' : ''}`}
      title={label}
    >
      {createElement(icon, { className: 'h-4 w-4 shrink-0' })}
      <span className="truncate">{label}</span>
    </button>
  );
});

const IconButton = memo(function IconButton({ active = false, icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`icon-button ${active ? 'icon-button-active' : ''}`}
      aria-label={label}
      title={label}
    >
      {createElement(icon, { className: 'h-4 w-4' })}
    </button>
  );
});

const LoadingOverlay = memo(function LoadingOverlay({ message }) {
  return (
    <Motion.div
      className="loading-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <div className="loading-minimal">
        <div className="loading-minimal__spinner" aria-hidden="true" />
        <span>{message}</span>
      </div>
    </Motion.div>
  );
});

const WallpaperCard = memo(function WallpaperCard({ isMobile, onClick, wallpaper }) {
  const [thumbnailSrc, setThumbnailSrc] = useState(wallpaper.thumbnail);

  return (
    <Motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      onClick={() => onClick(wallpaper)}
      className="wallpaper-card"
    >
      <a
        href={wallpaper.rawUrl}
        download
        target="_blank"
        rel="noreferrer"
        onClick={(event) => event.stopPropagation()}
        className={`wallpaper-card__download ${isMobile ? 'wallpaper-card__download-visible' : ''}`}
        aria-label={`Download ${wallpaper.name}`}
        title="Download wallpaper"
      >
        <ArrowDownTrayIcon className="h-4 w-4" />
      </a>
      <img
        src={thumbnailSrc}
        alt={wallpaper.name}
        className="wallpaper-card__image"
        loading="lazy"
        decoding="async"
        onError={() => {
          if (thumbnailSrc !== wallpaper.rawUrl) {
            setThumbnailSrc(wallpaper.rawUrl);
          }
        }}
      />
      <span className="wallpaper-card__veil" />
      <span className="wallpaper-card__meta">
        <span className="wallpaper-card__title">{wallpaper.name}</span>
        <span className="wallpaper-card__folder">{wallpaper.folder}</span>
      </span>
    </Motion.button>
  );
});

function SidebarContent({ collapsed, folders, onSelectFolder, selectedFolder }) {
  return (
    <>
      <div className={`sidebar-brand ${collapsed ? 'sidebar-brand-collapsed' : ''}`}>
        <img src="/favicon.svg" alt="" className="sidebar-brand__logo" />
        {!collapsed && (
          <div>
            <div className="sidebar-brand__title">Gallery</div>
            <div className="sidebar-brand__subtitle">Minimal wallpaper browser</div>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        <SidebarButton
          active={selectedFolder === 'All'}
          icon={Squares2X2Icon}
          label="All Wallpapers"
          onClick={() => onSelectFolder('All')}
        />
        {!collapsed && <div className="sidebar-section-label">Collections</div>}
        {folders
          .filter((folder) => folder !== 'All')
          .map((folder) => (
            <SidebarButton
              key={folder}
              active={selectedFolder === folder}
              icon={FolderIcon}
              label={folder}
              onClick={() => onSelectFolder(folder)}
            />
          ))}
      </nav>

      <div className={`sidebar-actions ${collapsed ? 'sidebar-actions-collapsed' : ''}`}>
        <RepoButton
          href={APP_REPO_URL}
          icon={ArrowTopRightOnSquareIcon}
          label="Source Code"
          subtitle="Application repository"
        />
        <RepoButton
          href={WALLPAPER_REPO_URL}
          icon={PhotoIcon}
          label="Wallpapers"
          subtitle="Wallpaper repository"
        />
      </div>
    </>
  );
}

export default function App() {
  const { wallpapers, folders, loading, error } = useGitHubWallpapers();
  const deferredWallpapers = useDeferredValue(wallpapers);
  const [selectedFolder, setSelectedFolder] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [direction, setDirection] = useState(0);
  const [denseLayout, setDenseLayout] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loadedSampleKey, setLoadedSampleKey] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const isMobile = useMediaQuery('(max-width: 900px)');
  const sampleSources = useMemo(
    () => wallpapers.slice(0, 18).map((wallpaper) => wallpaper.thumbnail),
    [wallpapers],
  );
  const sampleKey = sampleSources.join('|');

  const filteredItems = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();
    let result = deferredWallpapers;

    if (selectedFolder !== 'All') {
      result = result.filter((wallpaper) => wallpaper.folder === selectedFolder);
    }

    if (query) {
      result = result.filter((wallpaper) => wallpaper.name.toLowerCase().includes(query));
    }

    return result;
  }, [deferredSearchQuery, deferredWallpapers, selectedFolder]);

  const selectedImage = useMemo(() => {
    if (!selectedImageId) return null;
    return filteredItems.find((wallpaper) => wallpaper.id === selectedImageId) ?? null;
  }, [filteredItems, selectedImageId]);

  const selectedImageIndex = useMemo(() => {
    if (!selectedImage) return -1;
    return filteredItems.findIndex((wallpaper) => wallpaper.id === selectedImage.id);
  }, [filteredItems, selectedImage]);

  const showLoadingOverlay = loading || (!error && sampleSources.length > 0 && loadedSampleKey !== sampleKey);

  useEffect(() => {
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.style.colorScheme = 'dark';
  }, []);

  useEffect(() => {
    if (!showLoadingOverlay) return undefined;
    const intervalId = window.setInterval(() => {
      setLoadingMessageIndex((value) => (value + 1) % LOADING_MESSAGES.length);
    }, 1800);

    return () => window.clearInterval(intervalId);
  }, [showLoadingOverlay]);

  useEffect(() => {
    if (!selectedImage) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedImage]);

  useEffect(() => {
    if (loading || error) return undefined;

    let cancelled = false;
    if (sampleSources.length === 0) return undefined;

    Promise.allSettled(sampleSources.map((src) => preloadImage(src))).then(() => {
      if (!cancelled) setLoadedSampleKey(sampleKey);
    });

    return () => {
      cancelled = true;
    };
  }, [error, loading, sampleKey, sampleSources]);

  const closeImage = () => {
    setSelectedImageId(null);
    setDirection(0);
    setPreviewLoading(false);
  };

  const openImage = (wallpaper) => {
    setSelectedImageId(wallpaper.id);
    setDirection(0);
    setPreviewLoading(true);
  };

  const changeImage = useCallback((nextDirection) => {
    if (filteredItems.length === 0) return;

    const currentIndex = selectedImageIndex === -1 ? 0 : selectedImageIndex;
    let nextIndex = currentIndex + nextDirection;

    if (nextIndex >= filteredItems.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = filteredItems.length - 1;

    setDirection(nextDirection);
    setPreviewLoading(true);
    setSelectedImageId(filteredItems[nextIndex].id);
  }, [filteredItems, selectedImageIndex]);

  const updateFolder = (folder) => {
    closeImage();
    if (isMobile) setMobileSidebarOpen(false);
    startTransition(() => {
      setSelectedFolder(folder);
      setSearchQuery('');
    });
  };

  const clearSearch = () => {
    closeImage();
    startTransition(() => setSearchQuery(''));
  };

  useEffect(() => {
    if (!selectedImage) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeImage();
      if (event.key === 'ArrowRight') changeImage(1);
      if (event.key === 'ArrowLeft') changeImage(-1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeImage, selectedImage]);

  return (
    <div className="app-shell">
      {isMobile && (
        <AnimatePresence>
          {mobileSidebarOpen && (
            <>
              <Motion.button
                type="button"
                className="mobile-sidebar-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileSidebarOpen(false)}
                aria-label="Close navigation"
              />
              <Motion.aside
                className="mobile-sidebar"
                initial={{ x: -24, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -24, opacity: 0 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
              >
                <SidebarContent
                  collapsed={false}
                  folders={folders}
                  onSelectFolder={updateFolder}
                  selectedFolder={selectedFolder}
                />
              </Motion.aside>
            </>
          )}
        </AnimatePresence>
      )}

      {!isMobile && (
        <aside className={`desktop-sidebar ${sidebarCollapsed ? 'desktop-sidebar-collapsed' : ''}`}>
          <SidebarContent
            collapsed={sidebarCollapsed}
            folders={folders}
            onSelectFolder={updateFolder}
            selectedFolder={selectedFolder}
          />
          <button
            type="button"
            className="sidebar-collapse"
            onClick={() => setSidebarCollapsed((value) => !value)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ArrowLeftIcon className={`h-4 w-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </aside>
      )}

      <main className="app-main">
        <section className="hero-panel">
          <div className="hero-panel__head">
            <div className="hero-panel__titlewrap">
              {isMobile && (
                <IconButton
                  icon={Bars3Icon}
                  label="Open menu"
                  onClick={() => setMobileSidebarOpen(true)}
                />
              )}
              <div>
                <p className="hero-panel__eyebrow">{filteredItems.length} wallpapers</p>
                <h1 className="hero-panel__title">Wallpaper gallery</h1>
              </div>
            </div>

            <div className="hero-panel__actions">
              <IconButton
                active={!denseLayout}
                icon={Squares2X2Icon}
                label="Comfortable grid"
                onClick={() => startTransition(() => setDenseLayout(false))}
              />
              <IconButton
                active={denseLayout}
                icon={ViewColumnsIcon}
                label="Dense grid"
                onClick={() => startTransition(() => setDenseLayout(true))}
              />
            </div>
          </div>

          <div className="hero-search">
            <MagnifyingGlassIcon className="h-4 w-4 text-[var(--muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => {
                if (selectedImageId) closeImage();
                startTransition(() => setSearchQuery(event.target.value));
              }}
              placeholder={`Search ${selectedFolder === 'All' ? 'wallpapers' : selectedFolder}`}
              className="hero-search__field"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="icon-button icon-button-subtle"
                aria-label="Clear search"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </section>

        <section className="gallery-panel">
          {error ? (
            <div className="empty-state">
              <XMarkIcon className="mb-4 h-10 w-10 text-[var(--muted)]" />
              <h2 className="empty-state__title">Unable to load wallpapers</h2>
              <p className="empty-state__body">{error}</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="empty-state">
              <FolderIcon className="mb-4 h-10 w-10 text-[var(--muted)]" />
              <h2 className="empty-state__title">No matches found</h2>
              <p className="empty-state__body">Try another collection or clear the search.</p>
            </div>
          ) : (
            <div
              className={`masonry-grid ${
                denseLayout ? 'columns-2 md:columns-3 xl:columns-4 2xl:columns-5' : 'columns-1 sm:columns-2 xl:columns-3 2xl:columns-4'
              }`}
            >
              {filteredItems.map((wallpaper) => (
                <WallpaperCard key={wallpaper.id} wallpaper={wallpaper} onClick={openImage} isMobile={isMobile} />
              ))}
            </div>
          )}
        </section>
      </main>

      <AnimatePresence>{showLoadingOverlay && <LoadingOverlay message={LOADING_MESSAGES[loadingMessageIndex]} />}</AnimatePresence>

      <AnimatePresence>
        {selectedImage && (
          <Motion.div
            className="preview-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={closeImage}
          >
            <div className="preview-shell preview-shell-plain" onClick={(event) => event.stopPropagation()}>
              <div className="preview-header preview-header-floating">
                <div>
                  <p className="preview-title">{selectedImage.name}</p>
                  <p className="preview-subtitle">{selectedImage.folder}</p>
                </div>
                <button type="button" className="icon-button" onClick={closeImage} aria-label="Close preview">
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="preview-stage">
                <button type="button" className="preview-nav" onClick={() => changeImage(-1)} aria-label="Previous wallpaper">
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>

                <div className="preview-image-wrap">
                  {previewLoading && (
                    <div className="preview-loading">
                      <div className="loading-minimal__spinner" aria-hidden="true" />
                      <span>{selectedImage.folder === 'Others' ? 'Hanging this one straight' : `Loading ${selectedImage.folder}`}</span>
                    </div>
                  )}
                  <AnimatePresence initial={false} custom={direction}>
                    <Motion.img
                      key={selectedImage.id}
                      src={selectedImage.rawUrl}
                      alt={selectedImage.name}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        x: { type: 'spring', stiffness: 280, damping: 28 },
                        opacity: { duration: 0.16 },
                      }}
                      onLoad={() => setPreviewLoading(false)}
                      onError={() => setPreviewLoading(false)}
                      style={{
                        maxHeight: '72vh',
                        maxWidth: 'min(94vw, 1280px)',
                        objectFit: 'contain',
                      }}
                      className={`preview-image ${previewLoading ? 'preview-image-loading' : ''}`}
                    />
                  </AnimatePresence>
                </div>

                <button type="button" className="preview-nav" onClick={() => changeImage(1)} aria-label="Next wallpaper">
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="preview-footer">
                <div className="preview-footnote">Original resolution download</div>
                <a href={selectedImage.rawUrl} download target="_blank" rel="noreferrer" className="repo-button repo-button-strong" onClick={(event) => event.stopPropagation()}>
                  <span className="repo-button__icon">
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="repo-button__label">Download original</span>
                    <span className="repo-button__subtitle">Full resolution asset</span>
                  </span>
                </a>
              </div>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
