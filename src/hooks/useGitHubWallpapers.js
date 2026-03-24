import { useEffect, useState } from 'react';

const GITHUB_TREE_URL =
  'https://api.github.com/repos/revanthlol/wallpapers/git/trees/main?recursive=1';
const RAW_BASE_URL = 'https://raw.githubusercontent.com/revanthlol/wallpapers/main/';
const THUMBNAIL_BASE_URL = 'https://wsrv.nl/';

const imagePattern = /\.(jpg|jpeg|png|webp)$/i;

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
        const response = await fetch(GITHUB_TREE_URL, {
          signal: controller.signal,
          headers: {
            Accept: 'application/vnd.github+json',
          },
        });

        if (!response.ok) {
          throw new Error(`GitHub request failed with status ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data.tree)) {
          throw new Error('GitHub response did not include a valid tree.');
        }

        const processed = data.tree
          .filter((item) => imagePattern.test(item.path))
          .map((img) => {
            const parts = img.path.split('/');
            const folder = parts.length > 1 ? parts[0] : 'Others';
            const name = parts[parts.length - 1];
            const rawUrl = `${RAW_BASE_URL}${img.path}`;

            return {
              id: img.sha,
              name,
              folder,
              rawUrl,
              thumbnail: `${THUMBNAIL_BASE_URL}?url=${encodeURIComponent(rawUrl)}&w=400&q=75&output=webp`,
            };
          })
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
