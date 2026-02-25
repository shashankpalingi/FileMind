import React, { useState, useEffect, useMemo, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { getClusters } from '../../api';
import { Share2, Maximize2, RefreshCw, ZoomIn, ZoomOut, Target } from 'lucide-react';

const GraphViewer = () => {
    const [clusters, setClusters] = useState({});
    const [loading, setLoading] = useState(true);
    const [highlightNodes, setHighlightNodes] = useState(new Set());
    const [highlightLinks, setHighlightLinks] = useState(new Set());
    const [hoverNode, setHoverNode] = useState(null);
    const fgRef = useRef();

    const fetchClusters = async () => {
        try {
            const res = await getClusters();
            setClusters(res.data?.clusters || {});
        } catch (err) {
            console.error('Graph fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClusters();
        const interval = setInterval(fetchClusters, 10000);
        return () => clearInterval(interval);
    }, []);

    // Transform hierarchical data into { nodes, links }
    const graphData = useMemo(() => {
        const nodes = [];
        const links = [];

        // Dynamic color palette for clusters
        const clusterColors = [
            '#3b82f6', // blue
            '#a855f7', // purple
            '#10b981', // emerald
            '#f59e0b', // amber
            '#ef4444', // red
            '#06b6d4', // cyan
            '#f472b6', // pink
        ];

        let colorIdx = 0;

        Object.entries(clusters).forEach(([clusterId, data]) => {
            const color = clusterColors[colorIdx % clusterColors.length];
            colorIdx++;

            const files = Object.keys(data.files || {});

            // Add nodes
            files.forEach(filePath => {
                const fileName = filePath.split('/').pop();
                nodes.push({
                    id: filePath,
                    name: fileName,
                    cluster: data.label || clusterId,
                    color: color,
                    val: 1 // default size
                });
            });

            // Add links between files in the same cluster (creating a cohesive group)
            if (files.length > 1) {
                for (let i = 0; i < files.length; i++) {
                    for (let j = i + 1; j < files.length; j++) {
                        links.push({
                            source: files[i],
                            target: files[j],
                            color: `${color}33`, // faint color for cluster links
                        });
                    }
                }
            }
        });

        return { nodes, links };
    }, [clusters]);

    const handleNodeHover = node => {
        highlightNodes.clear();
        highlightLinks.clear();
        if (node) {
            highlightNodes.add(node);
            graphData.links.forEach(link => {
                if (link.source.id === node.id || link.target.id === node.id) {
                    highlightLinks.add(link);
                    highlightNodes.add(link.source);
                    highlightNodes.add(link.target);
                }
            });
        }

        setHoverNode(node || null);
        setHighlightNodes(new Set(highlightNodes));
        setHighlightLinks(new Set(highlightLinks));
    };

    const handleZoomToFit = () => {
        if (fgRef.current) {
            fgRef.current.zoomToFit(400);
        }
    };

    return (
        <div className="glass-card flex-1 flex flex-col min-h-0 overflow-hidden relative group/graph">
            {/* Header / Controls */}
            <div className="flex items-center justify-between p-4 shrink-0 border-b border-white/5 bg-slate-900/40 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
                        <Share2 size={16} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-200 tracking-tight">Semantic Mind Map</h2>
                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Force-Directed Relationships</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleZoomToFit}
                        className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all"
                        title="Zoom to Fit"
                    >
                        <Target size={16} />
                    </button>
                    <button
                        onClick={() => fetchClusters()}
                        className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all"
                        title="Refresh"
                    >
                        {loading ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    </button>
                </div>
            </div>

            {/* Graph Visualization */}
            <div className="flex-1 bg-slate-950/50 relative min-h-0">
                {graphData.nodes.length === 0 && !loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 italic">
                        No semantic data to map yet
                    </div>
                ) : (
                    <ForceGraph2D
                        ref={fgRef}
                        graphData={graphData}
                        nodeLabel={node => `
                            <div class="px-3 py-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl">
                                <div class="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">${node.cluster}</div>
                                <div class="text-sm font-bold text-white">${node.name}</div>
                                <div class="text-[9px] text-slate-500 mt-1 truncate max-w-[150px]">${node.id}</div>
                            </div>
                        `}
                        nodeRelSize={6}
                        nodeColor={node => highlightNodes.has(node) ? '#fff' : node.color}
                        linkColor={link => highlightLinks.has(link) ? '#60a5fa' : link.color}
                        linkWidth={link => highlightLinks.has(link) ? 2 : 1}
                        onNodeHover={handleNodeHover}
                        cooldownTicks={100}
                        d3AlphaDecay={0.02}
                        d3VelocityDecay={0.3}
                        backgroundColor="rgba(0,0,0,0)"
                    />
                )}

                {/* Floating Legend */}
                <div className="absolute bottom-4 left-4 p-3 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/5 flex flex-col gap-2 pointer-events-none text-[10px] z-10 transition-opacity opacity-0 group-hover/graph:opacity-100">
                    <div className="text-slate-500 font-bold uppercase tracking-widest mb-1">Visual Guide</div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-slate-300">Node = File</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-0.5 bg-blue-500/20" />
                        <span className="text-slate-400">Link = Semantic Bond</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-white" />
                        <span className="text-slate-300">Hover = Highlight Group</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GraphViewer;
