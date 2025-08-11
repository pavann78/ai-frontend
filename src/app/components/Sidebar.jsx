export default function Sidebar({ sidebarData, activeId, setActiveId }) {
    return (
        <aside className="w-64 bg-white text-black p-4 flex flex-col shadow-lg border-r border-gray-200 rounded-lg m-4 overflow-auto">
            <div>
                <h2 className="text-2xl font-medium text-gray-800 mb-6">Chapters</h2>
                <nav className="overflow-y-auto flex-1">
                    <ul className="space-y-2">
                        {sidebarData.map((item) => (
                            <li key={item.id}>
                                <button
                                    onClick={() => setActiveId(item.id)}
                                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors duration-200 ${activeId === item.id
                                            ? "bg-blue-100 text-blue-800 font-medium shadow-sm"
                                            : "hover:bg-blue-50 hover:text-gray-900"
                                        }`}
                                >
                                    {item.title}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </aside>
    );
}