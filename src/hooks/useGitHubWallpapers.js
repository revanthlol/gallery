import { useState, useEffect } from 'react';

export const useGitHubWallpapers = () => {
  const [wallpapers, setWallpapers] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRepo = async () => {
      try {
        const response = await fetch(
          'https://api.github.com/repos/revanthlol/wallpapers/git/trees/main?recursive=1'
        );
        const data = await response.json();
        
        if (!data.tree) return;

        // Filter valid images
        const images = data.tree.filter(item => 
          item.path.match(/\.(jpg|jpeg|png|webp)$/i)
        );

        const processed = images.map(img => {
          const parts = img.path.split('/');
          const folder = parts.length > 1 ? parts[0] : 'Others';
          const name = parts[parts.length - 1];
          const rawUrl = `https://raw.githubusercontent.com/revanthlol/wallpapers/main/${img.path}`;

          return {
            id: img.sha, 
            name: name,
            folder: folder,
            rawUrl: rawUrl,
            // FREE CDN Hack: optimizing images to 400px width WebP
            thumbnail: `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&w=400&q=75&output=webp`
          };
        });

        const uniqueFolders = ['All', ...new Set(processed.map(i => i.folder))];
        
        setWallpapers(processed);
        setFolders(uniqueFolders);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRepo();
  }, []);

  return { wallpapers, folders, loading };
};
