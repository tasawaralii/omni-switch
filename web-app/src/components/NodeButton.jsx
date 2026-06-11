const NodeButton = ({ id, node, setSelectedConfigNodeId }) => {
    return (
        <button
            key={id}
            onClick={() => setSelectedConfigNodeId(id)}
            className="w-full p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl flex justify-between items-center text-left active:scale-99 transition-all shadow-md group"
        >
            <div>
                <h3 className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors text-base">{node.name}</h3>
                <div className="flex gap-2 mt-1.5">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded uppercase font-semibold">{id}</span>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Cap: {node.pin_capacity} Relays</span>
                </div>
            </div>
            <span className="text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">Configure →</span>
        </button>
    )
}

export default NodeButton;