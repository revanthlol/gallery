import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  FolderIcon, 
  ArrowDownTrayIcon, 
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ViewColumnsIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3BottomLeftIcon,
  Bars3Icon,
  MinusIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useGitHubWallpapers } from './hooks/useGitHubWallpapers';

// --- Github Link Component ---
const GithubLink = ({ collapsed }) => (
  <a 
    href="https://github.com/revanthlol/gallery" 
    target="_blank"
    className={`mt-2 mb-2 flex items-center justify-center gap-3 p-2.5 rounded-xl bg-[#121212] border border-white/5 text-zinc-500 hover:text-white hover:bg-white/10 transition-all ${collapsed ? 'aspect-square mx-auto w-10' : 'mx-4'}`}
    title="View on GitHub"
  >
    <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 98 96" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" />
    </svg>
    {!collapsed && <span className="text-xs font-semibold">Source Code</span>}
  </a>
);

// --- Transition Variants for Slide Effect ---
const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 500 : -500,
    opacity: 0,
    scale: 0.9,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? 500 : -500,
    opacity: 0,
    scale: 0.9,
  }),
};

// --- Wallpaper Card ---
const WallpaperCard = ({ wallpaper, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    onClick={() => onClick(wallpaper)}
    className="mb-6 break-inside-avoid group relative rounded-xl overflow-hidden bg-[#121212] border border-white/5 cursor-zoom-in shadow-sm hover:shadow-indigo-500/10 hover:border-white/10 transition-all duration-300"
  >
    <div className="w-full bg-[#18181b]">
      <img
        src={wallpaper.thumbnail}
        alt={wallpaper.name}
        className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
        loading="lazy" 
      />
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    <div className="absolute bottom-0 inset-x-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
       <p className="text-white font-bold text-xs truncate drop-shadow-md">{wallpaper.name}</p>
    </div>
  </motion.div>
);

export default function App() {
  const { wallpapers, folders, loading } = useGitHubWallpapers();
  const [selectedFolder, setSelectedFolder] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [selectedImage, setSelectedImage] = useState(null);
  const [direction, setDirection] = useState(0); // For slide animations
  
  // Layout State
  const [denseLayout, setDenseLayout] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Filter
  const filteredItems = useMemo(() => {
    let result = wallpapers;
    if (selectedFolder !== 'All') result = result.filter(w => w.folder === selectedFolder);
    if (searchQuery) result = result.filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return result;
  }, [wallpapers, selectedFolder, searchQuery]);

  // Handle Keyboard
  useEffect(() => {
    if (!selectedImage) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeImage();
      if (e.key === 'ArrowRight') changeImage(1);
      if (e.key === 'ArrowLeft') changeImage(-1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, filteredItems]);

  const changeImage = (newDirection) => {
    setDirection(newDirection);
    setZoomLevel(1); // Reset zoom on slide
    
    const currentIndex = filteredItems.findIndex(i => i.id === selectedImage.id);
    if (currentIndex === -1) return;

    let newIndex = currentIndex + newDirection;
    if (newIndex >= filteredItems.length) newIndex = 0;
    if (newIndex < 0) newIndex = filteredItems.length - 1;

    setSelectedImage(filteredItems[newIndex]);
  };

  const closeImage = () => {
    setSelectedImage(null);
    setZoomLevel(1);
    setDirection(0);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleZoom = (val) => {
    // Clamping Zoom between 1 and 4
    setZoomLevel(prev => Math.min(Math.max(1, prev + val), 4));
  };

  return (
    <div className="flex h-screen bg-[#050505] text-[#e4e4e7] font-sans overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <motion.aside 
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="bg-[#09090b] border-r border-white/5 flex flex-col z-20 h-full shrink-0 relative transition-width duration-300 ease-[0.2,0,0,1]"
      >
        <div className="flex flex-col h-full relative">
            
            {/* Logo Area */}
            <div className={`flex items-center h-16 shrink-0 border-b border-white/5 mx-4 ${sidebarOpen ? 'gap-3 px-2' : 'justify-center'}`}>
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(79,70,229,0.4)]">
                    <Squares2X2Icon className="w-5 h-5 text-white" />
                </div>
                {sidebarOpen && (
                    <span className="font-bold text-lg tracking-tight text-white whitespace-nowrap overflow-hidden">
                      Gallery
                    </span>
                )}
            </div>

            {/* Navigation List */}
            <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-3">
                <button
                    onClick={() => { setSelectedFolder('All'); setSearchQuery(''); }}
                    className={`flex items-center h-11 rounded-xl transition-all ${
                      sidebarOpen ? 'px-4 justify-start gap-3 w-full' : 'justify-center w-full'
                    } ${selectedFolder === 'All' ? 'bg-white/10 text-white shadow-inner' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                    title="All Wallpapers"
                >
                    <Squares2X2Icon className="w-5 h-5 shrink-0" />
                    {sidebarOpen && <span className="text-sm font-medium whitespace-nowrap">All Wallpapers</span>}
                </button>

                {sidebarOpen && <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-6 mb-3 pl-4">Collections</div>}
                
                {folders.filter(f => f !== 'All').map(folder => (
                    <button
                        key={folder}
                        onClick={() => { setSelectedFolder(folder); setSearchQuery(''); }}
                        className={`flex items-center h-11 rounded-xl transition-all group ${
                        sidebarOpen ? 'px-4 justify-start gap-3 w-full' : 'justify-center w-full'
                        } ${selectedFolder === folder ? 'bg-white/10 text-white font-medium' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                        title={folder}
                    >
                        <FolderIcon className={`w-5 h-5 shrink-0 transition-colors ${selectedFolder === folder ? 'text-indigo-400' : 'text-zinc-600'}`} />
                        {sidebarOpen && <span className="text-sm truncate">{folder}</span>}
                    </button>
                ))}
            </nav>
            
            {/* Footer with Toggle & Github */}
            <div className="p-3 border-t border-white/5 bg-[#09090b]">
               <GithubLink collapsed={!sidebarOpen} />
               <button 
                  onClick={toggleSidebar}
                  className={`w-full flex items-center h-10 rounded-xl hover:bg-white/5 text-zinc-600 transition-colors ${!sidebarOpen && 'justify-center'}`}
               >
                   {sidebarOpen ? (
                       <div className="flex items-center gap-3 px-4">
                           <Bars3BottomLeftIcon className="w-5 h-5" />
                           <span className="text-xs font-semibold">Collapse Menu</span>
                       </div>
                   ) : (
                       <Bars3Icon className="w-5 h-5" />
                   )}
               </button>
            </div>
        </div>
      </motion.aside>

      {/* --- MAIN AREA --- */}
      <main className="flex-1 h-full flex flex-col relative bg-[#050505] overflow-hidden">
         {/* HEADER */}
         <div className="absolute top-0 inset-x-0 z-10 px-6 pt-6 pb-6 bg-gradient-to-b from-[#050505] to-transparent pointer-events-none">
             <div className="flex gap-4 p-1.5 rounded-2xl bg-[#09090b]/80 backdrop-blur-xl border border-white/10 shadow-2xl max-w-5xl mx-auto pointer-events-auto">
                 <div className="flex-1 flex items-center gap-3 px-4 bg-white/5 rounded-xl border border-white/5 focus-within:bg-white/10 transition-colors h-11 group">
                    <MagnifyingGlassIcon className="w-4 h-4 text-zinc-500 group-focus-within:text-white" />
                    <input 
                       type="text"
                       placeholder="Search Library..."
                       className="bg-transparent border-none outline-none text-sm text-white w-full h-full placeholder-zinc-500"
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="p-1 hover:text-white text-zinc-500"><XMarkIcon className="w-4 h-4" /></button>
                    )}
                 </div>

                 <div className="flex items-center gap-1 border-l border-white/10 pl-2">
                     <button onClick={() => setDenseLayout(false)} className={`p-2.5 rounded-xl ${!denseLayout ? 'bg-white/10 text-white' : 'text-zinc-600 hover:text-white'}`}>
                       <Squares2X2Icon className="w-5 h-5" />
                     </button>
                     <button onClick={() => setDenseLayout(true)} className={`p-2.5 rounded-xl ${denseLayout ? 'bg-white/10 text-white' : 'text-zinc-600 hover:text-white'}`}>
                       <ViewColumnsIcon className="w-5 h-5" />
                     </button>
                 </div>
             </div>
         </div>

         {/* GRID SCROLL */}
         <div className="flex-1 overflow-y-auto scroll-smooth pt-28 px-4 md:px-8 pb-32">
             {loading ? (
                <div className="flex items-center justify-center h-full text-zinc-500 gap-3">
                   <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                   <span className="text-xs uppercase tracking-widest">Loading Assets...</span>
                </div>
             ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[50vh] text-zinc-500 opacity-60">
                   <FolderIcon className="w-16 h-16 mb-4 stroke-1" />
                   <p>No matches found.</p>
                </div>
             ) : (
                <div 
                  className={`
                     masonry-grid w-full max-w-[1920px] mx-auto
                     columns-1 sm:columns-2 gap-6
                     ${denseLayout ? 'md:columns-4 lg:columns-5' : 'md:columns-3 lg:columns-4'}
                  `}
                >
                  {filteredItems.map(wallpaper => (
                     <WallpaperCard key={wallpaper.id} wallpaper={wallpaper} onClick={setSelectedImage} />
                  ))}
                </div>
             )}
         </div>
      </main>

      {/* --- PREVIEW OVERLAY --- */}
      <AnimatePresence>
        {selectedImage && (
           <motion.div 
             initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
             animate={{ opacity: 1, backdropFilter: "blur(40px)" }}
             exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
             transition={{ duration: 0.3 }}
             className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80"
             onClick={closeImage}
             onWheel={(e) => {
                 if (e.ctrlKey) handleZoom(e.deltaY > 0 ? -0.5 : 0.5); // Ctrl+Scroll
             }}
           >
              {/* IMAGE CANVAS */}
              <div 
                 className="absolute inset-0 flex items-center justify-center overflow-hidden z-10"
              >
                 <AnimatePresence initial={false} custom={direction}>
                    <motion.img 
                       key={selectedImage.id} // Forces swap animation
                       src={selectedImage.rawUrl}
                       custom={direction}
                       variants={slideVariants}
                       initial="enter"
                       animate="center"
                       exit="exit"
                       transition={{
                         x: { type: "spring", stiffness: 300, damping: 30 },
                         opacity: { duration: 0.2 }
                       }}
                       drag={zoomLevel > 1}
                       dragConstraints={{ left: -800, right: 800, top: -800, bottom: 800 }}
                       onClick={(e) => e.stopPropagation()}
                       style={{ 
                          scale: zoomLevel,
                          maxHeight: '90vh',
                          maxWidth: '95vw', 
                          objectFit: 'contain'
                       }}
                       className="cursor-default shadow-2xl"
                    />
                 </AnimatePresence>
              </div>

              {/* UI LAYER (Floating) */}
              <div className="absolute inset-0 z-50 pointer-events-none flex flex-col justify-between p-6">
                 
                 {/* Top Controls */}
                 <div className="flex justify-between items-start">
                     <div className="bg-[#121212]/50 backdrop-blur-md border border-white/5 rounded-2xl px-5 py-3 pointer-events-auto">
                        <h2 className="text-white font-bold drop-shadow-md truncate max-w-md">{selectedImage.name}</h2>
                        <span className="text-xs text-zinc-400 font-mono uppercase">{selectedImage.folder}</span>
                     </div>
                     <button onClick={closeImage} className="p-3 bg-[#121212]/50 hover:bg-white/10 rounded-full border border-white/5 pointer-events-auto backdrop-blur-md text-white transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                     </button>
                 </div>

                 {/* Bottom Controls */}
                 <div className="flex justify-center items-center gap-6 pb-6 pointer-events-auto">
                     <button onClick={(e) => { e.stopPropagation(); changeImage(-1); }} className="p-4 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-md transition-transform hover:scale-105 active:scale-95 group">
                        <ChevronLeftIcon className="w-6 h-6 text-zinc-400 group-hover:text-white" />
                     </button>

                     <div className="flex items-center gap-6 bg-[#121212]/60 backdrop-blur-2xl px-6 py-3 rounded-2xl border border-white/10 shadow-2xl">
                         <div className="flex items-center gap-2">
                             <button onClick={(e) => { e.stopPropagation(); handleZoom(-0.5) }} className="p-1 hover:text-white text-zinc-400"><MinusIcon className="w-5 h-5"/></button>
                             <span className="w-10 text-center text-sm font-mono text-zinc-300">{Math.round(zoomLevel*100)}%</span>
                             <button onClick={(e) => { e.stopPropagation(); handleZoom(0.5) }} className="p-1 hover:text-white text-zinc-400"><PlusIcon className="w-5 h-5"/></button>
                         </div>
                         <div className="w-px h-6 bg-white/10" />
                         <a href={selectedImage.rawUrl} download target="_blank" onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold text-sm">
                             <ArrowDownTrayIcon className="w-5 h-5" /> <span className="hidden sm:inline">Original</span>
                         </a>
                     </div>

                     <button onClick={(e) => { e.stopPropagation(); changeImage(1); }} className="p-4 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-md transition-transform hover:scale-105 active:scale-95 group">
                        <ChevronRightIcon className="w-6 h-6 text-zinc-400 group-hover:text-white" />
                     </button>
                 </div>
              </div>

           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
