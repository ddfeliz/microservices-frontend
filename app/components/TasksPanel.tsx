"use client";
import { useState, useEffect } from "react";
import { api } from "../../lib/api";

export default function TasksPanel() {
    const [tasks, setTasks] = useState<{ _id: string; title: string; status: string; priority: string; createdAt: Date }[]>([]);
    const [title, setTitle] = useState("");

    const load = async () => setTasks(await api.tasks.list());

    useEffect(() => {
        const fetchTasks = async () => {
            const taskList = await api.tasks.list();
            setTasks(taskList);
        };
        fetchTasks();
    }, []);

    const add = async () => {
        if (!title.trim()) return;
        await api.tasks.create({ title, status: "pending", priority: "high" });
        setTitle("");
        await load();
    };

    const remove = async (id: string) => {
        await api.tasks.delete(id);
        await load();
    };

    return (
        <div className="border rounded-lg p-4 bg-white shadow">
            <h2 className="text-lg font-bold mb-3 text-blue-600">📋 Tasks ({tasks.length})</h2>
            <div className="flex gap-2 mb-3">
                <input
                    className="border rounded px-2 py-1 flex-1 text-sm"
                    placeholder="Nouvelle tâche..."
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && add()}
                />
                <button onClick={add} className="bg-blue-500 text-white px-3 py-1 rounded text-sm">+</button>
            </div>
            <ul className="space-y-1 max-h-40 overflow-y-auto">
                {tasks.map((t: { _id: string; title: string; status: string; priority: string; createdAt: Date }) => (
                    <li key={t._id} className="flex justify-between items-center text-sm bg-gray-50 px-2 py-1 rounded">
                        <span>{t.title}</span>
                        <span className="text-gray-500">({t.status})</span>
                        <span className="text-gray-500">({t.priority})</span>
                        <span className="text-gray-500">({t.createdAt.toLocaleString()})</span>
                        <button onClick={() => remove(t._id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}