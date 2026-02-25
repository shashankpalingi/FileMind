import React, { useState, useEffect } from 'react';
import { getClusters, triggerRecluster } from '../../api';
import { FolderTree, FileText, ChevronRight, ChevronDown, RefreshCw, Link2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StabilityBadge = ({ score }) => {
    let color, bg, label;
    if (score >= 0.7) {
        color = 'text-emerald-400'; bg = 'bg-emerald-500/10'; label = '🟢';
    } else if (score >= 0.4) {
        color = 'text-amber-400'; bg = 'bg-amber-500/10'; label = '🟡';
    } else {
        color = 'text-red-400'; bg = 'bg-red-500/10'; label = '🔴';
    }
    return (
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${bg} ${color} font-mono font-bold`}
            title={`Cluster stability: ${(score * 100).toFixed(0)}%`}>
            {label} {(score * 100).toFixed(0)}%
        </span>
    );
};

const ConfidenceBadge = ({ score }) => {
    const pct = (score * 100).toFixed(0);
    let color;
    if (score >= 0.7) color = 'text-emerald-400';
    else if (score >= 0.4) color = 'text-amber-400';
    else color = 'text-red-400';

    return (
        <span className={`text-[9px] ${color} font-mono font-bold shrink-0`}
            title={`Confidence: ${pct}%`}>
            {pct}%
        </span>
    );
};

const ClusterViewer = () => {
    const [clusters, setClusters] = useState({});
    const [bridgeFiles, setBridgeFiles] = useState({});
    const [openClusters, setOpenClusters] = useState({});
    const [reclustering, setReclustering] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchClusters = async () => {
        try {
            const res = await getClusters();
            const data = res.data || {};
            setClusters(data.clusters || {});
            setBridgeFiles(data.bridge_files || {});
            // Open first cluster by default if it exists and no others are open
            const clusterKeys = Object.keys(data.clusters || {});
            if (clusterKeys.length > 0 && Object.keys(openClusters).length === 0) {
                setOpenClusters({ [clusterKeys[0]]: true });
            }
        } catch (err) {
            console.error('Cluster fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClusters();
        const interval = setInterval(fetchClusters, 8000);
        return () => clearInterval(interval);
    }, []);

    const toggleCluster = (id) => {
        setOpenClusters(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const isBridgeFile = (filePath) => {
        return filePath in bridgeFiles;
    };

    const getBridgeInfo = (filePath) => {
        return bridgeFiles[filePath] || null;
    };

    const handleRecluster = async () => {
        setReclustering(true);
        try {
            await triggerRecluster();
            await fetchClusters();
        } catch (err) {
            console.error('Recluster error:', err);
        } finally {
            setReclustering(false);
        }
    };

    return (
        <div className="glass-card flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between shrink-0">
                <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-400 uppercase tracking-widest">
                    <FolderTree size={16} className="text-purple-400" />
                    Semantic Folders
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRecluster}
                        disabled={reclustering || Object.keys(clusters).length === 0}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        title="Re-organize all files into optimal clusters"
                    >
                        {reclustering ? (
                            <><RefreshCw size={10} className="animate-spin" /> Optimizing...</>
                        ) : (
                            <><Sparkles size={10} /> Re-cluster</>
                        )}
                    </button>
                    {loading && <RefreshCw size={12} className="animate-spin text-slate-600" />}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0 space-y-2">
                {Object.keys(clusters).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 italic py-12 text-sm">
                        No clusters found yet
                    </div>
                ) : (
                    Object.entries(clusters).map(([id, data]) => (
                        <div key={id} className="rounded-xl border border-white/5 bg-white/2 overflow-hidden transition-all duration-200">
                            <button
                                onClick={() => toggleCluster(id)}
                                className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors text-left group"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="text-purple-400 shrink-0">
                                        {openClusters[id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </div>
                                    <span className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                                        {data.label || id}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <StabilityBadge score={data.stability_score || 0} />
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-mono font-bold">
                                        {Object.keys(data.files || {}).length}
                                    </span>
                                </div>
                            </button>

                            <AnimatePresence initial={false}>
                                {openClusters[id] && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="px-3 pb-3 pt-1 space-y-1 ml-4 border-l border-white/5">
                                            {Object.keys(data.files || {}).length === 0 ? (
                                                <div className="text-[11px] text-slate-600 italic py-1">No files in this cluster</div>
                                            ) : (
                                                Object.keys(data.files).map((filePath) => {
                                                    const scores = (data.file_scores || {})[filePath] || {};
                                                    const bridge = isBridgeFile(filePath);
                                                    const bridgeInfo = getBridgeInfo(filePath);

                                                    return (
                                                        <div
                                                            key={filePath}
                                                            className="flex items-center gap-2 text-[12px] text-slate-400 p-1.5 rounded-lg hover:bg-white/5 group/file relative"
                                                            title={scores.placement_reason || filePath}
                                                        >
                                                            {bridge ? (
                                                                <Link2 size={12} className="text-amber-400 shrink-0"
                                                                    title={`Bridge file: also related to ${bridgeInfo?.secondary_label || '?'}`} />
                                                            ) : (
                                                                <FileText size={12} className="text-slate-600 shrink-0" />
                                                            )}
                                                            <span className="truncate flex-1">
                                                                {filePath.split('/').pop()}
                                                            </span>
                                                            <ConfidenceBadge score={scores.confidence || 0} />

                                                            {/* Explainability tooltip on hover */}
                                                            {scores.placement_reason && (
                                                                <div className="absolute left-0 -top-8 hidden group-hover/file:block z-50 pointer-events-none">
                                                                    <div className="bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-slate-300 shadow-xl whitespace-nowrap max-w-[280px] truncate">
                                                                        {scores.placement_reason}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ClusterViewer;
