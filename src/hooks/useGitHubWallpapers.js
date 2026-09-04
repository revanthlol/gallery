import { useEffect, useState } from 'react';

const WALLPAPER_SOURCES = [
  {
    key: 'wallpapers',
    branch: 'main',
    label: 'Wallpapers',
    owner: 'revanthlol',
    repo: 'wallpapers',
  },
  {
    key: 'ani-wp',
    branch: 'main',
    label: 'Ani Wallpapers',
    owner: 'revanthlol',
    repo: 'ani-wp',
  },
];
const THUMBNAIL_BASE_URL = 'https://wsrv.nl/';

const imagePattern = /\.(jpg|jpeg|png|webp)$/i;

const buildTreeUrl = (source) =>
  `https://api.github.com/repos/${source.owner}/${source.repo}/git/trees/${source.branch}?recursive=1`;

const buildRawUrl = (source, path) =>
  `https://raw.githubusercontent.com/${source.owner}/${source.repo}/${source.branch}/${path}`;

export const useGitHubWallpapers = () => {
  const [wallpapers, setWallpapers] = useState([]);
  const [folders, setFolders] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const fetchRepo = async () => {
      setLoading(true);
      setError('');

      try {
        const sourceTrees = await Promise.all(
          WALLPAPER_SOURCES.map(async (source) => {
            const response = await fetch(buildTreeUrl(source), {
              signal: controller.signal,
              headers: {
                Accept: 'application/vnd.github+json',
              },
            });

            if (!response.ok) {
              throw new Error(`${source.repo} request failed with status ${response.status}`);
            }

            const data = await response.json();

            if (!Array.isArray(data.tree)) {
              throw new Error(`${source.repo} response did not include a valid tree.`);
            }

            return { source, tree: data.tree };
          }),
        );

        const processed = sourceTrees
          .flatMap(({ source, tree }) =>
            tree.filter((item) => imagePattern.test(item.path)).map((img) => {
              const parts = img.path.split('/');
              const repoFolder = parts.length > 1 ? parts[0] : 'Others';
              const name = parts[parts.length - 1];
              const rawUrl = buildRawUrl(source, img.path);
              const folder = `${source.label} / ${repoFolder}`;

              return {
                id: `${source.key}-${img.sha}`,
                name,
                folder,
                rawUrl,
                source: source.label,
                thumbnail: `${THUMBNAIL_BASE_URL}?url=${encodeURIComponent(rawUrl)}&w=400&q=75&output=webp`,
              };
            }),
          )
          .sort((a, b) => a.folder.localeCompare(b.folder) || a.name.localeCompare(b.name));

        const uniqueFolders = [
          'All',
          ...new Set(processed.map((item) => item.folder).sort((a, b) => a.localeCompare(b))),
        ];

        setWallpapers(processed);
        setFolders(uniqueFolders);
      } catch (error) {
        if (error.name === 'AbortError') return;

        setWallpapers([]);
        setFolders(['All']);
        setError(error.message || 'Unable to load wallpapers.');
        console.error('Fetch error:', error);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchRepo();

    return () => controller.abort();
  }, []);

  return { wallpapers, folders, loading, error };
};
